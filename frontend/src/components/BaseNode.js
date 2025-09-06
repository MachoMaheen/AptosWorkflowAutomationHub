// BaseNode.js
// Abstract base component for all nodes to eliminate code duplication

import React, { useState, useMemo, useCallback } from "react";
import { Handle } from "@xyflow/react";
import "./BaseNode.css";

// Handle Label Component
const HandleLabel = ({ handle, nodeId }) => {
  if (!handle.label) return null;

  const isTarget = handle.type === "target";
  const labelStyle = {
    position: "absolute",
    fontSize: "9px",
    fontWeight: "600",
    color: "#ffffff",
    background: handle.style?.background || "#4ecdc4",
    padding: "2px 6px",
    borderRadius: "3px",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    zIndex: 1000,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
    // Position based on handle type and position
    ...(isTarget
      ? {
          right: "100%",
          marginRight: "8px",
        }
      : {
          left: "100%",
          marginLeft: "8px",
        }),
    top: "50%",
    transform: "translateY(-50%)",
  };

  return <div style={labelStyle}>{handle.label}</div>;
};

export const BaseNode = ({
  id,
  data,
  title,
  fields = [],
  handles = [],
  children,
  dynamicHandles = [],
  className = "",
  minWidth = 220,
  minHeight = 100,
  isConnectable = true,
}) => {
  // Create state for all field values
  const [fieldValues, setFieldValues] = useState(() => {
    const initialValues = {};
    fields.forEach((field) => {
      initialValues[field.name] =
        data?.[field.name] || field.defaultValue || "";
    });
    return initialValues;
  });

  // State for minimize/maximize functionality
  const [isMinimized, setIsMinimized] = useState(data?.isMinimized || false);

  // Always show full form by default
  if (data && data.isMinimized === undefined) {
    data.isMinimized = false;
  }

  // Handle minimize/maximize toggle
  const toggleMinimize = useCallback(
    (e) => {
      e.stopPropagation();
      const newMinimized = !isMinimized;
      setIsMinimized(newMinimized);
      if (data) {
        data.isMinimized = newMinimized;
      }
    },
    [isMinimized, data]
  );

  // Handle field changes
  const handleFieldChange = useCallback(
    (fieldName, value) => {
      setFieldValues((prev) => ({
        ...prev,
        [fieldName]: value,
      }));

      // Update the data object directly for ReactFlow instead of using store
      if (data) {
        data[fieldName] = value;
      }

      // Call custom onChange if provided
      const field = fields.find((f) => f.name === fieldName);
      if (field?.onChange) {
        field.onChange(value, fieldValues);
      }
    },
    [fields, fieldValues, data]
  );

  // Calculate dynamic size based on content
  const dynamicStyle = useMemo(() => {
    let width = minWidth;
    let height = minHeight;

    // If minimized, use compact dimensions but keep it readable
    if (isMinimized) {
      return {
        width: Math.max(200, minWidth * 0.9),
        height: fields.length > 0 ? 80 : 60,
        transition: "all 0.3s ease",
      };
    }

    // Calculate minimum width based on fields and content
    let contentBasedWidth = minWidth;
    let contentBasedHeight = minHeight;

    // Base height for header
    contentBasedHeight += 35;

    fields.forEach((field) => {
      // Account for label text length
      const labelLength = field.label ? field.label.length : 0;
      const labelWidth = Math.max(80, labelLength * 8 + 40);

      // Height calculation per field type - Reduced heights for more compactness
      let fieldHeight = 0;

      if (field.type === "textarea") {
        const value = fieldValues[field.name] || field.placeholder || "";
        const lines = Math.max(2, value.split("\n").length); // Reduced minimum lines
        fieldHeight = 16 + lines * 14 + 2; // Further reduced height for textarea

        // For textarea, consider the longest line
        const longestLine = value
          .split("\n")
          .reduce((max, line) => (line.length > max ? line.length : max), 0);
        const textWidth = Math.max(250, Math.min(450, longestLine * 9 + 60)); // Wider textarea
        contentBasedWidth = Math.max(contentBasedWidth, textWidth, labelWidth);
      } else if (field.type === "text" || field.type === "number") {
        fieldHeight = 32; // Further reduced height for inputs

        // For text inputs, ensure they can display content properly
        const value = fieldValues[field.name] || field.placeholder || "";
        const textLength = Math.max(
          value.length,
          field.placeholder ? field.placeholder.length : 0
        );
        const textWidth = Math.max(250, Math.min(400, textLength * 9 + 60)); // Wider inputs
        contentBasedWidth = Math.max(contentBasedWidth, textWidth, labelWidth);
      } else if (field.type === "select") {
        fieldHeight = 32; // Further reduced height for selects

        // For selects, consider option text lengths
        const maxOptionLength = field.options
          ? field.options.reduce(
              (max, opt) => (opt.label.length > max ? opt.label.length : max),
              0
            )
          : 0;
        const selectWidth = Math.max(
          250,
          Math.min(400, maxOptionLength * 9 + 80)
        ); // Wider selects
        contentBasedWidth = Math.max(
          contentBasedWidth,
          selectWidth,
          labelWidth
        );
      } else {
        fieldHeight = 28; // Further reduced default field height
        contentBasedWidth = Math.max(contentBasedWidth, labelWidth);
      }

      contentBasedHeight += fieldHeight + 2; // Minimal padding between fields
    });

    // Add minimal space for children content (like execute buttons)
    if (fields.length > 0 && children) {
      contentBasedHeight += 10; // Reduced extra space
    }

    // Ensure we have at least the minimum dimensions
    width = Math.max(width, contentBasedWidth + 30); // Extra padding on sides
    height = Math.max(height, contentBasedHeight + 10); // Reduced bottom padding

    return { width, height, transition: "all 0.3s ease" };
  }, [fieldValues, fields, minWidth, minHeight, isMinimized]);

  // Render field based on type
  const renderField = (field) => {
    const value = fieldValues[field.name] || "";

    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="node-input"
          />
        );

      case "textarea":
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="node-textarea"
            rows={Math.max(2, value.split("\n").length)}
          />
        );

      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="node-select"
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            className="node-input"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`base-node ${className}`} style={dynamicStyle}>
      {/* Render static handles with labels */}
      {handles.map((handle, index) => (
        <div
          key={`handle-container-${handle.type}-${handle.position}-${index}`}
          style={{ position: "relative" }}
        >
          <Handle
            type={handle.type}
            position={handle.position}
            id={handle.id || `${id}-${handle.type}-${index}`}
            style={handle.style}
            className={handle.className}
            isConnectable={isConnectable}
          />
          <HandleLabel handle={handle} nodeId={id} />
        </div>
      ))}

      {/* Render dynamic handles with labels */}
      {dynamicHandles.map((handle, index) => (
        <div
          key={`dynamic-handle-container-${handle.id}-${index}`}
          style={{ position: "relative" }}
        >
          <Handle
            type={handle.type}
            position={handle.position}
            id={handle.id}
            style={handle.style}
            className={handle.className}
            isConnectable={isConnectable}
          />
          <HandleLabel handle={handle} nodeId={id} />
        </div>
      ))}

      {/* Node header */}
      <div className="node-header">
        <span className="node-title">{title}</span>
        <button
          className="node-toggle-btn"
          onClick={toggleMinimize}
          title={isMinimized ? "Expand node" : "Minimize node"}
        >
          {isMinimized ? "⬆" : "⬇"}
        </button>
      </div>

      {/* Node content - show preview when minimized, full content when expanded */}
      {isMinimized ? (
        <div className="node-content-preview">
          {fields.length > 0 && (
            <div className="node-field-preview">
              <span className="preview-text">
                {fields.length} field{fields.length !== 1 ? "s" : ""} • Click ⬆
                to expand
              </span>
            </div>
          )}
          {children && <div className="preview-children">{children}</div>}
        </div>
      ) : (
        <div className="node-content">
          {fields.map((field) => (
            <div key={field.name} className="node-field">
              {field.label && (
                <label className="node-label">{field.label}:</label>
              )}
              {renderField(field)}
            </div>
          ))}
          {children}
        </div>
      )}
    </div>
  );
};
