// filterNode.js
// Demonstrates data filtering node

import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";

export const FilterNode = ({ id, data }) => {
  const fields = [
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
        { value: "regex", label: "Regular Expression" },
      ],
    },
    {
      name: "filterValue",
      type: "text",
      label: "Filter Value",
      defaultValue: "",
      placeholder: "Enter filter criteria",
    },
    {
      name: "caseSensitive",
      type: "select",
      label: "Case Sensitive",
      defaultValue: "false",
      options: [
        { value: "true", label: "Yes" },
        { value: "false", label: "No" },
      ],
    },
  ];

  const handles = [
    {
      type: "target",
      position: Position.Left,
      id: `${id}-data`,
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-filtered`,
      style: { top: "40%" },
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-excluded`,
      style: { top: "70%" },
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="Filter"
      fields={fields}
      handles={handles}
      className="filter-node"
    />
  );
};
