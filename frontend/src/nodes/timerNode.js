// timerNode.js - ENHANCED WITH DYNAMIC FIELDS & PROPER DATA FLOW

import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useState } from "react";

export const TimerNode = ({ id, data }) => {
  const [currentRepeat, setCurrentRepeat] = useState(data?.repeat || "once");

  // Dynamic fields based on repeat type
  const getFieldsForRepeat = (repeat) => {
    const baseFields = [
      {
        name: "delay",
        type: "number",
        label: "Delay",
        defaultValue: 5,
        min: 0.1,
        max: 3600,
        step: 0.1,
      },
      {
        name: "unit",
        type: "select",
        label: "Time Unit",
        defaultValue: "seconds",
        options: [
          { value: "milliseconds", label: "Milliseconds" },
          { value: "seconds", label: "Seconds" },
          { value: "minutes", label: "Minutes" },
          { value: "hours", label: "Hours" },
        ],
      },
      {
        name: "repeat",
        type: "select",
        label: "Repeat",
        defaultValue: "once",
        options: [
          { value: "once", label: "Once" },
          { value: "interval", label: "Interval" },
          { value: "cron", label: "Cron Schedule" },
          { value: "random", label: "Random Interval" },
        ],
        onChange: (value) => {
          setCurrentRepeat(value);
          if (data) {
            data.repeat = value;
          }
        },
      },
    ];

    // Add repeat-specific fields
    switch (repeat) {
      case "interval":
        return [
          ...baseFields,
          {
            name: "maxExecutions",
            type: "number",
            label: "Max Executions",
            defaultValue: 10,
            min: 1,
            max: 1000,
            placeholder: "Leave empty for unlimited",
          },
        ];

      case "cron":
        return [
          ...baseFields,
          {
            name: "cronExpression",
            type: "text",
            label: "Cron Expression",
            defaultValue: "*/5 * * * *",
            placeholder: "* * * * * (minute hour day month weekday)",
          },
          {
            name: "timezone",
            type: "select",
            label: "Timezone",
            defaultValue: "UTC",
            options: [
              { value: "UTC", label: "UTC" },
              { value: "America/New_York", label: "Eastern Time" },
              { value: "America/Los_Angeles", label: "Pacific Time" },
              { value: "Europe/London", label: "London" },
              { value: "Asia/Tokyo", label: "Tokyo" },
            ],
          },
        ];

      case "random":
        return [
          ...baseFields,
          {
            name: "minDelay",
            type: "number",
            label: "Min Delay",
            defaultValue: 1,
            min: 0.1,
            max: 3600,
            step: 0.1,
          },
          {
            name: "maxDelay",
            type: "number",
            label: "Max Delay",
            defaultValue: 10,
            min: 0.1,
            max: 3600,
            step: 0.1,
          },
        ];

      default:
        return baseFields;
    }
  };

  const fields = getFieldsForRepeat(currentRepeat);

  const handles = [
    {
      type: "target",
      position: Position.Left,
      id: `${id}-trigger`,
      style: { top: "30%" },
      className: "trigger-handle",
      label: "Trigger",
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-config`,
      style: { top: "70%" },
      className: "data-handle",
      label: "Config",
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-output`,
      style: { top: "50%" },
      className: "data-handle",
      label: "Output",
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="⏰ TIMER"
      fields={fields}
      handles={handles}
      className="timer-node"
      minWidth={300}
      minHeight={220}
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
        <strong style={{ color: "#4ecdc4" }}>Mode:</strong> {currentRepeat}
        <div style={{ marginTop: "4px", fontSize: "10px" }}>
          <strong>Inputs:</strong> Trigger | Config
          <br />
          <strong>Output:</strong> Timer events
        </div>
      </div>
    </BaseNode>
  );
};
