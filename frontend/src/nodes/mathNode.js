// mathNode.js - ENHANCED WITH DYNAMIC FIELDS & PROPER DATA FLOW

import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useState } from "react";

export const MathNode = ({ id, data }) => {
  const [currentOperation, setCurrentOperation] = useState(
    data?.operation || "add"
  );

  // Dynamic fields based on operation type
  const getFieldsForOperation = (operation) => {
    const baseFields = [
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
          { value: "modulo", label: "Modulo (%)" },
          { value: "sqrt", label: "Square Root (√)" },
          { value: "abs", label: "Absolute Value (|x|)" },
          { value: "round", label: "Round" },
          { value: "floor", label: "Floor" },
          { value: "ceil", label: "Ceiling" },
          { value: "min", label: "Minimum" },
          { value: "max", label: "Maximum" },
        ],
        onChange: (value) => {
          setCurrentOperation(value);
          if (data) {
            data.operation = value;
          }
        },
      },
    ];

    // Add operation-specific fields
    const additionalFields = [];

    // For operations that need precision
    if (["divide", "sqrt", "power"].includes(operation)) {
      additionalFields.push({
        name: "precision",
        type: "number",
        label: "Decimal Places",
        defaultValue: 2,
        min: 0,
        max: 10,
        step: 1,
      });
    }

    // For rounding operations
    if (["round", "floor", "ceil"].includes(operation)) {
      additionalFields.push({
        name: "precision",
        type: "number",
        label: "Decimal Places",
        defaultValue: 0,
        min: 0,
        max: 10,
        step: 1,
      });
    }

    // For min/max operations
    if (["min", "max"].includes(operation)) {
      additionalFields.push({
        name: "inputCount",
        type: "number",
        label: "Number of Inputs",
        defaultValue: 2,
        min: 2,
        max: 10,
        step: 1,
      });
    }

    return [...baseFields, ...additionalFields];
  };

  const fields = getFieldsForOperation(currentOperation);

  // Dynamic handles based on operation
  const getHandlesForOperation = (operation) => {
    const baseHandles = [
      {
        type: "source",
        position: Position.Right,
        id: `${id}-result`,
        style: { top: "50%" },
        className: "data-handle",
        label: "Result",
      },
    ];

    // Single input operations
    if (["sqrt", "abs", "round", "floor", "ceil"].includes(operation)) {
      baseHandles.unshift({
        type: "target",
        position: Position.Left,
        id: `${id}-input`,
        style: { top: "50%" },
        className: "data-handle",
        label: "Input",
      });
    }
    // Two input operations
    else if (!["min", "max"].includes(operation)) {
      baseHandles.unshift(
        {
          type: "target",
          position: Position.Left,
          id: `${id}-input1`,
          style: { top: "35%" },
          className: "data-handle",
          label: "Input 1",
        },
        {
          type: "target",
          position: Position.Left,
          id: `${id}-input2`,
          style: { top: "65%" },
          className: "data-handle",
          label: "Input 2",
        }
      );
    }
    // Multiple input operations (min/max)
    else {
      const inputCount = data?.inputCount || 2;
      for (let i = 1; i <= inputCount; i++) {
        baseHandles.unshift({
          type: "target",
          position: Position.Left,
          id: `${id}-input${i}`,
          style: { top: `${20 + ((i - 1) * 60) / inputCount}%` },
          className: "data-handle",
          label: `Input ${i}`,
        });
      }
    }

    return baseHandles;
  };

  const handles = getHandlesForOperation(currentOperation);

  return (
    <BaseNode
      id={id}
      data={data}
      title="🔢 MATH"
      fields={fields}
      handles={handles}
      className="math-node"
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
        <strong style={{ color: "#4ecdc4" }}>Operation:</strong>{" "}
        {currentOperation}
        <div style={{ marginTop: "4px", fontSize: "10px" }}>
          <strong>Inputs:</strong> Numbers to calculate
          <br />
          <strong>Output:</strong> Calculation result
        </div>
      </div>
    </BaseNode>
  );
};
