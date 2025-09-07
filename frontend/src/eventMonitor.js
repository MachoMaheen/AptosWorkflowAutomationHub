// eventMonitor.js - ENHANCED WITH REAL APTOS DATA INTEGRATION
import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Database,
  Wifi,
} from "lucide-react";
import { workflowEventBus } from "./workflowEventBus";
import { workflowCoordinator } from "./workflowCoordinator";

export const EventMonitor = () => {
  const [events, setEvents] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [stats, setStats] = useState({
    totalEvents: 0,
    successfulActions: 0,
    failedActions: 0,
    activeWorkflows: 0,
    realEvents: 0,
    simulatedEvents: 0,
  });
  const [systemStatus, setSystemStatus] = useState({
    dataSource: "unknown",
    lastEventTime: null,
    pollingActive: false,
  });

  // Enhanced WebSocket connection with reconnection logic
  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onopen = () => {
      setConnectionStatus("connected");
      console.log("🚀 Enhanced WebSocket connected to Aptos Workflow Hub");

      // Send ping to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send("ping");
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📡 WebSocket message received:", data);

        if (data.type === "connection_established") {
          // Handle connection welcome message
          setSystemStatus((prev) => ({
            ...prev,
            dataSource: "enhanced_backend",
            pollingActive: true,
          }));
          setStats((prev) => ({
            ...prev,
            activeWorkflows: data.active_workflows || 0,
          }));
        } else if (data.type === "action_executed") {
          // Handle enhanced action execution events
          const newEvent = {
            id: `${data.workflow_id}-${Date.now()}`,
            timestamp: new Date(data.timestamp),
            workflowId: data.workflow_id,
            eventType: data.event?.event_type || data.event?.type || "Unknown",
            action: data.result?.status || "unknown",
            txHash: data.result?.transaction_hash,
            status: data.result?.status === "success" ? "success" : "failed",
            // Enhanced event data
            eventSource: data.event_source || "unknown",
            actionType: data.result?.action_type || "unknown",
            amountAPT: data.result?.amount_apt || 0,
            gasUsed: data.result?.gas_used || 0,
            network: data.result?.network || "testnet",
            triggerNode: data.trigger_node,
            actionNode: data.action_node,
            iteration: data.iteration,
            // NFT specific data
            tokenName: data.event?.data?.token_name,
            collectionName: data.event?.data?.collection_name,
            isSimulated: data.event?.is_simulated || false,
          };

          setEvents((prev) => [newEvent, ...prev.slice(0, 99)]); // Keep last 100 events

          // 🔥 NEW: Emit workflow event to trigger node execution
          if (
            data.event?.event_type === "coin_received" ||
            data.event?.type === "transfer"
          ) {
            // Use workflow coordinator to route events to appropriate nodes
            const eventData = {
              to_address:
                data.event?.data?.to_address || data.event?.data?.recipient,
              amount: data.event?.data?.amount || 100000000,
              from_address:
                data.event?.data?.from_address || data.event?.data?.sender,
              transaction_hash: data.event?.data?.transaction_hash,
              timestamp: data.timestamp,
            };

            // Route to specific workflow if we have the workflow ID
            if (data.workflow_id) {
              workflowCoordinator.routeEvent(
                data.workflow_id,
                "TRANSFER_DETECTED",
                eventData,
                data.trigger_node // source node ID
              );
            } else {
              // Fallback: broadcast to all nodes (for backward compatibility)
              workflowEventBus.broadcast({
                type: "TRANSFER_DETECTED",
                data: eventData,
                workflowId: data.workflow_id,
                source: "event_monitor",
              });
            }
            console.log("🔥 Routed TRANSFER_DETECTED workflow event:", data);
          }

          // 🚀 NEW: Handle real transaction triggers from backend
          if (data.event?.event_type === "trigger_real_transaction") {
            console.log("🚀 RECEIVED REAL TRANSACTION TRIGGER:", data);

            // Route to the action node to execute real wallet transaction
            if (data.action_node) {
              workflowEventBus.broadcast({
                type: "EXECUTE_ACTION",
                targetNodeId: data.action_node,
                data: {
                  recipient: data.event.data.to_address,
                  amount: data.event.data.amount,
                  actionType: data.event.data.action_type || "token_transfer",
                },
                workflowId: data.workflow_id,
                source: "backend_trigger",
              });
              console.log(
                "🚀 Triggered EXECUTE_ACTION for real wallet transaction"
              );
            }
          }

          // Update enhanced stats
          setStats((prev) => {
            const newStats = {
              ...prev,
              totalEvents: prev.totalEvents + 1,
              successfulActions:
                data.result?.status === "success"
                  ? prev.successfulActions + 1
                  : prev.successfulActions,
              failedActions:
                data.result?.status !== "success"
                  ? prev.failedActions + 1
                  : prev.failedActions,
              realEvents:
                data.event_source === "real_aptos_data"
                  ? prev.realEvents + 1
                  : prev.realEvents,
              simulatedEvents:
                data.event_source === "simulated_data"
                  ? prev.simulatedEvents + 1
                  : prev.simulatedEvents,
            };

            // 🔥 NEW: Also emit general workflow status updates
            workflowEventBus.broadcast({
              type: "WORKFLOW_STATUS_UPDATE",
              data: {
                status: data.result?.status || "processing",
                workflowId: data.workflow_id,
                eventCount: newStats.totalEvents,
                timestamp: data.timestamp,
              },
              source: "event_monitor",
            });

            return newStats;
          });

          setSystemStatus((prev) => ({
            ...prev,
            lastEventTime: new Date(),
            dataSource: data.event_source || "unknown",
          }));
        } else if (data.type === "execute_transaction") {
          // 🔥 NEW: Handle real transaction requests from backend
          const newEvent = {
            id: `tx-req-${Date.now()}`,
            timestamp: new Date(),
            workflowId: data.workflow_id,
            eventType: "transaction_request",
            action: "wallet_approval_pending",
            status: "pending",
            eventSource: "backend_request",
            actionType: data.action_type,
            amountAPT: data.amount / 100000000,
            network: "testnet",
            isSimulated: false,
            recipient: data.recipient,
          };

          console.log("🚀 REAL TRANSACTION REQUEST logged:", newEvent);
          setEvents((prev) => [newEvent, ...prev.slice(0, 99)]);

          setStats((prev) => ({
            ...prev,
            totalEvents: prev.totalEvents + 1,
            realEvents: prev.realEvents + 1,
          }));
        }
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
      console.log("📡 WebSocket disconnected, attempting reconnection...");
      // Auto-reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
      setConnectionStatus("error");
      console.error("❌ WebSocket error:", error);
    };

    return ws;
  }, []);

  useEffect(() => {
    const ws = connectWebSocket();
    return () => {
      if (ws) ws.close();
    };
  }, [connectWebSocket]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-500";
      case "error":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  const formatEventType = (eventType) => {
    const typeMap = {
      nft_mint: "🎨 NFT Mint",
      token_transfer: "💰 Token Transfer",
      account_created: "👤 Account Created",
      smart_contract_event: "⚡ Smart Contract",
    };
    return typeMap[eventType] || eventType;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="event-monitor-overlay">
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          padding: "16px",
          maxHeight: "500px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Enhanced Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Activity className="w-5 h-5 text-blue-500" />
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: "600",
                color: "#2d3748",
              }}
            >
              🚀 Enhanced Event Monitor
            </h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Wifi className={`w-4 h-4 ${getConnectionColor()}`} />
            <span style={{ fontSize: "12px", color: "#718096" }}>
              {connectionStatus === "connected" ? "LIVE" : "OFFLINE"}
            </span>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #4ecdc4 0%, #38d9a9 100%)",
              color: "white",
              padding: "8px 12px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: "700" }}>
              {stats.totalEvents}
            </div>
            <div style={{ fontSize: "10px", opacity: 0.9 }}>Total Events</div>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #26de81 0%, #20bf6b 100%)",
              color: "white",
              padding: "8px 12px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: "700" }}>
              {stats.successfulActions}
            </div>
            <div style={{ fontSize: "10px", opacity: 0.9 }}>Success</div>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
              color: "white",
              padding: "8px 12px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: "700" }}>
              {stats.realEvents}
            </div>
            <div style={{ fontSize: "10px", opacity: 0.9 }}>Real Events</div>
          </div>

          <div
            style={{
              background: "linear-gradient(135deg, #a55eea 0%, #8854d0 100%)",
              color: "white",
              padding: "8px 12px",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "18px", fontWeight: "700" }}>
              {stats.activeWorkflows}
            </div>
            <div style={{ fontSize: "10px", opacity: 0.9 }}>Workflows</div>
          </div>
        </div>

        {/* System Status */}
        <div
          style={{
            background: "rgba(78, 205, 196, 0.1)",
            borderRadius: "6px",
            padding: "8px 10px",
            marginBottom: "12px",
            border: "1px solid rgba(78, 205, 196, 0.3)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
            }}
          >
            <Database className="w-3 h-3 text-blue-500" />
            <span style={{ fontWeight: "600", color: "#2d3748" }}>
              Data Source:{" "}
              {systemStatus.dataSource === "real_aptos_data"
                ? "🔴 Real Aptos"
                : "🟡 Enhanced Demo"}
            </span>
          </div>
          {systemStatus.lastEventTime && (
            <div
              style={{ fontSize: "10px", color: "#718096", marginTop: "2px" }}
            >
              Last Event: {formatTimeAgo(systemStatus.lastEventTime)}
            </div>
          )}
        </div>

        {/* Enhanced Events List */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            maxHeight: "250px",
          }}
        >
          {events.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#718096",
                fontSize: "14px",
              }}
            >
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div>🚀 Enhanced monitoring active...</div>
              <div style={{ fontSize: "12px", marginTop: "4px" }}>
                Real Aptos testnet events will appear here
              </div>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {events.map((event) => (
                <div
                  key={event.id}
                  style={{
                    background: event.isSimulated
                      ? "rgba(165, 94, 234, 0.05)"
                      : "rgba(78, 205, 196, 0.05)",
                    border: event.isSimulated
                      ? "1px solid rgba(165, 94, 234, 0.2)"
                      : "1px solid rgba(78, 205, 196, 0.2)",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    fontSize: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {getStatusIcon(event.status)}
                      <span style={{ fontWeight: "600", color: "#2d3748" }}>
                        {formatEventType(event.eventType)}
                      </span>
                      {event.isSimulated && (
                        <span
                          style={{
                            fontSize: "9px",
                            background: "#a55eea",
                            color: "white",
                            padding: "1px 4px",
                            borderRadius: "3px",
                          }}
                        >
                          DEMO
                        </span>
                      )}
                    </div>
                    <span style={{ color: "#718096", fontSize: "10px" }}>
                      {formatTimeAgo(event.timestamp)}
                    </span>
                  </div>

                  {/* Enhanced Event Details */}
                  <div style={{ color: "#4a5568", lineHeight: "1.4" }}>
                    {event.tokenName && (
                      <div style={{ fontSize: "11px", marginBottom: "2px" }}>
                        🎨 <strong>{event.tokenName}</strong>
                        {event.collectionName &&
                          ` from ${event.collectionName}`}
                      </div>
                    )}

                    {event.amountAPT > 0 && (
                      <div style={{ fontSize: "11px", marginBottom: "2px" }}>
                        💰 <strong>{event.amountAPT.toFixed(4)} APT</strong>
                      </div>
                    )}

                    {event.txHash && (
                      <div style={{ fontSize: "10px", color: "#718096" }}>
                        📋 {event.txHash.slice(0, 12)}...
                        {event.txHash.slice(-8)}
                      </div>
                    )}

                    {event.gasUsed > 0 && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#718096",
                          marginTop: "2px",
                        }}
                      >
                        ⛽ Gas: {event.gasUsed} • Network: {event.network}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
