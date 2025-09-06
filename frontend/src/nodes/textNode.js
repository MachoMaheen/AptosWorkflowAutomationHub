// textNode.js - ENHANCED WITH DYNAMIC FIELDS & PROPER DATA FLOW

import { useMemo, useCallback } from "react";
import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";

export const TextNode = ({ id, data, isConnectable }) => {
  // Extract variables from text using regex
  const extractVariables = useCallback((textContent) => {
    const variableRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
    const variables = [];
    let match;

    while ((match = variableRegex.exec(textContent)) !== null) {
      const variableName = match[1].trim();
      if (!variables.includes(variableName)) {
        variables.push(variableName);
      }
    }

    return variables;
  }, []);

  // Custom onChange handler for text field to update variables
  const handleTextChange = useCallback(
    (value, fieldValues) => {
      // Store the current text in data
      if (data) {
        data.text = value;
        data.variables = extractVariables(value);
      }
    },
    [data, extractVariables]
  );

  // Define fields for BaseNode
  const fields = [
    {
      name: "text",
      type: "textarea",
      label: "Text Template",
      defaultValue: data?.text || "{{input}}",
      placeholder: "Enter text with variables like {{input}}",
      onChange: handleTextChange,
    },
    {
      name: "outputFormat",
      type: "select",
      label: "Output Format",
      defaultValue: "text",
      options: [
        { value: "text", label: "Plain Text" },
        { value: "markdown", label: "Markdown" },
        { value: "html", label: "HTML" },
      ],
    },
  ];

  // Static handles
  const handles = [
    {
      type: "source",
      position: Position.Right,
      id: `${id}-output`,
      style: { top: "50%" },
      className: "data-handle",
      label: "Output",
    },
  ];

  // Get current text value
  const currentText = data?.text || "{{input}}";
  const variables = useMemo(
    () => extractVariables(currentText),
    [currentText, extractVariables]
  );

  // Create dynamic handles for detected variables
  const dynamicHandles = useMemo(() => {
    return variables.map((variable, index) => ({
      type: "target",
      position: Position.Left,
      id: `${id}-${variable}`,
      style: {
        top: `${30 + index * 35}px`,
      },
      className: "data-handle",
      label: variable,
    }));
  }, [variables, id]);

  return (
    <BaseNode
      id={id}
      data={data}
      title="📝 TEXT"
      fields={fields}
      handles={handles}
      dynamicHandles={dynamicHandles}
      className="text-node"
      minWidth={300}
      minHeight={200}
      isConnectable={isConnectable}
    >
      {/* Show detected variables */}
      {variables.length > 0 && (
        <div
          style={{
            fontSize: "11px",
            color: "#2d3748",
            marginTop: "10px",
            padding: "8px 12px",
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: "6px",
            border: "1px solid rgba(78, 205, 196, 0.5)",
          }}
        >
          <strong style={{ color: "#4ecdc4" }}>Variables:</strong>{" "}
          {variables.map((v) => `{{${v}}}`).join(", ")}
          <div style={{ marginTop: "4px", fontSize: "10px" }}>
            <strong>Inputs:</strong> Variable values
            <br />
            <strong>Output:</strong> Processed text
          </div>
        </div>
      )}
    </BaseNode>
  );
};
