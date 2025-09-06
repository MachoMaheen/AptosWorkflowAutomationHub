// walletConnectionNode.js - ENHANCED WITH DYNAMIC FIELDS & PROPER DATA FLOW
import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";

export const WalletConnectionNode = ({ id, data }) => {
  const { connected, account } = useWallet();
  const [currentNetwork, setCurrentNetwork] = useState(
    data?.network || "mainnet"
  );

  // Dynamic fields based on connection status
  const getFieldsForConnection = (isConnected) => {
    const baseFields = [
      {
        name: "walletType",
        type: "select",
        label: "Preferred Wallet",
        defaultValue: "petra",
        options: [
          { value: "petra", label: "Petra Wallet" },
          { value: "martian", label: "Martian Wallet" },
          { value: "fewcha", label: "Fewcha Wallet" },
          { value: "rise", label: "Rise Wallet" },
        ],
      },
      {
        name: "network",
        type: "select",
        label: "Network",
        defaultValue: "mainnet",
        options: [
          { value: "mainnet", label: "Mainnet" },
          { value: "testnet", label: "Testnet" },
          { value: "devnet", label: "Devnet" },
        ],
        onChange: (value) => {
          setCurrentNetwork(value);
          if (data) {
            data.network = value;
          }
        },
      },
      {
        name: "autoConnect",
        type: "select",
        label: "Auto Connect",
        defaultValue: "true",
        options: [
          { value: "true", label: "Yes" },
          { value: "false", label: "No" },
        ],
      },
    ];

    // Add connection-specific fields
    if (isConnected) {
      return [
        ...baseFields,
        {
          name: "refreshInterval",
          type: "number",
          label: "Balance Refresh (seconds)",
          defaultValue: 30,
          min: 5,
          max: 300,
          step: 5,
        },
        {
          name: "enableNotifications",
          type: "select",
          label: "Transaction Notifications",
          defaultValue: "true",
          options: [
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ],
        },
      ];
    }

    return baseFields;
  };

  const fields = getFieldsForConnection(connected);

  const handles = [
    {
      type: "source",
      position: Position.Right,
      id: `${id}-address`,
      style: { top: "25%" },
      className: "data-handle",
      label: "Address",
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-balance`,
      style: { top: "50%" },
      className: "data-handle",
      label: "Balance",
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-network`,
      style: { top: "75%" },
      className: "metadata-handle",
      label: "Network",
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="🔗 WALLET"
      fields={fields}
      handles={handles}
      className="wallet-connection-node"
      minWidth={320}
      minHeight={220}
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
          Status:
        </strong>{" "}
        {connected ? "Connected" : "Disconnected"}
        {connected && account && (
          <div style={{ marginTop: "4px" }}>
            <strong style={{ color: "#4ecdc4" }}>Address:</strong>{" "}
            {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
            <div style={{ marginTop: "2px", fontSize: "10px" }}>
              <strong>Network:</strong> {currentNetwork}
            </div>
          </div>
        )}
        <div style={{ marginTop: "4px", fontSize: "10px" }}>
          <strong>Outputs:</strong> Address | Balance | Network
        </div>
      </div>
    </BaseNode>
  );
};
