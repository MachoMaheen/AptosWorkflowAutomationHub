// aptosEventTriggerNode.js - ENHANCED WITH DYNAMIC FIELDS & PROPER CONNECTIONS
import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useState, useCallback, useEffect } from "react";

export const AptosEventTriggerNode = ({ id, data }) => {
  const [currentEventType, setCurrentEventType] = useState(
    data?.eventType || "nft_mint"
  );
  const [forceUpdate, setForceUpdate] = useState(0);
  const [liveEventData, setLiveEventData] = useState(null);
  const [eventCount, setEventCount] = useState(0);
  const [lastEventTime, setLastEventTime] = useState(null);

  // Force re-render when event type changes
  useEffect(() => {
    setForceUpdate((prev) => prev + 1);
  }, [currentEventType]);

  // 🔥 NEW: Listen for live event data from backend
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Listen for node_executed events for this specific trigger node
        if (
          data.type === "node_executed" &&
          data.node_id === id &&
          data.node_type === "aptosEventTrigger"
        ) {
          console.log(
            `🎯 Live event data received for trigger node ${id}:`,
            data
          );

          // Extract the event data from the result
          if (data.result && data.result.data) {
            setLiveEventData(data.result.data);
            setEventCount((prev) => prev + 1);
            setLastEventTime(new Date(data.timestamp));
          }
        }
      } catch (error) {
        console.error(
          "Error parsing WebSocket message in EventTrigger:",
          error
        );
      }
    };

    ws.onopen = () => {
      console.log(`🔗 EventTrigger ${id} connected to WebSocket for live data`);
    };

    return () => {
      if (ws) ws.close();
    };
  }, [id]);

  // Dynamic fields that change based on dropdown selection
  const getFieldsForEventType = useCallback(
    (eventType) => {
      const baseFields = [
        {
          name: "eventType",
          type: "select",
          label: "Event Type",
          defaultValue: "nft_mint",
          options: [
            { value: "nft_mint", label: "NFT Mint Event" },
            { value: "token_transfer", label: "Token Transfer" },
            { value: "account_created", label: "Account Created" },
            { value: "smart_contract_event", label: "Smart Contract Event" },
            { value: "custom_event", label: "Custom Event" },
          ],
          onChange: (value) => {
            setCurrentEventType(value);
            setForceUpdate((prev) => prev + 1); // Force component re-render
            if (data) {
              data.eventType = value;
            }
          },
        },
        {
          name: "contractAddress",
          type: "text",
          label: "Contract Address",
          defaultValue: "0x1::collection::Collection",
          placeholder: "0x123...::module_name::StructName",
        },
        {
          name: "pollingInterval",
          type: "number",
          label: "Polling Interval (seconds)",
          defaultValue: 10,
          min: 5,
          max: 300,
          step: 5,
        },
      ];

      // Add event-specific fields based on selection
      switch (eventType) {
        case "nft_mint":
          return [
            ...baseFields,
            {
              name: "collectionName",
              type: "text",
              label: "Collection Name",
              defaultValue: "",
              placeholder: "e.g., Aptos Monkeys",
            },
            {
              name: "creatorAddress",
              type: "text",
              label: "Creator Address (Optional)",
              defaultValue: "",
              placeholder: "0x123... (leave empty for any creator)",
            },
          ];
        case "token_transfer":
          return [
            ...baseFields,
            {
              name: "minAmount",
              type: "number",
              label: "Minimum Amount (Octas)",
              defaultValue: 1000000,
              placeholder: "1000000 = 0.01 APT",
            },
            {
              name: "tokenType",
              type: "select",
              label: "Token Type",
              defaultValue: "APT",
              options: [
                { value: "APT", label: "APT (Native)" },
                { value: "USDC", label: "USDC" },
                { value: "custom", label: "Custom Token" },
              ],
            },
          ];
        default:
          return baseFields;
      }
    },
    [data]
  );

  const fields = getFieldsForEventType(currentEventType);

  // Typed handles for proper connections
  const handles = [
    {
      type: "source",
      position: Position.Right,
      id: `${id}-trigger`,
      style: {
        top: "25%",
        background: "#e74c3c",
        border: "3px solid #fff",
      },
      className: "trigger-handle",
      label: "Trigger",
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-event-data`,
      style: {
        top: "50%",
        background: "#4ecdc4",
        border: "3px solid #fff",
      },
      className: "data-handle",
      label: "Event Data",
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-metadata`,
      style: {
        top: "75%",
        background: "#9b59b6",
        border: "3px solid #fff",
      },
      className: "metadata-handle",
      label: "Metadata",
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="🎯 EVENT TRIGGER"
      fields={fields}
      handles={handles}
      className="aptos-event-trigger-node"
      minWidth={340}
      minHeight={300}
    >
      <div
        style={{
          fontSize: "11px",
          color: "#2d3748",
          marginTop: "10px",
          padding: "8px 12px",
          background: "rgba(255, 255, 255, 0.9)",
          borderRadius: "6px",
          border: "1px solid rgba(78, 205, 196, 0.5)",
        }}
      >
        <strong style={{ color: "#4ecdc4" }}>Mode:</strong> {currentEventType}
        <div style={{ marginTop: "4px", fontSize: "10px" }}>
          <strong>Outputs:</strong> Trigger | Event Data | Metadata
        </div>
      </div>

      {/* 🔥 NEW: Live Event Data Display */}
      {liveEventData && (
        <div
          style={{
            fontSize: "10px",
            color: "#2d3748",
            marginTop: "8px",
            padding: "8px 10px",
            background: "rgba(78, 205, 196, 0.1)",
            borderRadius: "6px",
            border: "1px solid rgba(78, 205, 196, 0.3)",
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
            <strong style={{ color: "#4ecdc4" }}>
              🔴 LIVE EVENT #{eventCount}
            </strong>
            {lastEventTime && (
              <span style={{ color: "#718096", fontSize: "9px" }}>
                {lastEventTime.toLocaleTimeString()}
              </span>
            )}
          </div>

          <div style={{ lineHeight: "1.4" }}>
            {liveEventData.event_type && (
              <div style={{ marginBottom: "3px" }}>
                <strong>Type:</strong> {liveEventData.event_type}
              </div>
            )}

            {liveEventData.account_address && (
              <div style={{ marginBottom: "3px" }}>
                <strong>Address:</strong>{" "}
                {liveEventData.account_address.slice(0, 8)}...
              </div>
            )}

            {liveEventData.data?.amount_apt && (
              <div style={{ marginBottom: "3px" }}>
                <strong>Amount:</strong>{" "}
                {liveEventData.data.amount_apt.toFixed(4)} APT
              </div>
            )}

            {liveEventData.data?.token_name && (
              <div style={{ marginBottom: "3px" }}>
                <strong>Token:</strong> {liveEventData.data.token_name}
              </div>
            )}

            {liveEventData.transaction_version && (
              <div style={{ fontSize: "9px", color: "#718096" }}>
                TX #{liveEventData.transaction_version}
              </div>
            )}
          </div>
        </div>
      )}

      {!liveEventData && (
        <div
          style={{
            fontSize: "10px",
            color: "#718096",
            marginTop: "8px",
            padding: "8px 10px",
            background: "rgba(255, 255, 255, 0.5)",
            borderRadius: "6px",
            border: "1px dashed rgba(113, 128, 150, 0.3)",
            textAlign: "center",
          }}
        >
          ⏳ Waiting for events...
        </div>
      )}
    </BaseNode>
  );
};
