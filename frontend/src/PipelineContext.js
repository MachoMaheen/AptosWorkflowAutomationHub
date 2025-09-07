// PipelineContext.js - Workflow validation and data flow management
import React, { createContext, useContext, useCallback } from "react";

const PipelineContext = createContext(null);

export const usePipeline = () => {
  const context = useContext(PipelineContext);
  if (!context) {
    throw new Error("usePipeline must be used within a PipelineProvider");
  }
  return context;
};

export const PipelineProvider = ({ children }) => {
  // Validate connections between nodes with enhanced n8n-style logic
  const isValidConnection = useCallback((connection) => {
    const { source, target, sourceHandle, targetHandle } = connection;

    console.log("Validating connection:", {
      source,
      target,
      sourceHandle,
      targetHandle,
    });

    // Prevent self-connections
    if (source === target) {
      console.log("❌ Self-connection not allowed");
      return false;
    }

    // Basic validation: source must have sourceHandle, target must have targetHandle
    if (!sourceHandle || !targetHandle) {
      console.log("❌ Missing handle information");
      return false;
    }

    // Extract handle types and node types from handle IDs
    const getHandleType = (handleId) => {
      if (!handleId) return "unknown";
      const lowerHandle = handleId.toLowerCase();
      if (lowerHandle.includes("trigger")) return "trigger";
      if (lowerHandle.includes("data") || lowerHandle.includes("event-data"))
        return "data";
      if (lowerHandle.includes("success")) return "success";
      if (lowerHandle.includes("error")) return "error";
      if (lowerHandle.includes("condition")) return "condition";
      if (lowerHandle.includes("metadata")) return "metadata";
      if (lowerHandle.includes("transaction")) return "transaction";
      if (lowerHandle.includes("event")) return "event";
      if (lowerHandle.includes("value")) return "data"; // Input/Output node values
      if (lowerHandle.includes("address") || lowerHandle.includes("balance"))
        return "data";
      return "data"; // Default to data for compatibility
    };

    const sourceType = getHandleType(sourceHandle);
    const targetType = getHandleType(targetHandle);

    console.log("Handle types:", { sourceType, targetType });

    // Define valid connection patterns (relaxed for demo)
    const validConnectionPatterns = {
      trigger: ["trigger", "condition", "data"], // More flexible
      data: ["data", "condition", "transaction", "trigger"], // More flexible
      success: ["data", "trigger", "condition"],
      error: ["data", "trigger", "condition"],
      metadata: ["data", "condition", "trigger"],
      transaction: ["data", "trigger", "condition"],
      event: ["data", "trigger", "condition"], // Add event support
      unknown: ["data", "trigger", "condition"], // Allow unknown types
    };

    // Check if this connection pattern is valid
    const validTargets = validConnectionPatterns[sourceType];
    const isPatternValid = validTargets?.includes(targetType);

    console.log("Connection validation result:", {
      isPatternValid,
      validTargets,
    });

    if (!isPatternValid) {
      console.log(
        `❌ Invalid connection pattern: ${sourceType} → ${targetType}`
      );
      return false;
    }

    console.log(`✅ Valid connection: ${sourceType} → ${targetType}`);
    return true;
  }, []);

  // Handle data flow between nodes
  const processNodeData = useCallback(async (nodeId, inputData) => {
    // Process data based on node type and configuration
    // This would be implemented based on your specific node types
    return inputData;
  }, []);

  // Execute workflow
  const executeWorkflow = useCallback(
    async (nodes, edges, startNodeId) => {
      const visited = new Set();
      const results = new Map();

      const executeNode = async (nodeId) => {
        if (visited.has(nodeId)) return results.get(nodeId);
        visited.add(nodeId);

        // Get input edges for this node
        const inputEdges = edges.filter((edge) => edge.target === nodeId);

        // Get input data from parent nodes
        const inputData = await Promise.all(
          inputEdges.map(async (edge) => {
            const parentData = await executeNode(edge.source);
            return {
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle,
              data: parentData,
            };
          })
        );

        // Process this node
        const result = await processNodeData(nodeId, inputData);
        results.set(nodeId, result);
        return result;
      };

      // Start execution from the specified node
      return await executeNode(startNodeId);
    },
    [processNodeData]
  );

  const value = {
    isValidConnection,
    executeWorkflow,
    processNodeData,
  };

  return (
    <PipelineContext.Provider value={value}>
      {children}
    </PipelineContext.Provider>
  );
};
