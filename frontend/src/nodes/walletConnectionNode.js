// walletConnectionNode.js - WORKING VERSION
import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export const WalletConnectionNode = ({ id, data }) => {
  const { connected, account } = useWallet();

  const fields = [
    {
      name: "walletType",
      type: "select",
      label: "Preferred Wallet",
      defaultValue: "petra",
      options: [{ value: "petra", label: "Petra Wallet" }],
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

  const handles = [
    {
      type: "source",
      position: Position.Right,
      id: `${id}-address`,
      style: { top: "30%" },
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-balance`,
      style: { top: "70%" },
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="WALLET CONNECTION"
      fields={fields}
      handles={handles}
      className="wallet-connection-node"
      minWidth={320}
      minHeight={180}
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
          </div>
        )}
      </div>
    </BaseNode>
  );
};
