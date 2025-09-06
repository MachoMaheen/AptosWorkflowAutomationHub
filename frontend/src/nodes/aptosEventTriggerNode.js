// aptosEventTriggerNode.js
// Node for listening to Aptos blockchain events

import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";

export const AptosEventTriggerNode = ({ id, data }) => {
  const fields = [
    {
      name: "eventType",
      type: "select",
      label: "Event Type",
      defaultValue: "nft_mint",
      options: [
        { value: "nft_mint", label: "NFT Mint Event" },
        { value: "token_transfer", label: "Token Transfer" },
        { value: "account_created", label: "Account Created" },
        { value: "custom_event", label: "Custom Event" },
      ],
    },
    {
      name: "contractAddress",
      type: "text",
      label: "Contract Address",
      defaultValue: "0x1::collection::Collection",
      placeholder: "0x123...::module_name::StructName",
    },
    {
      name: "collectionName",
      type: "text",
      label: "Collection Name (NFT)",
      defaultValue: "",
      placeholder: "e.g., Aptos Monkeys",
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
    {
      name: "eventFilter",
      type: "textarea",
      label: "Event Filter (JSON)",
      defaultValue: '{"type": "mint"}',
      placeholder: '{"field": "value", "amount": ">1000"}',
    },
  ];

  const handles = [
    {
      type: "source",
      position: Position.Right,
      id: `${id}-event`,
      style: { top: "30%" },
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-metadata`,
      style: { top: "70%" },
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="APTOS EVENT TRIGGER"
      fields={fields}
      handles={handles}
      className="aptos-event-trigger-node"
      minWidth={320}
      minHeight={280}
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
        <strong style={{ color: "#4ecdc4" }}>Status:</strong> Listening for
        events...
      </div>
    </BaseNode>
  );
};
