// inputNode.js

import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";

export const InputNode = ({ id, data }) => {
  const fields = [
    {
      name: "inputName",
      type: "text",
      label: "Name",
      defaultValue: id.replace("customInput-", "input_"),
      placeholder: "Enter input name",
    },
    {
      name: "inputType",
      type: "select",
      label: "Type",
      defaultValue: "Text",
      options: [
        { value: "Text", label: "Text" },
        { value: "File", label: "File" },
      ],
    },
  ];

  const handles = [
    {
      type: "source",
      position: Position.Right,
      id: `${id}-value`,
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="INPUT"
      fields={fields}
      handles={handles}
      className="input-node"
      minWidth={250}
      minHeight={130}
    />
  );
};
