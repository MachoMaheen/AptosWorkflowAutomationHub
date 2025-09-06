// aptosActionNode.js
// Node for executing Aptos transactions and actions

import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import toast from "react-hot-toast";

export const AptosActionNode = ({ id, data }) => {
  const { connected, signAndSubmitTransaction } = useWallet();
  const [isExecuting, setIsExecuting] = useState(false);

  // Handle transaction execution
  const executeTransaction = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsExecuting(true);
    try {
      const actionType = data?.actionType || "token_transfer";
      const recipientAddress = data?.recipientAddress;
      const amount = data?.amount || 100000000;

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
    } catch (error) {
      console.error("Transaction failed:", error);
      toast.error(`Transaction failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsExecuting(false);
    }
  };
  const fields = [
    {
      name: "actionType",
      type: "select",
      label: "Action Type",
      defaultValue: "token_transfer",
      options: [
        { value: "token_transfer", label: "Transfer APT Tokens" },
        { value: "nft_transfer", label: "Transfer NFT" },
        { value: "entry_function", label: "Call Entry Function" },
        {
          value: "multi_sig_transaction",
          label: "Multi-Signature Transaction",
        },
        { value: "coin_register", label: "Register Coin Type" },
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
    {
      name: "functionName",
      type: "text",
      label: "Function Name (Entry Function)",
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
    {
      name: "gasLimit",
      type: "number",
      label: "Gas Limit",
      defaultValue: 2000,
      min: 100,
      max: 1000000,
      step: 100,
    },
    {
      name: "confirmations",
      type: "number",
      label: "Required Confirmations",
      defaultValue: 1,
      min: 1,
      max: 10,
      step: 1,
    },
  ];

  const handles = [
    {
      type: "target",
      position: Position.Left,
      id: `${id}-trigger`,
      style: { top: "25%" },
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-data`,
      style: { top: "50%" },
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-condition`,
      style: { top: "75%" },
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-success`,
      style: { top: "35%" },
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-error`,
      style: { top: "65%" },
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="APTOS ACTION"
      fields={fields}
      handles={handles}
      className="aptos-action-node"
      minWidth={380}
      minHeight={420}
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
        <strong
          style={{
            color: connected ? "#22c55e" : "#ef4444",
          }}
        >
          Wallet:
        </strong>{" "}
        {connected ? "Connected" : "Connect wallet to execute"}
      </div>

      {/* Execute Button */}
      {connected && (
        <div style={{ marginTop: "12px" }}>
          <button
            onClick={executeTransaction}
            disabled={isExecuting}
            style={{
              width: "100%",
              padding: "10px 16px",
              background: isExecuting
                ? "rgba(156, 163, 175, 0.8)"
                : "linear-gradient(135deg, #4ecdc4 0%, #44d1ca 100%)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: isExecuting ? "not-allowed" : "pointer",
              fontSize: "12px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              boxShadow: isExecuting
                ? "none"
                : "0 2px 4px rgba(78, 205, 196, 0.3)",
            }}
            onMouseEnter={(e) => {
              if (!isExecuting) {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 8px rgba(78, 205, 196, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isExecuting) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 2px 4px rgba(78, 205, 196, 0.3)";
              }
            }}
          >
            {isExecuting ? "Executing..." : "Execute Transaction"}
          </button>
        </div>
      )}
    </BaseNode>
  );
};
