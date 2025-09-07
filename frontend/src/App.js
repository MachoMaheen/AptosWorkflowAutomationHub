// Enhanced App.js with Aptos Wallet Integration and WebSocket

import React from "react";
import { PipelineToolbar } from "./toolbar";
import { PipelineUI } from "./ui";
import { EventMonitor } from "./eventMonitor";
import AptosWalletProvider from "./AptosWalletProvider";
import { PipelineProvider } from "./PipelineContext";
import { useWebSocket } from "./useWebSocket";
import { ConnectionGuide } from "./components/ConnectionGuide";
import { Toaster } from "react-hot-toast";
import "./App.css";
import "./styles/ReactFlowOverrides.css";

// WebSocket status indicator component
const WebSocketStatus = ({ isConnected }) => (
  <div
    style={{
      position: "fixed",
      top: "10px",
      right: "10px",
      padding: "4px 8px",
      borderRadius: "4px",
      fontSize: "11px",
      fontWeight: "600",
      background: isConnected ? "#10b981" : "#ef4444",
      color: "white",
      zIndex: 1000,
      opacity: 0.8,
    }}
  >
    {isConnected ? "● WebSocket Connected" : "● WebSocket Disconnected"}
  </div>
);

function AppContent() {
  // Initialize WebSocket connection
  const { isConnected } = useWebSocket("ws://localhost:8000/ws");

  return (
    <div className="app">
      {/* WebSocket status indicator */}
      <WebSocketStatus isConnected={isConnected} />

      {/* Full screen pipeline UI */}
      <PipelineUI />

      {/* Overlay toolbar */}
      <div className="toolbar-overlay">
        <PipelineToolbar />
      </div>

      {/* Event Monitor overlay */}
      <div className="event-monitor-overlay">
        <EventMonitor />
      </div>

      {/* Connection Guide */}
      <ConnectionGuide />

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(78, 205, 196, 0.3)",
            borderRadius: "12px",
            color: "#2d3748",
          },
          success: {
            style: {
              borderColor: "rgba(34, 197, 94, 0.3)",
            },
          },
          error: {
            style: {
              borderColor: "rgba(239, 68, 68, 0.3)",
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <AptosWalletProvider>
      <PipelineProvider>
        <AppContent />
      </PipelineProvider>
    </AptosWalletProvider>
  );
}

export default App;
