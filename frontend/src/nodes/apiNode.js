// apiNode.js
// Demonstrates API integration node

import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";

export const APINode = ({ id, data }) => {
  const fields = [
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
      ],
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

  const handles = [
    {
      type: "target",
      position: Position.Left,
      id: `${id}-payload`,
      style: { top: "30%" },
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-trigger`,
      style: { top: "70%" },
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-response`,
      style: { top: "30%" },
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-error`,
      style: { top: "70%" },
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="API"
      fields={fields}
      handles={handles}
      className="api-node"
      minWidth={280}
      minHeight={220}
    />
  );
};
