// llmNode.js

import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";

export const LLMNode = ({ id, data }) => {
  const handles = [
    {
      type: "target",
      position: Position.Left,
      id: `${id}-system`,
      style: { top: "33%" },
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-prompt`,
      style: { top: "67%" },
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-response`,
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="LLM"
      handles={handles}
      className="llm-node"
      minWidth={240}
      minHeight={140}
    >
      <div
        style={{
          padding: "12px 0",
          fontSize: "13px",
          color: "rgba(255, 255, 255, 0.9)",
          textAlign: "center",
          fontWeight: "500",
        }}
      >
        Large Language Model
      </div>
    </BaseNode>
  );
};
