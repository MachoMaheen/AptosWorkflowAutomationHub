// llmNode.js - ENHANCED WITH DYNAMIC FIELDS & PROPER DATA FLOW

import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useState } from "react";

export const LLMNode = ({ id, data }) => {
  const [currentModel, setCurrentModel] = useState(
    data?.model || "gpt-3.5-turbo"
  );

  // Dynamic fields based on model type
  const getFieldsForModel = (model) => {
    const baseFields = [
      {
        name: "model",
        type: "select",
        label: "Model",
        defaultValue: "gpt-3.5-turbo",
        options: [
          { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
          { value: "gpt-4", label: "GPT-4" },
          { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
          { value: "claude-3-haiku", label: "Claude 3 Haiku" },
          { value: "claude-3-sonnet", label: "Claude 3 Sonnet" },
          { value: "gemini-pro", label: "Gemini Pro" },
          { value: "custom", label: "Custom Model" },
        ],
        onChange: (value) => {
          setCurrentModel(value);
          if (data) {
            data.model = value;
          }
        },
      },
      {
        name: "temperature",
        type: "number",
        label: "Temperature",
        defaultValue: 0.7,
        min: 0,
        max: 2,
        step: 0.1,
      },
      {
        name: "maxTokens",
        type: "number",
        label: "Max Tokens",
        defaultValue: 1000,
        min: 1,
        max: 4000,
        step: 100,
      },
    ];

    // Add model-specific fields
    if (model === "custom") {
      return [
        ...baseFields,
        {
          name: "customModelName",
          type: "text",
          label: "Custom Model Name",
          defaultValue: "",
          placeholder: "e.g., my-custom-model",
        },
        {
          name: "apiEndpoint",
          type: "text",
          label: "API Endpoint",
          defaultValue: "",
          placeholder: "https://api.example.com/v1/chat/completions",
        },
      ];
    }

    return baseFields;
  };

  const fields = getFieldsForModel(currentModel);

  const handles = [
    {
      type: "target",
      position: Position.Left,
      id: `${id}-system`,
      style: { top: "25%" },
      className: "data-handle",
      label: "System",
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-prompt`,
      style: { top: "50%" },
      className: "data-handle",
      label: "Prompt",
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-context`,
      style: { top: "75%" },
      className: "data-handle",
      label: "Context",
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-response`,
      style: { top: "40%" },
      className: "data-handle",
      label: "Response",
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-metadata`,
      style: { top: "70%" },
      className: "metadata-handle",
      label: "Metadata",
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="🤖 LLM"
      fields={fields}
      handles={handles}
      className="llm-node"
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
        <strong style={{ color: "#4ecdc4" }}>Model:</strong> {currentModel}
        <div style={{ marginTop: "4px", fontSize: "10px" }}>
          <strong>Inputs:</strong> System | Prompt | Context
          <br />
          <strong>Outputs:</strong> Response | Metadata
        </div>
      </div>
    </BaseNode>
  );
};
