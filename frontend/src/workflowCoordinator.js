// workflowCoordinator.js - Coordinates workflow execution between connected nodes
import { workflowEventBus } from "./workflowEventBus";

class WorkflowCoordinator {
  constructor() {
    this.workflows = new Map(); // Map of workflowId -> workflow definition
    this.nodeConnections = new Map(); // Map of nodeId -> connected node IDs
    this.nodeTypes = new Map(); // Map of nodeId -> node type
  }

  // Register a workflow with its nodes and connections
  registerWorkflow(workflowId, nodes, edges) {
    console.log(
      `Registering workflow ${workflowId} with ${nodes.length} nodes and ${edges.length} edges`
    );

    const workflow = {
      id: workflowId,
      nodes: new Map(),
      edges: edges || [],
    };

    // Store node information
    nodes.forEach((node) => {
      workflow.nodes.set(node.id, {
        id: node.id,
        type: node.type,
        data: node.data,
        position: node.position,
      });
      this.nodeTypes.set(node.id, node.type);
    });

    // Build connection map
    edges.forEach((edge) => {
      const sourceId = edge.source;
      const targetId = edge.target;

      if (!this.nodeConnections.has(sourceId)) {
        this.nodeConnections.set(sourceId, []);
      }
      this.nodeConnections.get(sourceId).push(targetId);
    });

    this.workflows.set(workflowId, workflow);
    console.log(`Workflow ${workflowId} registered successfully`);
  }

  // Find target nodes for an event based on workflow structure
  findTargetNodes(workflowId, eventType, sourceNodeId = null) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      console.log(`Workflow ${workflowId} not found`);
      return [];
    }

    const targetNodes = [];

    // If we have a source node, find its connected targets
    if (sourceNodeId && this.nodeConnections.has(sourceNodeId)) {
      const connectedNodes = this.nodeConnections.get(sourceNodeId);
      connectedNodes.forEach((nodeId) => {
        const nodeType = this.nodeTypes.get(nodeId);
        if (this.shouldNodeHandleEvent(nodeType, eventType)) {
          targetNodes.push(nodeId);
        }
      });
    } else {
      // No source node specified, find all nodes that can handle this event type
      workflow.nodes.forEach((node, nodeId) => {
        if (this.shouldNodeHandleEvent(node.type, eventType)) {
          targetNodes.push(nodeId);
        }
      });
    }

    console.log(
      `Found ${targetNodes.length} target nodes for event ${eventType} in workflow ${workflowId}:`,
      targetNodes
    );
    return targetNodes;
  }

  // Determine if a node type should handle a specific event type
  shouldNodeHandleEvent(nodeType, eventType) {
    const eventHandlers = {
      aptosAction: ["TRANSFER_DETECTED", "EXECUTE_ACTION", "TOKEN_RECEIVED"],
      output: ["WORKFLOW_STATUS_UPDATE", "ACTION_COMPLETED"],
      conditionalNode: ["TRANSFER_DETECTED", "TOKEN_RECEIVED"],
      filterNode: ["TRANSFER_DETECTED", "TOKEN_RECEIVED"],
    };

    return eventHandlers[nodeType]?.includes(eventType) || false;
  }

  // Route an event to appropriate nodes in a workflow
  routeEvent(workflowId, eventType, eventData, sourceNodeId = null) {
    const targetNodes = this.findTargetNodes(
      workflowId,
      eventType,
      sourceNodeId
    );

    if (targetNodes.length === 0) {
      console.log(
        `No target nodes found for event ${eventType} in workflow ${workflowId}`
      );
      return;
    }

    // Send event to each target node
    targetNodes.forEach((nodeId) => {
      console.log(`Routing ${eventType} event to node ${nodeId}`);
      workflowEventBus.emit(nodeId, {
        type: eventType,
        data: eventData,
        workflowId,
        sourceNodeId,
        targetNodeId: nodeId,
        timestamp: new Date().toISOString(),
      });
    });
  }

  // Get workflow status
  getWorkflowStatus(workflowId) {
    const workflow = this.workflows.get(workflowId);
    return workflow
      ? {
          id: workflowId,
          nodeCount: workflow.nodes.size,
          edgeCount: workflow.edges.length,
          isActive: true,
        }
      : null;
  }

  // Clean up workflow
  unregisterWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      // Clean up node connections
      workflow.nodes.forEach((node, nodeId) => {
        this.nodeConnections.delete(nodeId);
        this.nodeTypes.delete(nodeId);
      });
      this.workflows.delete(workflowId);
      console.log(`Workflow ${workflowId} unregistered`);
    }
  }
}

// Global instance
export const workflowCoordinator = new WorkflowCoordinator();
