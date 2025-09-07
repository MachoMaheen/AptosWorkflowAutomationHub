// workflowEngine.js - REAL TRANSACTION workflow execution engine
// NO SIMULATION - Only real wallet transactions like individual node testing
import { useCallback, useRef, useEffect } from "react";
import { toast } from "react-hot-toast";

export const useWorkflowEngine = (nodes, edges, nodeRefs) => {
  const workflowState = useRef({
    activeWorkflowId: null,
    isExecuting: false,
    executionHistory: [],
  });

  // 🔥 MAIN FUNCTION: Handle WebSocket events and trigger REAL transactions
  const handleWebSocketEvent = useCallback(
    async (eventData) => {
      console.log(
        "🎯 REAL Workflow Engine - Processing WebSocket event:",
        eventData
      );

      try {
        // Handle different types of events from backend
        switch (eventData.type) {
          case "action_executed":
            // Backend executed a simulated action - trigger REAL wallet transaction
            await executeRealWalletTransaction(eventData);
            break;

          case "workflow_started":
            handleWorkflowStarted(eventData);
            break;

          case "workflow_stopped":
            handleWorkflowStopped(eventData);
            break;

          default:
            console.log("📝 Unhandled event type:", eventData.type);
        }
      } catch (error) {
        console.error("❌ Error handling WebSocket event:", error);
        toast.error(`Event processing error: ${error.message}`);
      }
    },
    [nodes, edges, nodeRefs]
  );

  // 🚀 Execute REAL wallet transaction when backend sends simulation event
  const executeRealWalletTransaction = useCallback(
    async (eventData) => {
      console.log(
        "🔥 Backend simulation detected - executing REAL wallet transaction:",
        eventData
      );

      if (workflowState.current.isExecuting) {
        console.log("⏸️ Workflow already executing, skipping duplicate");
        return;
      }

      // Find Aptos Action nodes in workflow
      const aptosActionNodes = nodes.filter(
        (node) => node.type === "aptosAction"
      );

      if (aptosActionNodes.length === 0) {
        console.log("⚠️ No Aptos Action nodes found in workflow");
        toast.error("No Aptos Action nodes found in workflow");
        return;
      }

      // Use the first Aptos Action node
      const targetNode = aptosActionNodes[0];
      console.log("🎯 Target action node:", targetNode.id);

      // Get the node reference
      const nodeRef = nodeRefs.current.get(targetNode.id);
      if (!nodeRef) {
        console.log("❌ No node reference found for:", targetNode.id);
        toast.error("Node reference not found - refresh the page");
        return;
      }

      // Check if node has execution method
      if (!nodeRef.executeAction && !nodeRef.executeTransaction) {
        console.log("❌ Node does not have execution method");
        toast.error("Node execution method not available");
        return;
      }

      workflowState.current.isExecuting = true;

      try {
        // Prepare transaction data from backend event
        const transactionData = {
          actionType: "token_transfer",
          recipient:
            eventData.result?.recipient ||
            eventData.event?.data?.to_address ||
            "0x1",
          amount:
            eventData.result?.amount ||
            eventData.event?.data?.amount ||
            100000000,
          triggerSource: "backend_websocket_event",
          eventId: eventData.event?.sequence_number || Date.now(),
        };

        console.log(
          "💰 Executing REAL wallet transaction with data:",
          transactionData
        );

        // Highlight node as executing
        highlightNode(targetNode.id, "executing");

        // Show notification that real transaction is starting
        toast.loading("🔥 Executing real wallet transaction...", {
          duration: 3000,
          style: {
            background: "#fef3c7",
            color: "#92400e",
            border: "1px solid #fbbf24",
          },
        });

        // Execute the REAL transaction via wallet
        const executionMethod =
          nodeRef.executeAction || nodeRef.executeTransaction;
        const result = await executionMethod(transactionData);

        console.log("✅ REAL transaction executed successfully:", result);

        if (result.success) {
          // Show success notification
          toast.success(
            `🎉 REAL Transaction Executed!\nHash: ${result.transactionHash?.slice(
              0,
              12
            )}...`,
            {
              duration: 8000,
              style: {
                background: "#dcfce7",
                color: "#15803d",
                border: "1px solid #86efac",
                fontSize: "14px",
                fontWeight: "600",
              },
            }
          );

          highlightNode(targetNode.id, "completed");

          // Log execution to history
          workflowState.current.executionHistory.push({
            timestamp: new Date().toISOString(),
            nodeId: targetNode.id,
            transactionHash: result.transactionHash,
            eventData: eventData,
            result: result,
          });

          // Execute connected output nodes
          await executeConnectedOutputNodes(targetNode, result);
        } else {
          toast.error(`❌ Real Transaction Failed: ${result.error}`);
          highlightNode(targetNode.id, "error");
        }
      } catch (error) {
        console.error("❌ Real transaction execution failed:", error);
        toast.error(`Real transaction failed: ${error.message}`);
        highlightNode(targetNode.id, "error");
      } finally {
        workflowState.current.isExecuting = false;
      }
    },
    [nodes, nodeRefs]
  );

  // Execute connected output nodes after successful transaction
  const executeConnectedOutputNodes = useCallback(
    async (sourceNode, transactionResult) => {
      console.log("📤 Executing connected output nodes for:", sourceNode.id);

      // Find edges from the source node
      const connectedEdges = edges.filter(
        (edge) => edge.source === sourceNode.id
      );

      for (const edge of connectedEdges) {
        const targetNode = nodes.find((node) => node.id === edge.target);

        if (targetNode && targetNode.type === "customOutput") {
          console.log("📤 Executing output node:", targetNode.id);

          // Highlight output node
          highlightNode(targetNode.id, "executing");

          // Prepare output data
          const outputData = {
            nodeId: targetNode.id,
            transactionHash: transactionResult.transactionHash,
            actionType: transactionResult.actionType,
            recipient: transactionResult.recipient,
            amount: transactionResult.amount,
            timestamp: transactionResult.timestamp,
            outputType: targetNode.data.outputType || "JSON",
            outputName: targetNode.data.outputName || "transaction_result",
          };

          // Show output notification
          toast.success(
            `📊 Output "${outputData.outputName}": Real transaction completed!`,
            {
              duration: 4000,
              style: {
                background: "#eff6ff",
                color: "#1d4ed8",
                border: "1px solid #93c5fd",
              },
            }
          );

          console.log("📊 Output data:", outputData);
          highlightNode(targetNode.id, "completed");

          // Get output node reference and update if possible
          const outputNodeRef = nodeRefs.current.get(targetNode.id);
          if (outputNodeRef && outputNodeRef.updateOutput) {
            outputNodeRef.updateOutput(outputData);
          }
        }
      }
    },
    [nodes, edges, nodeRefs]
  );

  // Handle workflow started event
  const handleWorkflowStarted = useCallback(
    (eventData) => {
      workflowState.current.activeWorkflowId = eventData.workflow_id;

      toast.success(
        `🚀 Real Transaction Workflow ${eventData.workflow_id} started!`,
        {
          duration: 4000,
          style: {
            background: "#dcfce7",
            color: "#15803d",
            border: "1px solid #86efac",
          },
        }
      );

      // Highlight trigger nodes as listening
      const triggerNodes = nodes.filter(
        (node) => node.type === "aptosEventTrigger"
      );
      triggerNodes.forEach((node) => highlightNode(node.id, "listening"));
    },
    [nodes]
  );

  // Handle workflow stopped event
  const handleWorkflowStopped = useCallback(
    (eventData) => {
      workflowState.current.activeWorkflowId = null;
      workflowState.current.isExecuting = false;

      toast.success(`⏹️ Workflow ${eventData.workflow_id} stopped.`, {
        duration: 3000,
      });

      // Clear all node highlights
      nodes.forEach((node) => clearNodeHighlight(node.id));
    },
    [nodes]
  );

  // Manual workflow execution (for testing)
  const executeWorkflow = useCallback(async () => {
    console.log(
      "🎯 Manual workflow execution - triggering real transaction test"
    );

    if (workflowState.current.isExecuting) {
      toast.error("Workflow is already executing");
      return;
    }

    // Find Aptos Action nodes
    const aptosActionNodes = nodes.filter(
      (node) => node.type === "aptosAction"
    );

    if (aptosActionNodes.length === 0) {
      toast.error("No Aptos Action nodes found in workflow");
      return;
    }

    const targetNode = aptosActionNodes[0];
    const nodeRef = nodeRefs.current.get(targetNode.id);

    if (!nodeRef) {
      toast.error("Node reference not found");
      return;
    }

    workflowState.current.isExecuting = true;

    try {
      highlightNode(targetNode.id, "executing");

      // Execute with manual test data
      const testData = {
        actionType: "token_transfer",
        recipient: "0x1",
        amount: 100000000,
        triggerSource: "manual_test",
      };

      const executionMethod =
        nodeRef.executeAction || nodeRef.executeTransaction;
      const result = await executionMethod(testData);

      if (result.success) {
        toast.success(
          `🎉 Manual test transaction executed!\nHash: ${result.transactionHash?.slice(
            0,
            12
          )}...`
        );
        highlightNode(targetNode.id, "completed");
        await executeConnectedOutputNodes(targetNode, result);
      } else {
        toast.error(`❌ Test transaction failed: ${result.error}`);
        highlightNode(targetNode.id, "error");
      }
    } catch (error) {
      console.error("❌ Manual execution failed:", error);
      toast.error(`Manual execution failed: ${error.message}`);
      highlightNode(targetNode.id, "error");
    } finally {
      workflowState.current.isExecuting = false;
    }
  }, [nodes, nodeRefs]);

  // Visual node highlighting functions
  const highlightNode = useCallback((nodeId, state) => {
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
    if (nodeElement) {
      // Clear existing highlights
      nodeElement.classList.remove(
        "workflow-listening",
        "workflow-executing",
        "workflow-completed",
        "workflow-error"
      );

      // Add new highlight
      nodeElement.classList.add(`workflow-${state}`);

      console.log(`🎨 Highlighted node ${nodeId} as ${state}`);
    }
  }, []);

  const clearNodeHighlight = useCallback((nodeId) => {
    const nodeElement = document.querySelector(`[data-id="${nodeId}"]`);
    if (nodeElement) {
      nodeElement.classList.remove(
        "workflow-listening",
        "workflow-executing",
        "workflow-completed",
        "workflow-error"
      );
    }
  }, []);

  // Add CSS styles for node highlighting
  useEffect(() => {
    const styleId = "real-workflow-engine-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .workflow-listening {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5) !important;
          animation: pulse-blue 2s infinite;
        }
        
        .workflow-executing {
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.7) !important;
          animation: pulse-yellow 1.5s infinite;
        }
        
        .workflow-completed {
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.7) !important;
          animation: pulse-green 2s ease-out;
        }
        
        .workflow-error {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.8) !important;
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes pulse-blue {
          0%, 100% { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.2); }
        }
        
        @keyframes pulse-yellow {
          0%, 100% { box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.7); }
          50% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.3); }
        }
        
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.7); }
          100% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Debug function to get current state
  const getWorkflowState = useCallback(() => {
    return {
      activeWorkflowId: workflowState.current.activeWorkflowId,
      isExecuting: workflowState.current.isExecuting,
      executionHistory: workflowState.current.executionHistory,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      registeredNodeRefs: Array.from(nodeRefs.current.keys()),
    };
  }, [nodes, edges, nodeRefs]);

  return {
    executeWorkflow,
    handleWebSocketEvent,
    getWorkflowState,
    workflowState: workflowState.current,
  };
};
