// inputNode.js - ENHANCED WITH DYNAMIC FIELDS & PROPER DATA FLOW

import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useState } from "react";

export const InputNode = ({ id, data }) => {
  const [currentInputType, setCurrentInputType] = useState(
    data?.inputType || "Text"
  );

  // Dynamic fields based on input type
  const getFieldsForInputType = (inputType) => {
    const baseFields = [
      {
        name: "inputName",
        type: "text",
        label: "Name",
        defaultValue: id.replace("customInput-", "input_"),
        placeholder: "Enter input name",
      },
      {
        name: "inputType",
        type: "select",
        label: "Type",
        defaultValue: "Text",
        options: [
          { value: "Text", label: "Text" },
          { value: "Number", label: "Number" },
          { value: "Boolean", label: "Boolean" },
          { value: "File", label: "File" },
          { value: "JSON", label: "JSON" },
          { value: "Date", label: "Date" },
        ],
        onChange: (value) => {
          setCurrentInputType(value);
          if (data) {
            data.inputType = value;
          }
        },
      },
    ];

    // Add type-specific fields
    switch (inputType) {
      case "Text":
        return [
          ...baseFields,
          {
            name: "defaultValue",
            type: "text",
            label: "Default Value",
            defaultValue: "",
            placeholder: "Default text value",
          },
          {
            name: "placeholder",
            type: "text",
            label: "Placeholder",
            defaultValue: "",
            placeholder: "Input placeholder text",
          },
        ];

      case "Number":
        return [
          ...baseFields,
          {
            name: "defaultValue",
            type: "number",
            label: "Default Value",
            defaultValue: 0,
            placeholder: "Default numeric value",
          },
          {
            name: "min",
            type: "number",
            label: "Minimum",
            defaultValue: "",
            placeholder: "Minimum value",
          },
          {
            name: "max",
            type: "number",
            label: "Maximum",
            defaultValue: "",
            placeholder: "Maximum value",
          },
        ];

      case "Boolean":
        return [
          ...baseFields,
          {
            name: "defaultValue",
            type: "select",
            label: "Default Value",
            defaultValue: "false",
            options: [
              { value: "true", label: "True" },
              { value: "false", label: "False" },
            ],
          },
        ];

      case "File":
        return [
          ...baseFields,
          {
            name: "accept",
            type: "text",
            label: "Accept Types",
            defaultValue: "*/*",
            placeholder: ".jpg,.png,.pdf or */*",
          },
          {
            name: "multiple",
            type: "select",
            label: "Multiple Files",
            defaultValue: "false",
            options: [
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ],
          },
        ];

      case "JSON":
        return [
          ...baseFields,
          {
            name: "defaultValue",
            type: "textarea",
            label: "Default JSON",
            defaultValue: "{}",
            placeholder: "Default JSON object",
          },
          {
            name: "schema",
            type: "textarea",
            label: "JSON Schema (Optional)",
            defaultValue: "",
            placeholder: "JSON schema for validation",
          },
        ];

      case "Date":
        return [
          ...baseFields,
          {
            name: "defaultValue",
            type: "text",
            label: "Default Date",
            defaultValue: "",
            placeholder: "YYYY-MM-DD or leave empty",
          },
          {
            name: "format",
            type: "select",
            label: "Date Format",
            defaultValue: "YYYY-MM-DD",
            options: [
              { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
              { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
              { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
            ],
          },
        ];

      default:
        return baseFields;
    }
  };

  const fields = getFieldsForInputType(currentInputType);

  const handles = [
    {
      type: "source",
      position: Position.Right,
      id: `${id}-value`,
      style: {
        top: "50%",
        background: "#4ecdc4",
        border: "3px solid #fff",
      },
      className: "data-handle",
      label: "Value",
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-metadata`,
      style: {
        top: "75%",
        background: "#9b59b6",
        border: "3px solid #fff",
      },
      className: "metadata-handle",
      label: "Meta",
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="📥 INPUT"
      fields={fields}
      handles={handles}
      className="input-node"
      minWidth={280}
      minHeight={200}
    >
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
        <strong style={{ color: "#4ecdc4" }}>Type:</strong> {currentInputType}
        <div style={{ marginTop: "4px", fontSize: "10px" }}>
          <strong>Output:</strong> Input value for workflow
        </div>
      </div>
    </BaseNode>
  );
};
