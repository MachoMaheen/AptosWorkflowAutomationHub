// Enhanced App.js with Aptos Wallet Integration

import React from "react";
import { PipelineToolbar } from "./toolbar";
import { PipelineUI } from "./ui";
import { EventMonitor } from "./eventMonitor";
import AptosWalletProvider from "./AptosWalletProvider";
import { Toaster } from "react-hot-toast";
import "./App.css";

function App() {
  return (
    <AptosWalletProvider>
      <div className="app">
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
    </AptosWalletProvider>
  );
}

export default App;
