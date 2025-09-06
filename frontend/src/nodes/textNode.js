// textNode.js

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
      label: "Text",
      defaultValue: data?.text || "{{input}}",
      placeholder: "Enter text with variables like {{input}}",
      onChange: handleTextChange,
    },
  ];

  // Static handles
  const handles = [
    {
      type: "source",
      position: Position.Right,
      id: `${id}-output`,
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
        background: "#4ecdc4",
        border: "3px solid #fff",
        width: "18px",
        height: "18px",
      },
      className: "variable-handle",
      label: variable, // Add variable name as label
    }));
  }, [variables, id]);

  return (
    <>
      <BaseNode
        id={id}
        data={data}
        title="TEXT"
        fields={fields}
        handles={handles}
        dynamicHandles={dynamicHandles}
        className="text-node"
        minWidth={280}
        minHeight={150}
        isConnectable={isConnectable}
      >
        {/* Show detected variables */}
        {variables.length > 0 && (
          <div
            style={{
              fontSize: "11px",
              color: "#2d3748",
              marginTop: "10px",
              padding: "6px 10px",
              background: "rgba(255, 255, 255, 0.9)",
              borderRadius: "6px",
              border: "1px solid rgba(78, 205, 196, 0.5)",
              fontWeight: "600",
            }}
          >
            <strong style={{ color: "#4ecdc4" }}>Variables:</strong>{" "}
            {variables.map((v) => `{{${v}}}`).join(", ")}
          </div>
        )}
      </BaseNode>

      {/* Variable labels positioned next to handles */}
      {variables.map((variable, index) => (
        <div
          key={`label-${variable}-${index}`}
          style={{
            position: "absolute",
            left: "-70px",
            top: `${30 + index * 35 - 12}px`,
            fontSize: "11px",
            color: "#ffffff",
            fontWeight: "700",
            background: "linear-gradient(135deg, #4ecdc4 0%, #38d9a9 100%)",
            padding: "4px 8px",
            borderRadius: "4px",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 1000,
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
            textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
          }}
        >
          {variable}
        </div>
      ))}
    </>
  );
};
