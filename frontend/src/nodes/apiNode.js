// apiNode.js - ENHANCED WITH DYNAMIC FIELDS & PROPER DATA FLOW
import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useState } from "react";

export const APINode = ({ id, data }) => {
  const [currentMethod, setCurrentMethod] = useState(data?.method || "GET");

  // Dynamic fields based on HTTP method
  const getFieldsForMethod = (method) => {
    const baseFields = [
      {
        name: "method",
        type: "select",
        label: "HTTP Method",
        defaultValue: "GET",
        options: [
          { value: "GET", label: "GET" },
          { value: "POST", label: "POST" },
          { value: "PUT", label: "PUT" },
          { value: "DELETE", label: "DELETE" },
          { value: "PATCH", label: "PATCH" },
          { value: "HEAD", label: "HEAD" },
        ],
        onChange: (value) => {
          setCurrentMethod(value);
          if (data) {
            data.method = value;
          }
        },
      },
      {
        name: "url",
        type: "text",
        label: "URL",
        defaultValue: "https://api.example.com",
        placeholder: "https://api.example.com/endpoint",
      },
      {
        name: "headers",
        type: "textarea",
        label: "Headers (JSON)",
        defaultValue: '{"Content-Type": "application/json"}',
        placeholder: "Enter headers as JSON object",
      },
      {
        name: "timeout",
        type: "number",
        label: "Timeout (seconds)",
        defaultValue: 30,
        min: 1,
        max: 300,
        step: 1,
      },
    ];

    // Add method-specific fields
    if (["POST", "PUT", "PATCH"].includes(method)) {
      return [
        ...baseFields,
        {
          name: "body",
          type: "textarea",
          label: "Request Body",
          defaultValue: "",
          placeholder: "Request body data",
        },
        {
          name: "bodyType",
          type: "select",
          label: "Body Type",
          defaultValue: "json",
          options: [
            { value: "json", label: "JSON" },
            { value: "form-data", label: "Form Data" },
            { value: "text", label: "Plain Text" },
            { value: "xml", label: "XML" },
          ],
        },
      ];
    }

    // For GET and other methods, add query parameters
    if (method === "GET") {
      return [
        ...baseFields,
        {
          name: "queryParams",
          type: "textarea",
          label: "Query Parameters (JSON)",
          defaultValue: "{}",
          placeholder: '{"param1": "value1", "param2": "value2"}',
        },
      ];
    }

    return baseFields;
  };

  const fields = getFieldsForMethod(currentMethod);

  const handles = [
    // Input handles
    {
      type: "target",
      position: Position.Left,
      id: `${id}-trigger`,
      style: { top: "25%" },
      className: "trigger-handle",
      label: "Trigger",
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-payload`,
      style: { top: "50%" },
      className: "data-handle",
      label: "Payload",
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-headers`,
      style: { top: "75%" },
      className: "headers-handle",
      label: "Headers",
    },

    // Output handles
    {
      type: "source",
      position: Position.Right,
      id: `${id}-response`,
      style: { top: "25%" },
      className: "success-handle",
      label: "Response",
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-error`,
      style: { top: "50%" },
      className: "error-handle",
      label: "Error",
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-headers-out`,
      style: { top: "75%" },
      className: "headers-out-handle",
      label: "Resp Headers",
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="🌐 API REQUEST"
      fields={fields}
      handles={handles}
      className="api-node"
      minWidth={300}
      minHeight={280}
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
        <strong style={{ color: "#4ecdc4" }}>Method:</strong> {currentMethod}
        <div style={{ marginTop: "4px", fontSize: "10px" }}>
          <strong>Inputs:</strong> Trigger | Payload | Headers
          <br />
          <strong>Outputs:</strong> Response | Error | Response Headers
        </div>
      </div>
    </BaseNode>
  );
};
