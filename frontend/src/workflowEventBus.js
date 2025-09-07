// workflowEventBus.js - Simple event bus for workflow coordination
class WorkflowEventBus {
  constructor() {
    this.listeners = new Map();
  }

  // Subscribe to workflow events
  subscribe(nodeId, callback) {
    if (!this.listeners.has(nodeId)) {
      this.listeners.set(nodeId, []);
    }
    this.listeners.get(nodeId).push(callback);
  }

  // Unsubscribe from workflow events
  unsubscribe(nodeId, callback) {
    if (this.listeners.has(nodeId)) {
      const callbacks = this.listeners.get(nodeId);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event to specific node
  emit(nodeId, eventData) {
    if (this.listeners.has(nodeId)) {
      this.listeners.get(nodeId).forEach((callback) => {
        try {
          callback(eventData);
        } catch (error) {
          console.error(
            `Error executing workflow event for node ${nodeId}:`,
            error
          );
        }
      });
    }
  }

  // Emit event to all nodes
  broadcast(eventData) {
    this.listeners.forEach((callbacks, nodeId) => {
      callbacks.forEach((callback) => {
        try {
          callback(eventData);
        } catch (error) {
          console.error(
            `Error broadcasting workflow event to node ${nodeId}:`,
            error
          );
        }
      });
    });
  }
}

// Global instance
export const workflowEventBus = new WorkflowEventBus();
