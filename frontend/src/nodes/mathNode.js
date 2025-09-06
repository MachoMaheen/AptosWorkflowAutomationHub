// mathNode.js
// Demonstrates mathematical operations node

import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";

export const MathNode = ({ id, data }) => {
  const fields = [
    {
      name: "operation",
      type: "select",
      label: "Operation",
      defaultValue: "add",
      options: [
        { value: "add", label: "Addition (+)" },
        { value: "subtract", label: "Subtraction (-)" },
        { value: "multiply", label: "Multiplication (×)" },
        { value: "divide", label: "Division (÷)" },
        { value: "power", label: "Power (^)" },
        { value: "sqrt", label: "Square Root (√)" },
      ],
    },
    {
      name: "precision",
      type: "number",
      label: "Decimal Places",
      defaultValue: 2,
      min: 0,
      max: 10,
      step: 1,
    },
  ];

  const handles = [
    {
      type: "target",
      position: Position.Left,
      id: `${id}-input1`,
      style: { top: "30%" },
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-input2`,
      style: { top: "70%" },
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-result`,
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="MATH"
      fields={fields}
      handles={handles}
      className="math-node"
      minWidth={240}
      minHeight={160}
    />
  );
};
