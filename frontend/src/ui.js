// ui.js
// Displays the drag-and-drop UI
// --------------------------------------------------

import { useRef, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  MarkerType,
  useReactFlow,
} from "@xyflow/react";
import { InputNode } from "./nodes/inputNode";
import { LLMNode } from "./nodes/llmNode";
import { OutputNode } from "./nodes/outputNode";
import { TextNode } from "./nodes/textNode";
import { MathNode } from "./nodes/mathNode";
import { FilterNode } from "./nodes/filterNode";
import { APINode } from "./nodes/apiNode";
import { TimerNode } from "./nodes/timerNode";
import { ConditionalNode } from "./nodes/conditionalNode";
import { SubmitButton } from "./submit";
// Add these imports to the existing imports
import { AptosEventTriggerNode } from "./nodes/aptosEventTriggerNode";
import { AptosActionNode } from "./nodes/aptosActionNode";
import { WalletConnectionNode } from "./nodes/walletConnectionNode";

// // Add these to the existing nodeTypes object
// const nodeTypes = {
//   // ... existing node types ...
//   aptosEventTrigger: AptosEventTriggerNode,
//   aptosAction: AptosActionNode,
//   walletConnection: WalletConnectionNode,
// };

// // Add these to the existing nodeIdCounter object
// let nodeIdCounter = {
//   // ... existing counters ...
//   aptosEventTrigger: 0,
//   aptosAction: 0,
//   walletConnection: 0,
// };

import "@xyflow/react/dist/style.css";
import "./ui.css";
import "./edges.css";

const gridSize = 20;
const proOptions = { hideAttribution: true };
const nodeTypes = {
  customInput: InputNode,
  llm: LLMNode,
  customOutput: OutputNode,
  text: TextNode,
  math: MathNode,
  filter: FilterNode,
  api: APINode,
  timer: TimerNode,
  conditional: ConditionalNode,

  aptosEventTrigger: AptosEventTriggerNode,
  aptosAction: AptosActionNode,
  walletConnection: WalletConnectionNode,
};

// Simple node ID counter - no external store needed
let nodeIdCounter = {
  customInput: 0,
  llm: 0,
  customOutput: 0,
  text: 0,
  math: 0,
  filter: 0,
  api: 0,
  timer: 0,
  conditional: 0,
  aptosEventTrigger: 0,
  aptosAction: 0,
  walletConnection: 0,
};

const FlowComponent = () => {
  const reactFlowWrapper = useRef(null);
  const { getNodes } = useReactFlow();

  // Use React Flow's built-in state management only
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Handle keyboard events for node deletion
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle Delete key when not typing in an input
      if (
        event.key === "Delete" &&
        !event.target.matches("input, textarea, select")
      ) {
        event.preventDefault();

        // Get currently selected nodes
        const selectedNodes = getNodes().filter((node) => node.selected);

        if (selectedNodes.length > 0) {
          const selectedNodeIds = selectedNodes.map((node) => node.id);

          // Remove selected nodes and their connected edges
          setNodes((currentNodes) =>
            currentNodes.filter((node) => !selectedNodeIds.includes(node.id))
          );
          setEdges((currentEdges) =>
            currentEdges.filter(
              (edge) =>
                !selectedNodeIds.includes(edge.source) &&
                !selectedNodeIds.includes(edge.target)
            )
          );
        }
      }
    };

    // Add event listener to the document
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [getNodes, setNodes, setEdges]);

  // Simple local function for generating node IDs
  const getNodeID = (type) => {
    nodeIdCounter[type] = (nodeIdCounter[type] || 0) + 1;
    return `${type}-${nodeIdCounter[type]}`;
  };

  const getInitNodeData = (nodeID, type) => {
    let nodeData = { id: nodeID, nodeType: `${type}` };
    return nodeData;
  };

  const onConnect = useCallback(
    (params) => {
      // Add directional arrow marker to all new connections
      const newEdge = {
        ...params,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: "#4ecdc4",
        },
        style: {
          stroke: "#4ecdc4",
          strokeWidth: 2,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      if (event?.dataTransfer?.getData("application/reactflow")) {
        const appData = JSON.parse(
          event.dataTransfer.getData("application/reactflow")
        );
        const type = appData?.nodeType;

        // check if the dropped element is valid
        if (typeof type === "undefined" || !type) {
          return;
        }

        // Simple coordinate calculation without needing the React Flow instance
        const position = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        };

        const nodeID = getNodeID(type);
        const newNode = {
          id: nodeID,
          type,
          position,
          data: getInitNodeData(nodeID, type),
        };

        setNodes((nds) => nds.concat(newNode));
      }
    },
    [setNodes]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <>
      <div
        ref={reactFlowWrapper}
        className="react-flow-wrapper"
        style={{ width: "100vw", height: "100vh", position: "relative" }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          proOptions={proOptions}
          snapGrid={[gridSize, gridSize]}
          connectionLineType="smoothstep"
          defaultEdgeOptions={{
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
              color: "#4ecdc4",
            },
            style: {
              stroke: "#4ecdc4",
              strokeWidth: 2,
            },
          }}
        >
          <Background color="#aaa" gap={gridSize} />
          <Controls position="bottom-left" />
          <MiniMap
            position="top-left"
            nodeColor={(n) => {
              if (n.type === "customInput") return "#667eea";
              if (n.type === "customOutput") return "#f093fb";
              if (n.type === "text") return "#43e97b";
              if (n.type === "llm") return "#4facfe";
              return "#ccc";
            }}
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              border: "2px solid #4a5568",
              borderRadius: "8px",
            }}
          />
        </ReactFlow>

        {/* Submit button positioned as overlay */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50px",
            zIndex: 1000,
          }}
        >
          <SubmitButton nodes={nodes} edges={edges} />
        </div>
      </div>
    </>
  );
};

export const PipelineUI = () => {
  return (
    <ReactFlowProvider>
      <FlowComponent />
    </ReactFlowProvider>
  );
};
