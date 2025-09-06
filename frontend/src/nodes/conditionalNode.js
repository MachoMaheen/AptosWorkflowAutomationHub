// conditionalNode.js
// Demonstrates conditional logic node

import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";

export const ConditionalNode = ({ id, data }) => {
  const fields = [
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
        { value: "isEmpty", label: "Is Empty" },
      ],
    },
    {
      name: "compareValue",
      type: "text",
      label: "Compare Value",
      defaultValue: "",
      placeholder: "Value to compare against",
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
      ],
    },
  ];

  const handles = [
    {
      type: "target",
      position: Position.Left,
      id: `${id}-input`,
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-true`,
      style: { top: "30%" },
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-false`,
      style: { top: "70%" },
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="Conditional"
      fields={fields}
      handles={handles}
      className="conditional-node"
    />
  );
};
