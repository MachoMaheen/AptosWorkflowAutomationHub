// aptosActionNode.js - ENHANCED WITH CONNECTION HANDLING
import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  useState,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import toast from "react-hot-toast";
import { workflowEventBus } from "../workflowEventBus";

export const AptosActionNode = forwardRef(({ id, data }, ref) => {
  const { connected, signAndSubmitTransaction } = useWallet();
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentActionType, setCurrentActionType] = useState(
    data?.actionType || "token_transfer"
  );
  // eslint-disable-next-line no-unused-vars
  const [forceUpdate, setForceUpdate] = useState(0);

  // Store form values locally as well for immediate access
  const [formValues, setFormValues] = useState({
    recipientAddress: data?.recipientAddress || "",
    amount: data?.amount || 100000000,
    actionType: data?.actionType || "token_transfer",
    functionName: data?.functionName || "",
    functionArgs: data?.functionArgs || "[]",
  });

  // Sync form values with data when data changes
  useEffect(() => {
    if (data) {
      setFormValues((prev) => ({
        ...prev,
        recipientAddress: data.recipientAddress || prev.recipientAddress,
        amount: data.amount || prev.amount,
        actionType: data.actionType || prev.actionType,
        functionName: data.functionName || prev.functionName,
        functionArgs: data.functionArgs || prev.functionArgs,
      }));
    }
  }, [data]);

  // Force re-render when action type changes
  useEffect(() => {
    setForceUpdate((prev) => prev + 1);
  }, [currentActionType]);

  // Execute transaction with incoming data support
  const executeTransaction = useCallback(
    async (incomingData = null) => {
      if (!connected) {
        toast.error("Please connect your wallet first");
        return { success: false, error: "Wallet not connected" };
      }

      setIsExecuting(true);
      try {
        // Check wallet connection first
        if (!connected) {
          throw new Error(
            "Wallet not connected. Please connect your wallet first."
          );
        }

        if (!signAndSubmitTransaction) {
          throw new Error("Wallet does not support transaction signing.");
        }

        // Merge incoming data with node configuration
        const actionType =
          incomingData?.actionType ||
          data?.actionType ||
          currentActionType ||
          "token_transfer";

        // Debug logging to understand what's happening
        console.log("Debug - executeTransaction data:", {
          incomingData,
          data,
          formValues,
          currentActionType,
          recipientFromIncoming: incomingData?.recipient,
          recipientFromData: data?.recipientAddress,
          recipientFromForm: formValues?.recipientAddress,
          amountFromIncoming: incomingData?.amount,
          amountFromData: data?.amount,
          amountFromForm: formValues?.amount,
        });

        // Get recipient address with multiple fallback sources
        let recipientAddress =
          incomingData?.recipient ||
          data?.recipientAddress ||
          formValues?.recipientAddress;

        // If no recipient address provided, use a test address for demo purposes
        if (!recipientAddress || recipientAddress.trim() === "") {
          // Use a test address for demo (you can change this)
          recipientAddress = "0x1"; // Alice's test address
          console.log("Using demo recipient address:", recipientAddress);
          toast.error("No recipient address provided, using demo address 0x1");
        }

        // Ensure amount is a number (the new SDK expects numbers, not strings)
        const amount =
          incomingData?.amount ||
          data?.amount ||
          formValues?.amount ||
          100000000;
        const numericAmount = parseInt(amount);

        let transactionData;
        switch (actionType) {
          case "token_transfer":
            transactionData = {
              function: "0x1::coin::transfer",
              typeArguments: ["0x1::aptos_coin::AptosCoin"],
              functionArguments: [recipientAddress, numericAmount],
            };
            break;
          case "entry_function":
            const functionName = data?.functionName;
            const functionArgs = JSON.parse(data?.functionArgs || "[]");
            if (!functionName) throw new Error("Function name required");

            transactionData = {
              function: functionName,
              functionArguments: incomingData
                ? [...functionArgs, ...Object.values(incomingData)]
                : functionArgs,
            };
            break;
          default:
            throw new Error("Unsupported action type");
        }

        console.log("Transaction data:", transactionData);

        const response = await signAndSubmitTransaction({
          data: transactionData,
        });

        toast.success(`Transaction submitted: ${response.hash}`);

        // 🔥 NEW: Notify backend that transaction is completed
        try {
          const ws = new WebSocket("ws://localhost:8000/ws");
          ws.onopen = () => {
            const resumeMessage = {
              type: "transaction_confirmed",
              workflow_id: "current_workflow", // This should be passed dynamically
              transaction_hash: response.hash,
              node_id: id,
              timestamp: new Date().toISOString(),
            };
            ws.send(JSON.stringify(resumeMessage));
            console.log(
              "🔄 Sent transaction confirmation to backend:",
              resumeMessage
            );
            ws.close();
          };
        } catch (error) {
          console.error(
            "Error notifying backend of transaction completion:",
            error
          );
        }

        return {
          success: true,
          transactionHash: response.hash,
          actionType: actionType,
          timestamp: new Date().toISOString(),
          recipient: recipientAddress,
          amount: numericAmount,
        };
      } catch (error) {
        console.error("Transaction execution error:", error);

        // More specific error handling
        let errorMessage = "Unknown error occurred";
        if (error.code === 4001) {
          errorMessage = "Transaction rejected by user";
        } else if (error.code === 4100) {
          errorMessage = "Unauthorized wallet operation";
        } else if (error.code === 4200) {
          errorMessage = "Unsupported method";
        } else if (error.code === 4900) {
          errorMessage = "Wallet disconnected";
        } else if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === "string") {
          errorMessage = error;
        }

        toast.error(`Transaction failed: ${errorMessage}`);
        return {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      } finally {
        setIsExecuting(false);
      }
    },
    [connected, signAndSubmitTransaction, data, currentActionType, formValues]
  );

  // Expose executeTransaction method to parent components via ref
  useImperativeHandle(
    ref,
    () => ({
      executeTransaction,
      isExecuting,
      nodeId: id,
      nodeType: "aptosAction",
    }),
    [executeTransaction, isExecuting, id]
  );

  // Listen for workflow events - MOVED AFTER executeTransaction is defined
  useEffect(() => {
    const handleWorkflowEvent = (eventData) => {
      console.log(`AptosActionNode ${id} received workflow event:`, eventData);

      // Execute transaction when we receive a workflow event
      if (
        eventData.type === "EXECUTE_ACTION" &&
        eventData.targetNodeId === id
      ) {
        executeTransaction(eventData.data);
      } else if (
        eventData.type === "TRANSFER_DETECTED" &&
        eventData.targetNodeId === id
      ) {
        // Execute transaction with the transfer data
        executeTransaction({
          recipient: eventData.data.to_address,
          amount: eventData.data.amount,
          actionType: "token_transfer",
        });
      }
    };

    // 🔥 NEW: Listen for direct WebSocket messages for real transactions
    const handleWebSocketMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("🔥 AptosActionNode WebSocket message:", data);

        // Handle direct transaction execution requests from backend
        if (data.type === "execute_transaction" && data.node_id === id) {
          console.log(
            "🚀 EXECUTING REAL TRANSACTION from backend request:",
            data
          );
          executeTransaction({
            recipient: data.recipient,
            amount: data.amount,
            actionType: data.action_type,
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    // Connect to WebSocket for real-time transaction requests
    const ws = new WebSocket("ws://localhost:8000/ws");
    ws.onmessage = handleWebSocketMessage;
    ws.onopen = () => {
      console.log(
        `🔗 AptosActionNode ${id} connected to WebSocket for real transactions`
      );
    };

    // Subscribe to workflow events for this node
    workflowEventBus.subscribe(id, handleWorkflowEvent);

    // Cleanup subscription on unmount
    return () => {
      workflowEventBus.unsubscribe(id, handleWorkflowEvent);
      if (ws) ws.close();
    };
  }, [id, executeTransaction]);

  // Dynamic fields based on action type
  const getFieldsForActionType = useCallback(
    (actionType) => {
      const baseFields = [
        {
          name: "actionType",
          type: "select",
          label: "Action Type",
          defaultValue: "token_transfer",
          options: [
            { value: "token_transfer", label: "Transfer APT Tokens" },
            { value: "nft_transfer", label: "Transfer NFT" },
            { value: "entry_function", label: "Call Entry Function" },
            { value: "conditional_transfer", label: "Conditional Transfer" },
            {
              value: "multi_sig_transaction",
              label: "Multi-Signature Transaction",
            },
          ],
          onChange: (value) => {
            setCurrentActionType(value);
            setForceUpdate((prev) => prev + 1); // Force component re-render
            setFormValues((prev) => ({ ...prev, actionType: value }));
            if (data) {
              data.actionType = value;
            }
          },
        },
      ];

      switch (actionType) {
        case "token_transfer":
          return [
            ...baseFields,
            {
              name: "recipientAddress",
              type: "text",
              label: "Recipient Address",
              defaultValue: formValues.recipientAddress,
              placeholder: "0x123...abc or use incoming data",
              onChange: (value) => {
                setFormValues((prev) => ({ ...prev, recipientAddress: value }));
                if (data) {
                  data.recipientAddress = value;
                }
              },
            },
            {
              name: "amount",
              type: "number",
              label: "Amount (Octas)",
              defaultValue: formValues.amount,
              placeholder: "100000000 = 1 APT",
              onChange: (value) => {
                setFormValues((prev) => ({ ...prev, amount: value }));
                if (data) {
                  data.amount = value;
                }
              },
            },
          ];
        case "entry_function":
          return [
            ...baseFields,
            {
              name: "functionName",
              type: "text",
              label: "Function Name",
              defaultValue: formValues.functionName,
              placeholder: "0x1::module::function",
              onChange: (value) => {
                setFormValues((prev) => ({ ...prev, functionName: value }));
                if (data) {
                  data.functionName = value;
                }
              },
            },
            {
              name: "functionArgs",
              type: "textarea",
              label: "Arguments (JSON)",
              defaultValue: formValues.functionArgs,
              placeholder: '["arg1", 123]',
              onChange: (value) => {
                setFormValues((prev) => ({ ...prev, functionArgs: value }));
                if (data) {
                  data.functionArgs = value;
                }
              },
            },
          ];
        default:
          return baseFields;
      }
    },
    [data, formValues]
  );

  const fields = getFieldsForActionType(currentActionType);

  // Typed handles for input/output
  const handles = [
    // Input handles
    {
      type: "target",
      position: Position.Left,
      id: `${id}-trigger`,
      style: {
        top: "20%",
        background: "#e74c3c",
        border: "3px solid #fff",
      },
      className: "trigger-handle",
      label: "Trigger",
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-data`,
      style: {
        top: "50%",
        background: "#4ecdc4",
        border: "3px solid #fff",
      },
      className: "data-handle",
      label: "Data",
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-condition`,
      style: {
        top: "80%",
        background: "#f39c12",
        border: "3px solid #fff",
      },
      className: "condition-handle",
      label: "Condition",
    },
    // Output handles
    {
      type: "source",
      position: Position.Right,
      id: `${id}-success`,
      style: {
        top: "30%",
        background: "#2ecc71",
        border: "3px solid #fff",
      },
      className: "success-handle",
      label: "Success",
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-error`,
      style: {
        top: "70%",
        background: "#e74c3c",
        border: "3px solid #fff",
      },
      className: "error-handle",
      label: "Error",
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="⚡ APTOS ACTION"
      fields={fields}
      handles={handles}
      className="aptos-action-node"
      minWidth={360}
      minHeight={300}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#2d3748",
          marginTop: "10px",
          padding: "8px 12px",
          background: "rgba(255, 255, 255, 0.9)",
          borderRadius: "6px",
          border: connected
            ? "1px solid rgba(34, 197, 94, 0.5)"
            : "1px solid rgba(239, 68, 68, 0.5)",
        }}
      >
        <strong style={{ color: connected ? "#22c55e" : "#ef4444" }}>
          Wallet:
        </strong>{" "}
        {connected ? "Connected ✓" : "Disconnected"}
        <div style={{ marginTop: "4px", fontSize: "10px" }}>
          <strong>Type:</strong> {currentActionType}
          <br />
          <strong>Recipient:</strong> {formValues.recipientAddress || "Not set"}
          <br />
          <strong>Amount:</strong>{" "}
          {formValues.amount ? `${formValues.amount} octas` : "Default"}
          <br />
          <strong>I/O:</strong> Trigger + Data → Success/Error
        </div>
      </div>

      {/* Manual Execute Button */}
      {connected && (
        <button
          onClick={() => executeTransaction()}
          disabled={isExecuting}
          style={{
            width: "100%",
            marginTop: "8px",
            padding: "6px 12px",
            background: isExecuting
              ? "linear-gradient(135deg, #a0a0a0 0%, #808080 100%)"
              : "linear-gradient(135deg, #4ecdc4 0%, #38d9a9 100%)",
            border: "none",
            borderRadius: "6px",
            color: "white",
            fontSize: "11px",
            fontWeight: "600",
            cursor: isExecuting ? "not-allowed" : "pointer",
            textTransform: "uppercase",
          }}
        >
          {isExecuting ? "Executing..." : "🚀 Test Execute"}
        </button>
      )}
    </BaseNode>
  );
});
