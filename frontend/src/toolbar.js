// // toolbar.js

// import { DraggableNode } from "./draggableNode";
// import "./toolbar.css";

// export const PipelineToolbar = () => {
//   return (
//     <div className="pipeline-toolbar">
//       <h2 className="toolbar-title">Node Library</h2>

//       <div className="node-category">
//         <h3 className="category-title">Core Nodes</h3>
//         <div className="node-grid">
//           <DraggableNode type="customInput" label="Input" />
//           <DraggableNode type="llm" label="LLM" />
//           <DraggableNode type="customOutput" label="Output" />
//           <DraggableNode type="text" label="Text" />
//         </div>
//       </div>

//       <div className="node-category">
//         <h3 className="category-title">Processing Nodes</h3>
//         <div className="node-grid">
//           <DraggableNode type="math" label="Math" />
//           <DraggableNode type="filter" label="Filter" />
//           <DraggableNode type="conditional" label="Conditional" />
//         </div>
//       </div>

//       <div className="node-category">
//         <h3 className="category-title">Integration Nodes</h3>
//         <div className="node-grid">
//           <DraggableNode type="api" label="API" />
//           <DraggableNode type="timer" label="Timer" />
//         </div>
//       </div>
//     </div>
//   );
// };

// Enhanced toolbar.js with Aptos nodes - WORKING VERSION

import { DraggableNode } from "./draggableNode";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Wallet, Zap } from "lucide-react";
import "./toolbar.css";

export const PipelineToolbar = () => {
  const { connected, connect, disconnect, account, wallets } = useWallet();

  const handleWalletAction = async () => {
    if (connected) {
      await disconnect();
    } else {
      // Connect to Petra wallet
      const petraWallet = wallets.find((wallet) => wallet.name === "Petra");
      if (petraWallet) {
        await connect(petraWallet.name);
      }
    }
  };

  return (
    <div className="pipeline-toolbar">
      <h2 className="toolbar-title">
        <Zap
          style={{
            display: "inline",
            marginRight: "8px",
            width: "18px",
            height: "18px",
          }}
        />
        Aptos Workflow Hub
      </h2>

      {/* Wallet Connection Status */}
      <div className="wallet-status-section">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: connected
              ? "rgba(34, 197, 94, 0.1)"
              : "rgba(239, 68, 68, 0.1)",
            borderRadius: "8px",
            border: connected
              ? "1px solid rgba(34, 197, 94, 0.3)"
              : "1px solid rgba(239, 68, 68, 0.3)",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <Wallet
              style={{
                width: "14px",
                height: "14px",
                marginRight: "6px",
                color: connected ? "#22c55e" : "#ef4444",
              }}
            />
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: connected ? "#22c55e" : "#ef4444",
                }}
              >
                {connected ? "Connected" : "Not Connected"}
              </div>
              {connected && account && (
                <div
                  style={{
                    fontSize: "10px",
                    color: "rgba(255, 255, 255, 0.8)",
                    fontFamily: "monospace",
                  }}
                >
                  {`${account.address.slice(0, 6)}...${account.address.slice(
                    -4
                  )}`}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleWalletAction}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "4px",
              color: "white",
              padding: "4px 8px",
              fontSize: "10px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            {connected ? "Disconnect" : "Connect"}
          </button>
        </div>
      </div>

      <div className="node-category">
        <h3 className="category-title">Core Nodes</h3>
        <div className="node-grid">
          <DraggableNode type="customInput" label="Input" />
          <DraggableNode type="llm" label="LLM" />
          <DraggableNode type="customOutput" label="Output" />
          <DraggableNode type="text" label="Text" />
        </div>
      </div>

      <div className="node-category">
        <h3 className="category-title">Processing Nodes</h3>
        <div className="node-grid">
          <DraggableNode type="math" label="Math" />
          <DraggableNode type="filter" label="Filter" />
          <DraggableNode type="conditional" label="Conditional" />
        </div>
      </div>

      <div className="node-category">
        <h3 className="category-title">Integration Nodes</h3>
        <div className="node-grid">
          <DraggableNode type="api" label="API" />
          <DraggableNode type="timer" label="Timer" />
        </div>
      </div>

      <div className="node-category">
        <h3 className="category-title" style={{ color: "#ff6b6b" }}>
          🚀 Aptos Nodes
        </h3>
        <div className="node-grid">
          <DraggableNode type="walletConnection" label="Wallet" />
          <DraggableNode type="aptosEventTrigger" label="Event Trigger" />
          <DraggableNode type="aptosAction" label="Aptos Action" />
        </div>
      </div>
    </div>
  );
};
