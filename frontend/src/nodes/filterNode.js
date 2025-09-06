// filterNode.js - ENHANCED WITH DYNAMIC FIELDS & PROPER DATA FLOW
import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useState } from "react";

export const FilterNode = ({ id, data }) => {
  const [currentFilterType, setCurrentFilterType] = useState(
    data?.filterType || "contains"
  );
  const [currentDataType, setCurrentDataType] = useState(
    data?.dataType || "string"
  );

  // Dynamic fields based on filter type
  const getFieldsForFilter = (filterType, dataType) => {
    const baseFields = [
      {
        name: "filterType",
        type: "select",
        label: "Filter Type",
        defaultValue: "contains",
        options: [
          { value: "contains", label: "Contains" },
          { value: "startsWith", label: "Starts With" },
          { value: "endsWith", label: "Ends With" },
          { value: "equals", label: "Equals" },
          { value: "notEquals", label: "Not Equals" },
          { value: "regex", label: "Regular Expression" },
          { value: "greater", label: "Greater Than" },
          { value: "less", label: "Less Than" },
          { value: "isEmpty", label: "Is Empty" },
          { value: "isNotEmpty", label: "Is Not Empty" },
        ],
        onChange: (value) => {
          setCurrentFilterType(value);
          if (data) {
            data.filterType = value;
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
          { value: "array", label: "Array" },
          { value: "object", label: "Object" },
        ],
        onChange: (value) => {
          setCurrentDataType(value);
          if (data) {
            data.dataType = value;
          }
        },
      },
    ];

    // Add filter-specific fields
    const additionalFields = [];

    // For most filters, we need a filter value
    if (!["isEmpty", "isNotEmpty"].includes(filterType)) {
      if (filterType === "regex") {
        additionalFields.push({
          name: "filterValue",
          type: "text",
          label: "Regular Expression",
          defaultValue: "",
          placeholder: "e.g., ^[A-Z][a-z]+$",
        });
      } else if (["greater", "less"].includes(filterType)) {
        additionalFields.push({
          name: "filterValue",
          type: "number",
          label: "Filter Value",
          defaultValue: 0,
          placeholder: "Numeric value to compare",
        });
      } else {
        additionalFields.push({
          name: "filterValue",
          type: "text",
          label: "Filter Value",
          defaultValue: "",
          placeholder: "Enter filter criteria",
        });
      }
    }

    // Add case sensitivity for string operations
    if (
      dataType === "string" &&
      ["contains", "startsWith", "endsWith", "equals", "notEquals"].includes(
        filterType
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
        label: "Field Path",
        defaultValue: "",
        placeholder: "e.g., 'name', 'items[0].value'",
      });
    }

    return [...baseFields, ...additionalFields];
  };

  const fields = getFieldsForFilter(currentFilterType, currentDataType);

  const handles = [
    // Input handle
    {
      type: "target",
      position: Position.Left,
      id: `${id}-data`,
      style: { top: "50%" },
      className: "data-handle",
      label: "Input",
    },
    // Output handles
    {
      type: "source",
      position: Position.Right,
      id: `${id}-filtered`,
      style: { top: "30%" },
      className: "success-handle",
      label: "Filtered",
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-excluded`,
      style: { top: "70%" },
      className: "error-handle",
      label: "Excluded",
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="🔍 FILTER"
      fields={fields}
      handles={handles}
      className="filter-node"
      minWidth={280}
      minHeight={220}
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
        <strong style={{ color: "#4ecdc4" }}>Filter:</strong>{" "}
        {currentFilterType} ({currentDataType})
        <div style={{ marginTop: "4px", fontSize: "10px" }}>
          <strong>Input:</strong> Data to filter
          <br />
          <strong>Outputs:</strong> ✅ Filtered | ❌ Excluded
        </div>
      </div>
    </BaseNode>
  );
};
