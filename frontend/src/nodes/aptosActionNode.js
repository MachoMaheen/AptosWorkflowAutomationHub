// aptosActionNode.js - ENHANCED WITH DYNAMIC FIELDS & PROPER DATA FLOW
import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import toast from "react-hot-toast";

export const AptosActionNode = ({ id, data }) => {
  const { connected, signAndSubmitTransaction } = useWallet();
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentActionType, setCurrentActionType] = useState(
    data?.actionType || "token_transfer"
  );

  // Execute transaction based on incoming data
  const executeTransaction = async (incomingData = null) => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsExecuting(true);
    try {
      // Use incoming data if available, otherwise use node configuration
      const actionType =
        incomingData?.actionType || data?.actionType || "token_transfer";
      const recipientAddress =
        incomingData?.recipient || data?.recipientAddress;
      const amount = incomingData?.amount || data?.amount || 100000000;

      if (!recipientAddress) {
        toast.error("Please enter a recipient address");
        return;
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

        case "nft_transfer":
          const tokenId = incomingData?.tokenId || data?.tokenId;
          if (!tokenId) {
            toast.error("Please enter a token ID for NFT transfer");
            return;
          }
          payload = {
            function: "0x3::token_transfers::offer_script",
            type_arguments: [],
            arguments: [recipientAddress, tokenId, 1],
          };
          break;

        case "entry_function":
          const functionName = data?.functionName;
          const functionArgs = data?.functionArgs || "[]";
          if (!functionName) {
            toast.error("Please enter a function name");
            return;
          }
          try {
            const parsedArgs = JSON.parse(functionArgs);
            payload = {
              function: functionName,
              type_arguments: [],
              arguments: parsedArgs,
            };
          } catch (e) {
            toast.error("Invalid function arguments JSON");
            return;
          }
          break;

        case "conditional_transfer":
          // This would be more complex in a real implementation
          toast.error("Conditional transfer not yet implemented");
          return;

        default:
          toast.error("Unsupported action type");
          return;
      }

      const response = await signAndSubmitTransaction({
        data: payload,
        options: {
          gas_unit_price: "100",
          max_gas_amount: (data?.gasLimit || 2000).toString(),
        },
      });

      toast.success(`Transaction submitted: ${response.hash}`);
      console.log("Transaction response:", response);

      // Return success data for connected nodes
      return {
        success: true,
        transactionHash: response.hash,
        actionType: actionType,
        timestamp: new Date().toISOString(),
        recipient: recipientAddress,
        amount: amount,
      };
    } catch (error) {
      console.error("Transaction failed:", error);
      toast.error(`Transaction failed: ${error.message || "Unknown error"}`);

      // Return error data for error handling nodes
      return {
        success: false,
        error: error.message || "Unknown error",
        actionType: currentActionType,
        timestamp: new Date().toISOString(),
      };
    } finally {
      setIsExecuting(false);
    }
  };

  // Dynamic fields based on action type
  const getFieldsForActionType = (actionType) => {
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
            defaultValue: "",
            placeholder: "0x123...abc (recipient wallet address)",
          },
          {
            name: "amount",
            type: "number",
            label: "Amount (in Octas for APT)",
            defaultValue: 100000000,
            min: 1,
            step: 1000000,
            placeholder: "100000000 = 1 APT",
          },
        ];

      case "nft_transfer":
        return [
          ...baseFields,
          {
            name: "recipientAddress",
            type: "text",
            label: "Recipient Address",
            defaultValue: "",
            placeholder: "0x123...abc (recipient wallet address)",
          },
          {
            name: "tokenId",
            type: "text",
            label: "Token ID",
            defaultValue: "",
            placeholder: "Token ID to transfer",
          },
        ];

      case "conditional_transfer":
        return [
          ...baseFields,
          {
            name: "condition",
            type: "select",
            label: "Condition",
            defaultValue: "amount_greater_than",
            options: [
              { value: "amount_greater_than", label: "Amount > Value" },
              { value: "balance_sufficient", label: "Balance Sufficient" },
              { value: "time_based", label: "Time Based" },
            ],
          },
          {
            name: "recipientAddress",
            type: "text",
            label: "Recipient Address",
            defaultValue: "",
            placeholder: "0x123...abc (recipient wallet address)",
          },
          {
            name: "amount",
            type: "number",
            label: "Amount (in Octas for APT)",
            defaultValue: 100000000,
            min: 1,
            step: 1000000,
            placeholder: "100000000 = 1 APT",
          },
        ];

      case "entry_function":
        return [
          ...baseFields,
          {
            name: "functionName",
            type: "text",
            label: "Function Name",
            defaultValue: "",
            placeholder: "e.g., 0x1::aptos_account::transfer",
          },
          {
            name: "functionArgs",
            type: "textarea",
            label: "Function Arguments (JSON Array)",
            defaultValue: "[]",
            placeholder: '["address", 1000000]',
          },
        ];

      default:
        return baseFields;
    }
  };

  const fields = getFieldsForActionType(currentActionType);

  // Handles for different connection types
  const handles = [
    // Input handles
    {
      type: "target",
      position: Position.Left,
      id: `${id}-trigger`,
      style: { top: "20%" },
      className: "trigger-handle",
      label: "Trigger",
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-data`,
      style: { top: "40%" },
      className: "data-handle",
      label: "Data",
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-condition`,
      style: { top: "60%" },
      className: "condition-handle",
      label: "Condition",
    },

    // Output handles
    {
      type: "source",
      position: Position.Right,
      id: `${id}-success`,
      style: { top: "25%" },
      className: "success-handle",
      label: "Success",
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-error`,
      style: { top: "50%" },
      className: "error-handle",
      label: "Error",
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-transaction-data`,
      style: { top: "75%" },
      className: "transaction-handle",
      label: "Txn Data",
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
      minHeight={320}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#2d3748",
          marginTop: "4px" /* Reduced top margin */,
          marginBottom: "0px" /* Ensure no bottom margin */,
          padding: "6px 10px" /* Reduced padding */,
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
        {connected ? "Connected ✓" : "Connect wallet to execute"}
        <div style={{ marginTop: "2px", fontSize: "10px" }}>
          <strong>Inputs:</strong> Trigger | Data | Condition
          <br />
          <strong>Outputs:</strong> Success | Error | Transaction Data
        </div>
      </div>

      {/* Manual Execute Button */}
      {connected && (
        <button
          onClick={() => executeTransaction()}
          disabled={isExecuting}
          style={{
            width: "100%",
            padding: "6px 10px" /* Reduced padding */,
            background: isExecuting
              ? "rgba(156, 163, 175, 0.8)"
              : "linear-gradient(135deg, #4ecdc4 0%, #44d1ca 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: isExecuting ? "not-allowed" : "pointer",
            fontSize: "11px" /* Reduced font size */,
            fontWeight: "600",
            transition: "all 0.2s ease",
            boxShadow: isExecuting
              ? "none"
              : "0 2px 4px rgba(78, 205, 196, 0.3)",
            marginTop: "4px" /* Reduced top margin */,
            marginBottom: "0px" /* Ensure no bottom margin */,
          }}
        >
          {isExecuting ? "Executing..." : "🚀 Execute Transaction"}
        </button>
      )}
    </BaseNode>
  );
};
