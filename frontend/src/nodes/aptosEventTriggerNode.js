// aptosEventTriggerNode.js - ENHANCED WITH DYNAMIC FIELDS & PROPER CONNECTIONS
import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useState, useCallback, useEffect } from "react";

export const AptosEventTriggerNode = ({ id, data }) => {
  const [currentEventType, setCurrentEventType] = useState(data?.eventType || "nft_mint");
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force re-render when event type changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [currentEventType]);

  // Dynamic fields that change based on dropdown selection
  const getFieldsForEventType = useCallback((eventType) => {
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
          setForceUpdate(prev => prev + 1); // Force component re-render
          if (data) {
            data.eventType = value;
          }
        }
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
          }
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
          }
        ];
      default:
        return baseFields;
    }
  }, [data]);

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
        border: "3px solid #fff"
      },
      className: "trigger-handle",
      label: "Trigger"
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-event-data`,
      style: { 
        top: "50%", 
        background: "#4ecdc4",
        border: "3px solid #fff"
      },
      className: "data-handle",
      label: "Event Data"
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-metadata`,
      style: { 
        top: "75%", 
        background: "#9b59b6",
        border: "3px solid #fff"
      },
      className: "metadata-handle",
      label: "Metadata"
    }
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
      <div style={{
        fontSize: "11px",
        color: "#2d3748",
        marginTop: "10px",
        padding: "8px 12px",
        background: "rgba(255, 255, 255, 0.9)",
        borderRadius: "6px",
        border: "1px solid rgba(78, 205, 196, 0.5)",
      }}>
        <strong style={{ color: "#4ecdc4" }}>Mode:</strong> {currentEventType}
        <div style={{ marginTop: "4px", fontSize: "10px" }}>
          <strong>Outputs:</strong> Trigger | Event Data | Metadata
        </div>
      </div>
    </BaseNode>
  );
};
