// outputNode.js - ENHANCED WITH DYNAMIC FIELDS & PROPER DATA FLOW

import { Position } from "@xyflow/react";
import { BaseNode } from "../components/BaseNode";
import { useState } from "react";

export const OutputNode = ({ id, data }) => {
  const [currentOutputType, setCurrentOutputType] = useState(
    data?.outputType || "Text"
  );

  // Dynamic fields based on output type
  const getFieldsForOutputType = (outputType) => {
    const baseFields = [
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
          { value: "Number", label: "Number" },
          { value: "Boolean", label: "Boolean" },
          { value: "Image", label: "Image" },
          { value: "JSON", label: "JSON" },
          { value: "File", label: "File" },
          { value: "Table", label: "Table" },
        ],
        onChange: (value) => {
          setCurrentOutputType(value);
          if (data) {
            data.outputType = value;
          }
        },
      },
    ];

    // Add type-specific fields
    switch (outputType) {
      case "Text":
        return [
          ...baseFields,
          {
            name: "format",
            type: "select",
            label: "Text Format",
            defaultValue: "plain",
            options: [
              { value: "plain", label: "Plain Text" },
              { value: "markdown", label: "Markdown" },
              { value: "html", label: "HTML" },
            ],
          },
        ];

      case "Number":
        return [
          ...baseFields,
          {
            name: "precision",
            type: "number",
            label: "Decimal Places",
            defaultValue: 2,
            min: 0,
            max: 10,
          },
          {
            name: "thousandsSeparator",
            type: "select",
            label: "Thousands Separator",
            defaultValue: "true",
            options: [
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ],
          },
        ];

      case "Image":
        return [
          ...baseFields,
          {
            name: "imageFormat",
            type: "select",
            label: "Image Format",
            defaultValue: "png",
            options: [
              { value: "png", label: "PNG" },
              { value: "jpg", label: "JPEG" },
              { value: "svg", label: "SVG" },
              { value: "webp", label: "WebP" },
            ],
          },
          {
            name: "maxWidth",
            type: "number",
            label: "Max Width (px)",
            defaultValue: 800,
            min: 100,
            max: 4096,
          },
          {
            name: "maxHeight",
            type: "number",
            label: "Max Height (px)",
            defaultValue: 600,
            min: 100,
            max: 4096,
          },
        ];

      case "JSON":
        return [
          ...baseFields,
          {
            name: "prettyPrint",
            type: "select",
            label: "Pretty Print",
            defaultValue: "true",
            options: [
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ],
          },
          {
            name: "indentSize",
            type: "number",
            label: "Indent Size",
            defaultValue: 2,
            min: 0,
            max: 8,
          },
        ];

      case "File":
        return [
          ...baseFields,
          {
            name: "fileName",
            type: "text",
            label: "File Name",
            defaultValue: "output",
            placeholder: "Output file name",
          },
          {
            name: "fileExtension",
            type: "text",
            label: "File Extension",
            defaultValue: ".txt",
            placeholder: ".txt, .json, .csv, etc.",
          },
        ];

      case "Table":
        return [
          ...baseFields,
          {
            name: "tableFormat",
            type: "select",
            label: "Table Format",
            defaultValue: "markdown",
            options: [
              { value: "markdown", label: "Markdown" },
              { value: "html", label: "HTML" },
              { value: "csv", label: "CSV" },
              { value: "json", label: "JSON" },
            ],
          },
          {
            name: "includeHeaders",
            type: "select",
            label: "Include Headers",
            defaultValue: "true",
            options: [
              { value: "true", label: "Yes" },
              { value: "false", label: "No" },
            ],
          },
        ];

      default:
        return baseFields;
    }
  };

  const fields = getFieldsForOutputType(currentOutputType);

  const handles = [
    {
      type: "target",
      position: Position.Left,
      id: `${id}-value`,
      style: { 
        top: "50%",
        background: "#4ecdc4",
        border: "3px solid #fff"
      },
      className: "data-handle",
      label: "Value",
    },
    {
      type: "target",
      position: Position.Left,
      id: `${id}-trigger`,
      style: { 
        top: "25%",
        background: "#e74c3c",
        border: "3px solid #fff"
      },
      className: "trigger-handle",
      label: "Trigger",
    },
  ];

  return (
    <BaseNode
      id={id}
      data={data}
      title="📤 OUTPUT"
      fields={fields}
      handles={handles}
      className="output-node"
      minWidth={280}
      minHeight={200}
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
        <strong style={{ color: "#4ecdc4" }}>Type:</strong> {currentOutputType}
        <div style={{ marginTop: "4px", fontSize: "10px" }}>
          <strong>Input:</strong> Data to display/export
        </div>
      </div>
    </BaseNode>
  );
};
