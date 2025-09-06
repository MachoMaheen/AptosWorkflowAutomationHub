// conditionalNode.js - ENHANCED WITH DYNAMIC FIELDS & PROPER DATA FLOW
import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useState } from "react";

export const ConditionalNode = ({ id, data }) => {
  const [currentCondition, setCurrentCondition] = useState(
    data?.condition || "equals"
  );
  const [currentDataType, setCurrentDataType] = useState(
    data?.dataType || "string"
  );

  // Dynamic fields based on condition type
  const getFieldsForCondition = (condition, dataType) => {
    const baseFields = [
      {
        name: "condition",
        type: "select",
        label: "Condition",
        defaultValue: "equals",
        options: [
          { value: "equals", label: "Equals (==)" },
          { value: "notEquals", label: "Not Equals (!=)" },
          { value: "greater", label: "Greater Than (>)" },
          { value: "less", label: "Less Than (<)" },
          { value: "greaterEqual", label: "Greater or Equal (>=)" },
          { value: "lessEqual", label: "Less or Equal (<=)" },
          { value: "contains", label: "Contains" },
          { value: "startsWith", label: "Starts With" },
          { value: "endsWith", label: "Ends With" },
          { value: "isEmpty", label: "Is Empty" },
          { value: "isNotEmpty", label: "Is Not Empty" },
          { value: "hasProperty", label: "Has Property" },
          { value: "inArray", label: "In Array" },
        ],
        onChange: (value) => {
          setCurrentCondition(value);
          if (data) {
            data.condition = value;
          }
        },
      },
      {
        name: "dataType",
        type: "select",
        label: "Data Type",
        defaultValue: "string",
        options: [
          { value: "string", label: "String" },
          { value: "number", label: "Number" },
          { value: "boolean", label: "Boolean" },
          { value: "date", label: "Date" },
          { value: "object", label: "Object" },
          { value: "array", label: "Array" },
        ],
        onChange: (value) => {
          setCurrentDataType(value);
          if (data) {
            data.dataType = value;
          }
        },
      },
    ];

    // Add condition-specific fields
    const additionalFields = [];

    // For most conditions, we need a compare value
    if (!["isEmpty", "isNotEmpty"].includes(condition)) {
      if (condition === "inArray") {
        additionalFields.push({
          name: "compareValue",
          type: "textarea",
          label: "Compare Value (JSON Array)",
          defaultValue: "[]",
          placeholder: '["value1", "value2", "value3"]',
        });
      } else if (condition === "hasProperty") {
        additionalFields.push({
          name: "compareValue",
          type: "text",
          label: "Property Path",
          defaultValue: "",
          placeholder: "e.g., 'amount', 'user.name', 'data[0].value'",
        });
      } else {
        additionalFields.push({
          name: "compareValue",
          type: "text",
          label: "Compare Value",
          defaultValue: "",
          placeholder: `Value to compare against (${dataType})`,
        });
      }
    }

    // Add case sensitivity for string operations
    if (
      dataType === "string" &&
      ["contains", "startsWith", "endsWith", "equals", "notEquals"].includes(
        condition
      )
    ) {
      additionalFields.push({
        name: "caseSensitive",
        type: "select",
        label: "Case Sensitive",
        defaultValue: "false",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ],
      });
    }

    // Add field path for complex objects
    if (dataType === "object") {
      additionalFields.push({
        name: "fieldPath",
        type: "text",
        label: "Field Path (Optional)",
        defaultValue: "",
        placeholder: "e.g., 'amount', 'user.address', 'data[0].value'",
      });
    }

    return [...baseFields, ...additionalFields];
  };

  const fields = getFieldsForCondition(currentCondition, currentDataType);

  const handles = [
    // Input handle
    {
      type: "target",
      position: Position.Left,
      id: `${id}-input`,
      style: { top: "50%" },
      className: "data-handle",
      label: "Input",
    },
    // Output handles
    {
      type: "source",
      position: Position.Right,
      id: `${id}-true`,
      style: { top: "30%" },
      className: "success-handle",
      label: "True",
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-false`,
      style: { top: "70%" },
      className: "error-handle",
      label: "False",
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="🔀 CONDITIONAL"
      fields={fields}
      handles={handles}
      className="conditional-node"
      minWidth={300}
      minHeight={250}
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
        <strong style={{ color: "#4ecdc4" }}>Logic:</strong> {currentCondition}{" "}
        ({currentDataType})
        <div style={{ marginTop: "4px", fontSize: "10px" }}>
          <strong>Input:</strong> Data to evaluate
          <br />
          <strong>Outputs:</strong> ✅ True | ❌ False
        </div>
      </div>
    </BaseNode>
  );
};
