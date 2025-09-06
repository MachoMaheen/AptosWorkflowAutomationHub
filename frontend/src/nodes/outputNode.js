// outputNode.js

import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";

export const OutputNode = ({ id, data }) => {
  const fields = [
    {
      name: "outputName",
      type: "text",
      label: "Name",
      defaultValue: id.replace("customOutput-", "output_"),
      placeholder: "Enter output name",
    },
    {
      name: "outputType",
      type: "select",
      label: "Type",
      defaultValue: "Text",
      options: [
        { value: "Text", label: "Text" },
        { value: "Image", label: "Image" },
      ],
    },
  ];

  const handles = [
    {
      type: "target",
      position: Position.Left,
      id: `${id}-value`,
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="OUTPUT"
      fields={fields}
      handles={handles}
      className="output-node"
      minWidth={250}
      minHeight={130}
    />
  );
};
