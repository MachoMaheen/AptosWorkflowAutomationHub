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
import { usePipeline } from "./PipelineContext";
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
import { TestNode } from "./nodes/TestNode";

import toast from "react-hot-toast";
import "@xyflow/react/dist/style.css";
import "./styles/ReactFlowOverrides.css";
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
  
  test: TestNode, // Add test node for debugging
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
  test: 0,
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

  // Create a sample event-driven automation workflow (PRD-based)
  const createSampleWorkflow = useCallback(() => {
    // Clear existing nodes and edges
    setNodes([]);
    setEdges([]);

    // Create event-driven automation workflow as per PRD
    const walletNode = {
      id: 'wallet-1',
      type: 'walletConnection',
      position: { x: 50, y: 100 },
      data: { 
        id: 'wallet-1', 
        nodeType: 'walletConnection',
        walletType: 'petra',
        network: 'testnet',
        autoConnect: true
      },
    };

    const eventTriggerNode = {
      id: 'event-trigger-1',
      type: 'aptosEventTrigger',
      position: { x: 300, y: 200 },
      data: { 
        id: 'event-trigger-1', 
        nodeType: 'aptosEventTrigger',
        eventType: 'NFT Mint Event',
        contractAddress: '0x1::collection::Collection',
        collectionName: 'Aptos Monkeys',
        pollingInterval: 10
      },
    };

    const actionNode = {
      id: 'action-1',
      type: 'aptosAction',
      position: { x: 650, y: 200 },
      data: { 
        id: 'action-1', 
        nodeType: 'aptosAction',
        actionType: 'token_transfer',
        amount: '100000000',
        recipientAddress: '0x123...abc',
        note: 'Welcome bonus for NFT mint!'
      },
    };

    const outputNode = {
      id: 'output-1',
      type: 'customOutput',
      position: { x: 950, y: 200 },
      data: { 
        id: 'output-1', 
        nodeType: 'customOutput',
        outputType: 'JSON',
        outputName: 'transaction_result'
      },
    };

    // Create edges with proper handle connections and color coding
    const eventTriggerEdge = {
      id: 'edge-event-trigger',
      source: 'event-trigger-1',
      target: 'action-1',
      sourceHandle: 'event-trigger-1-trigger',
      targetHandle: 'action-1-trigger',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 25,
        height: 25,
        color: "#ff6b6b",
      },
      style: {
        stroke: "#ff6b6b",
        strokeWidth: 3,
      },
      animated: true,
      type: "smoothstep",
      label: "🔥 Event Trigger",
      labelStyle: { fontSize: 12, fontWeight: 'bold', color: '#ff6b6b' },
      labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
    };

    const eventDataEdge = {
      id: 'edge-event-data',
      source: 'event-trigger-1',
      target: 'action-1',
      sourceHandle: 'event-trigger-1-event-data',
      targetHandle: 'action-1-data',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 25,
        height: 25,
        color: "#4ecdc4",
      },
      style: {
        stroke: "#4ecdc4",
        strokeWidth: 3,
      },
      animated: true,
      type: "smoothstep",
      label: "📊 Event Data",
      labelStyle: { fontSize: 12, fontWeight: 'bold', color: '#4ecdc4' },
      labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
    };

    const walletDataEdge = {
      id: 'edge-wallet-data',
      source: 'wallet-1',
      target: 'action-1',
      sourceHandle: 'wallet-1-address',
      targetHandle: 'action-1-data',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 25,
        height: 25,
        color: "#4ecdc4",
      },
      style: {
        stroke: "#4ecdc4",
        strokeWidth: 3,
      },
      animated: true,
      type: "smoothstep",
      label: "💰 Wallet Data",
      labelStyle: { fontSize: 12, fontWeight: 'bold', color: '#4ecdc4' },
      labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
    };

    const successEdge = {
      id: 'edge-success',
      source: 'action-1',
      target: 'output-1',
      sourceHandle: 'action-1-success',
      targetHandle: 'output-1-value',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 25,
        height: 25,
        color: "#26de81",
      },
      style: {
        stroke: "#26de81",
        strokeWidth: 3,
      },
      animated: true,
      type: "smoothstep",
      label: "✅ Success",
      labelStyle: { fontSize: 12, fontWeight: 'bold', color: '#26de81' },
      labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
    };

    // Add all nodes and edges
    setNodes([walletNode, eventTriggerNode, actionNode, outputNode]);
    setEdges([eventTriggerEdge, eventDataEdge, walletDataEdge, successEdge]);

    toast.success("🎯 Event-Driven Automation Workflow Created!\n\n\"When NFT is minted → Send welcome bonus\"", {
      duration: 6000,
      style: {
        background: '#dcfce7',
        color: '#15803d',
        border: '1px solid #86efac',
        fontSize: '14px',
        fontWeight: '600',
        padding: '16px',
        maxWidth: '400px',
      },
    });
  }, [setNodes, setEdges]);

  // Clear all nodes and edges
  const clearWorkflow = useCallback(() => {
    setNodes([]);
    setEdges([]);
    toast.success("🗑️ Workflow cleared!", {
      duration: 2000,
    });
  }, [setNodes, setEdges]);

  const { isValidConnection } = usePipeline();

  const onConnect = useCallback(
    (params) => {
      console.log("Connection attempt:", params);
      
      // Validate connection before adding
      if (!isValidConnection(params)) {
        toast.error("❌ Invalid connection! Check node compatibility and handle types.", {
          duration: 4000,
          style: {
            background: '#fee2e2',
            color: '#dc2626',
            border: '1px solid #fca5a5',
          },
        });
        return;
      }

      // Add directional arrow marker to all new connections
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 25,
          height: 25,
          color: "#4ecdc4",
        },
        style: {
          stroke: "#4ecdc4",
          strokeWidth: 3,
        },
        animated: true,
        type: "smoothstep",
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
      
      toast.success("🔗 Nodes connected successfully!", {
        duration: 3000,
        style: {
          background: '#dcfce7',
          color: '#15803d',
          border: '1px solid #86efac',
        },
      });
    },
    [setEdges, isValidConnection]
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
          connectionLineStyle={{
            stroke: "#ff6b6b",
            strokeWidth: 4,
            strokeDasharray: "8,8",
          }}
          defaultEdgeOptions={{
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 25,
              height: 25,
              color: "#4ecdc4",
            },
            style: {
              stroke: "#4ecdc4",
              strokeWidth: 3,
            },
            animated: true,
          }}
          // Add these critical props for handle visibility
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          deleteKeyCode={["Delete", "Backspace"]}
          // Ensure handles are always visible and interactive
          onlyRenderVisibleElements={false}
          nodeOrigin={[0.5, 0.5]}
          // Default viewport settings for better handle visibility
          fitView={false}
          minZoom={0.2}
          maxZoom={4}
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
            display: "flex",
            gap: "10px",
          }}
        >
          <SubmitButton nodes={nodes} edges={edges} />
          
          {/* Sample workflow button */}
          <button
            onClick={createSampleWorkflow}
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)",
              border: "none",
              borderRadius: "8px",
              color: "white",
              padding: "10px 16px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              transition: "all 0.2s ease",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
            }}
          >
            🎯 Event-Driven Demo
          </button>
          
          {/* Clear workflow button */}
          {(nodes.length > 0 || edges.length > 0) && (
            <button
              onClick={clearWorkflow}
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                border: "none",
                borderRadius: "8px",
                color: "white",
                padding: "10px 16px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                transition: "all 0.2s ease",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(0, 0, 0, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
              }}
            >
              🗑️ Clear Workflow
            </button>
          )}
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
