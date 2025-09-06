// timerNode.js
// Demonstrates timer/delay node

import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";

export const TimerNode = ({ id, data }) => {
  const fields = [
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
      ],
    },
  ];

  const handles = [
    {
      type: "target",
      position: Position.Left,
      id: `${id}-trigger`,
    },
    {
      type: "source",
      position: Position.Right,
      id: `${id}-output`,
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="Timer"
      fields={fields}
      handles={handles}
      className="timer-node"
    />
  );
};
