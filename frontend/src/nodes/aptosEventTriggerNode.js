// aptosEventTriggerNode.js - ENHANCED WITH DYNAMIC FIELDS & PROPER HANDLES
import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useState } from "react";

export const AptosEventTriggerNode = ({ id, data }) => {
  const [currentEventType, setCurrentEventType] = useState(
    data?.eventType || "nft_mint"
  );

  // Dynamic fields based on event type
  const getFieldsForEventType = (eventType) => {
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
          // Update data immediately
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

    // Add event-specific fields
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
          {
            name: "eventFilter",
            type: "textarea",
            label: "Event Filter (JSON)",
            defaultValue: '{"type": "mint"}',
            placeholder: '{"property_version": 0, "amount": ">1"}',
          },
        ];

      case "token_transfer":
        return [
          ...baseFields,
          {
            name: "tokenType",
            type: "select",
            label: "Token Type",
            defaultValue: "apt",
            options: [
              { value: "apt", label: "APT" },
              { value: "custom", label: "Custom Token" },
            ],
          },
          {
            name: "minAmount",
            type: "number",
            label: "Minimum Amount",
            defaultValue: 1000000,
            placeholder: "1000000 = 0.01 APT",
          },
          {
            name: "eventFilter",
            type: "textarea",
            label: "Event Filter (JSON)",
            defaultValue: '{"amount": ">0"}',
            placeholder: '{"amount": ">1000000", "to": "0x123..."}',
          },
        ];

      case "account_created":
        return [
          ...baseFields,
          {
            name: "accountFilter",
            type: "text",
            label: "Account Filter",
            defaultValue: "",
            placeholder: "Leave empty for all accounts",
          },
        ];

      case "smart_contract_event":
        return [
          ...baseFields,
          {
            name: "eventName",
            type: "text",
            label: "Event Name",
            defaultValue: "",
            placeholder: "e.g., TransferEvent",
          },
          {
            name: "eventFilter",
            type: "textarea",
            label: "Event Filter (JSON)",
            defaultValue: "{}",
            placeholder: '{"field": "value"}',
          },
        ];

      case "custom_event":
        return [
          ...baseFields,
          {
            name: "eventName",
            type: "text",
            label: "Event Name",
            defaultValue: "",
            placeholder: "Custom event name",
          },
          {
            name: "eventFilter",
            type: "textarea",
            label: "Event Filter (JSON)",
            defaultValue: "{}",
            placeholder: '{"custom_field": "value"}',
          },
        ];

      default:
        return baseFields;
    }
  };

  const fields = getFieldsForEventType(currentEventType);

  // Dynamic handles based on event type
  const getDynamicHandles = (eventType) => {
    const baseHandles = [
      {
        type: "source",
        position: Position.Right,
        id: `${id}-trigger`,
        style: { top: "25%" },
        className: "trigger-handle",
        label: "Trigger",
      },
      {
        type: "source",
        position: Position.Right,
        id: `${id}-event-data`,
        style: { top: "50%" },
        className: "data-handle",
        label: "Event Data",
      },
      {
        type: "source",
        position: Position.Right,
        id: `${id}-metadata`,
        style: { top: "75%" },
        className: "metadata-handle",
        label: "Metadata",
      },
    ];

    return baseHandles;
  };

  const handles = getDynamicHandles(currentEventType);

  return (
    <BaseNode
      id={id}
      data={data}
      title="🎯 APTOS EVENT TRIGGER"
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
          marginTop: "4px" /* Reduced top margin */,
          marginBottom: "0px" /* Ensure no bottom margin */,
          padding: "6px 10px" /* Reduced padding */,
          background: "rgba(255, 255, 255, 0.9)",
          borderRadius: "6px",
          border: "1px solid rgba(78, 205, 196, 0.5)",
        }}
      >
        <strong style={{ color: "#4ecdc4" }}>Status:</strong> Listening for{" "}
        {currentEventType.replace("_", " ")} events...
        <div style={{ marginTop: "2px", fontSize: "10px" }}>
          <strong>Output:</strong> Trigger → Event Data → Metadata
        </div>
      </div>
    </BaseNode>
  );
};
