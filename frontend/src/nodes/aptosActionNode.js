// aptosActionNode.js - ENHANCED WITH CONNECTION HANDLING
import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";

export const AptosActionNode = ({ id, data }) => {
  const { connected, signAndSubmitTransaction } = useWallet();
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentActionType, setCurrentActionType] = useState(data?.actionType || "token_transfer");
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force re-render when action type changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [currentActionType]);

  // Execute transaction with incoming data support
  const executeTransaction = useCallback(async (incomingData = null) => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return { success: false, error: "Wallet not connected" };
    }

    setIsExecuting(true);
    try {
      // Merge incoming data with node configuration
      const actionType = incomingData?.actionType || data?.actionType || "token_transfer";
      const recipientAddress = incomingData?.recipient || data?.recipientAddress;
      const amount = incomingData?.amount || data?.amount || 100000000;

      if (!recipientAddress) {
        throw new Error("Recipient address required");
      }

      let payload;
      switch (actionType) {
        case "token_transfer":
          payload = {
            function: "0x1::aptos_account::transfer",
            type_arguments: [],
            arguments: [recipientAddress, amount.toString()],
          };
          break;
        case "entry_function":
          const functionName = data?.functionName;
          const functionArgs = JSON.parse(data?.functionArgs || "[]");
          if (!functionName) throw new Error("Function name required");
          
          payload = {
            function: functionName,
            type_arguments: [],
            arguments: incomingData ? [...functionArgs, ...Object.values(incomingData)] : functionArgs,
          };
          break;
        default:
          throw new Error("Unsupported action type");
      }

      const response = await signAndSubmitTransaction({
        data: payload,
        options: {
          gas_unit_price: "100",
          max_gas_amount: (data?.gasLimit || 2000).toString(),
        },
      });

      toast.success(`Transaction submitted: ${response.hash}`);
      
      return {
        success: true,
        transactionHash: response.hash,
        actionType: actionType,
        timestamp: new Date().toISOString(),
        recipient: recipientAddress,
        amount: amount
      };

    } catch (error) {
      toast.error(`Transaction failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    } finally {
      setIsExecuting(false);
    }
  }, [connected, signAndSubmitTransaction, data]);

  // Dynamic fields based on action type
  const getFieldsForActionType = useCallback((actionType) => {
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
          setForceUpdate(prev => prev + 1); // Force component re-render
          if (data) {
            data.actionType = value;
          }
        }
      }
    ];

    switch (actionType) {
      case "token_transfer":
        return [
          ...baseFields,
          {
            name: "recipientAddress",
            type: "text",
            label: "Recipient Address",
            defaultValue: "",
            placeholder: "0x123...abc or use incoming data",
          },
          {
            name: "amount",
            type: "number",
            label: "Amount (Octas)",
            defaultValue: 100000000,
            placeholder: "100000000 = 1 APT",
          }
        ];
      case "entry_function":
        return [
          ...baseFields,
          {
            name: "functionName",
            type: "text",
            label: "Function Name",
            defaultValue: "",
            placeholder: "0x1::module::function",
          },
          {
            name: "functionArgs",
            type: "textarea",
            label: "Arguments (JSON)",
            defaultValue: "[]",
            placeholder: '["arg1", 123]',
          }
        ];
      default:
        return baseFields;
    }
  }, [data]);

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
        border: "3px solid #fff"
      },
      className: "trigger-handle",
      label: "Trigger"
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-data`,
      style: { 
        top: "50%", 
        background: "#4ecdc4",
        border: "3px solid #fff"
      },
      className: "data-handle",
      label: "Data"
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-condition`,
      style: { 
        top: "80%", 
        background: "#f39c12",
        border: "3px solid #fff"
      },
      className: "condition-handle",
      label: "Condition"
    },
    // Output handles
    {
      type: "source",
      position: Position.Right,
      id: `${id}-success`,
      style: { 
        top: "30%", 
        background: "#2ecc71",
        border: "3px solid #fff"
      },
      className: "success-handle",
      label: "Success"
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-error`,
      style: { 
        top: "70%", 
        background: "#e74c3c",
        border: "3px solid #fff"
      },
      className: "error-handle",
      label: "Error"
    }
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
      <div style={{
        fontSize: "11px",
        color: "#2d3748",
        marginTop: "10px",
        padding: "8px 12px",
        background: "rgba(255, 255, 255, 0.9)",
        borderRadius: "6px",
        border: connected 
          ? "1px solid rgba(34, 197, 94, 0.5)"
          : "1px solid rgba(239, 68, 68, 0.5)",
      }}>
        <strong style={{ color: connected ? "#22c55e" : "#ef4444" }}>Wallet:</strong>{" "}
        {connected ? "Connected ✓" : "Disconnected"}
        <div style={{ marginTop: "4px", fontSize: "10px" }}>
          <strong>Type:</strong> {currentActionType}<br />
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
};
