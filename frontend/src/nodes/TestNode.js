// TestNode.js - Simple test node to debug handle visibility
import React from "react";
import { Handle, Position } from "@xyflow/react";

export const TestNode = ({ id, data }) => {
  return (
    <div
      style={{
        background: "#fff",
        border: "2px solid #4ecdc4",
        borderRadius: "8px",
        padding: "20px",
        minWidth: "150px",
        minHeight: "100px",
        position: "relative",
      }}
    >
      {/* LEFT HANDLE - INPUT */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-input`}
        style={{
          background: "#ff6b6b",
          width: "20px",
          height: "20px",
          border: "3px solid #fff",
          left: "-15px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 1000,
        }}
      />

      {/* RIGHT HANDLE - OUTPUT */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-output`}
        style={{
          background: "#4ecdc4",
          width: "20px",
          height: "20px",
          border: "3px solid #fff",
          right: "-15px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 1000,
        }}
      />

      <div style={{ textAlign: "center", fontWeight: "bold", color: "#333" }}>
        🧪 TEST NODE
      </div>
      <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
        {id}
      </div>

      {/* Debug info */}
      <div
        style={{
          fontSize: "10px",
          color: "#999",
          marginTop: "10px",
          background: "#f9f9f9",
          padding: "5px",
          borderRadius: "4px",
        }}
      >
        Handles should be visible
      </div>
    </div>
  );
};
