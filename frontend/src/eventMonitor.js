// eventMonitor.js
// Real-time event monitoring dashboard component

import React, { useState, useEffect } from "react";
import { Activity, Zap, Clock, CheckCircle, XCircle } from "lucide-react";

export const EventMonitor = () => {
  const [events, setEvents] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [stats, setStats] = useState({
    totalEvents: 0,
    successfulActions: 0,
    failedActions: 0,
    activeWorkflows: 0,
  });

  useEffect(() => {
    // WebSocket connection for real-time updates
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => {
      setConnectionStatus("connected");
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "action_executed") {
        const newEvent = {
          id: `${data.workflow_id}-${Date.now()}`,
          timestamp: new Date(data.timestamp),
          workflowId: data.workflow_id,
          eventType: data.event.type || "Unknown",
          action: data.result.status,
          txHash: data.result.transaction_hash,
          status: data.result.status === "success" ? "success" : "failed",
        };

        setEvents((prev) => [newEvent, ...prev.slice(0, 49)]); // Keep last 50 events

        // Update stats
        setStats((prev) => ({
          ...prev,
          totalEvents: prev.totalEvents + 1,
          successfulActions:
            data.result.status === "success"
              ? prev.successfulActions + 1
              : prev.successfulActions,
          failedActions:
            data.result.status === "success"
              ? prev.failedActions
              : prev.failedActions + 1,
        }));
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
      console.log("WebSocket disconnected");
    };

    ws.onerror = (error) => {
      setConnectionStatus("error");
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-500";
      case "error":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        padding: "20px",
        margin: "10px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        maxWidth: "380px",
        minWidth: "300px",
        position: "relative",
        zIndex: 999,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: "18px",
            fontWeight: "600",
            color: "#2d3748",
          }}
        >
          <Activity
            style={{
              display: "inline",
              marginRight: "8px",
              width: "20px",
              height: "20px",
            }}
          />
          Event Monitor
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "12px",
            fontWeight: "500",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor:
                connectionStatus === "connected" ? "#22c55e" : "#ef4444",
              marginRight: "6px",
            }}
          />
          <span className={getConnectionStatusColor()}>
            {connectionStatus.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            color: "white",
            padding: "12px",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: "700" }}>
            {stats.totalEvents}
          </div>
          <div style={{ fontSize: "11px", opacity: "0.9" }}>Total Events</div>
        </div>
        <div
          style={{
            background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            color: "white",
            padding: "12px",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: "700" }}>
            {stats.successfulActions}
          </div>
          <div style={{ fontSize: "11px", opacity: "0.9" }}>Successful</div>
        </div>
      </div>

      {/* Event List */}
      <div
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          border: "1px solid rgba(78, 205, 196, 0.2)",
          borderRadius: "8px",
          padding: "10px",
        }}
      >
        <h4
          style={{
            margin: "0 0 10px 0",
            fontSize: "14px",
            fontWeight: "600",
            color: "#4ecdc4",
          }}
        >
          Recent Events
        </h4>

        {events.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#718096",
              fontSize: "12px",
              padding: "20px 0",
            }}
          >
            <Zap
              style={{ width: "24px", height: "24px", margin: "0 auto 8px" }}
            />
            <div>Waiting for events...</div>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid rgba(78, 205, 196, 0.1)",
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#2d3748",
                  }}
                >
                  {event.eventType}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "#718096",
                    marginTop: "2px",
                  }}
                >
                  {event.timestamp.toLocaleTimeString()}
                </div>
                {event.txHash && (
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#4ecdc4",
                      marginTop: "2px",
                      fontFamily: "monospace",
                    }}
                  >
                    {event.txHash.slice(0, 10)}...
                  </div>
                )}
              </div>
              <div style={{ marginLeft: "10px" }}>
                {getStatusIcon(event.status)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
