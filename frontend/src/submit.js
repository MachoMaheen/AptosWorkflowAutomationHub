// Enhanced submit.js with Aptos workflow execution

import React, { useState } from "react";
import { Rocket, Play, Square, RotateCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import "./submit.css";

export const SubmitButton = ({ nodes, edges }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentWorkflowId, setCurrentWorkflowId] = useState(null);

  const hasAptosNodes = () => {
    return nodes.some(
      (node) =>
        node.type === "aptosEventTrigger" ||
        node.type === "aptosAction" ||
        node.type === "walletConnection"
    );
  };

  const validateWorkflow = () => {
    if (nodes.length === 0) {
      toast.error("Please add some nodes to your workflow");
      return false;
    }

    if (edges.length === 0) {
      toast.error("Please connect your nodes with edges");
      return false;
    }

    // Check for Aptos event triggers
    const eventTriggers = nodes.filter(
      (node) => node.type === "aptosEventTrigger"
    );
    const aptosActions = nodes.filter((node) => node.type === "aptosAction");

    if (eventTriggers.length === 0) {
      toast.error("Add at least one Aptos Event Trigger node");
      return false;
    }

    if (aptosActions.length === 0) {
      toast.error("Add at least one Aptos Action node");
      return false;
    }

    // Check if triggers are connected to actions
    const connectedActions = aptosActions.filter((action) =>
      edges.some(
        (edge) =>
          edge.target === action.id &&
          eventTriggers.some((trigger) => trigger.id === edge.source)
      )
    );

    if (connectedActions.length === 0) {
      toast.error("Connect your Event Trigger to an Aptos Action");
      return false;
    }

    return true;
  };

  const submitPipeline = async () => {
    if (!validateWorkflow()) return;

    try {
      setIsRunning(true);

      // First, parse the pipeline
      const parseResponse = await fetch(
        "http://localhost:8000/pipelines/parse",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nodes, edges }),
        }
      );

      if (!parseResponse.ok) {
        throw new Error("Pipeline validation failed");
      }

      const parseResult = await parseResponse.json();
      console.log("Pipeline parsed:", parseResult);

      toast.success(
        `Pipeline validated: ${parseResult.num_nodes} nodes, ${parseResult.num_edges} edges`
      );

      // Start the workflow
      const workflowResponse = await fetch(
        "http://localhost:8000/workflows/start",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nodes, edges }),
        }
      );

      if (!workflowResponse.ok) {
        throw new Error("Failed to start workflow");
      }

      const workflowResult = await workflowResponse.json();
      console.log("Workflow started:", workflowResult);

      setCurrentWorkflowId(workflowResult.workflow_id);
      toast.success(`Workflow started! ID: ${workflowResult.workflow_id}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error(`Error: ${error.message}`);
      setIsRunning(false);
      setCurrentWorkflowId(null);
    }
  };

  const stopWorkflow = async () => {
    if (!currentWorkflowId) return;

    try {
      const response = await fetch(
        `http://localhost:8000/workflows/${currentWorkflowId}/stop`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to stop workflow");
      }

      const result = await response.json();
      console.log("Workflow stopped:", result);

      setIsRunning(false);
      setCurrentWorkflowId(null);
      toast.success("Workflow stopped successfully");
    } catch (error) {
      console.error("Error stopping workflow:", error);
      toast.error(`Error stopping workflow: ${error.message}`);
    }
  };

  const resetWorkflow = async () => {
    if (isRunning) {
      await stopWorkflow();
    }

    // Clear any local state if needed
    toast.success("Workflow reset");
  };

  const getButtonConfig = () => {
    if (isRunning) {
      return {
        icon: Square,
        text: "Stop Workflow",
        onClick: stopWorkflow,
        className: "submit-button running",
      };
    } else {
      return {
        icon: hasAptosNodes() ? Rocket : Play,
        text: hasAptosNodes() ? "Launch Aptos Workflow" : "Run Pipeline",
        onClick: submitPipeline,
        className: "submit-button",
      };
    }
  };

  const buttonConfig = getButtonConfig();
  const IconComponent = buttonConfig.icon;

  return (
    <div className="submit-container">
      <button
        className={buttonConfig.className}
        onClick={buttonConfig.onClick}
        disabled={nodes.length === 0}
      >
        <IconComponent className="submit-icon" />
        {buttonConfig.text}
      </button>

      {/* Additional controls when workflow is running */}
      {isRunning && (
        <button
          className="submit-button reset"
          onClick={resetWorkflow}
          style={{
            marginTop: "8px",
            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            fontSize: "12px",
            padding: "8px 16px",
          }}
        >
          <RotateCcw
            style={{ width: "14px", height: "14px", marginRight: "4px" }}
          />
          Reset
        </button>
      )}

      <div className="submit-hint">
        {isRunning ? (
          <>
            <span style={{ color: "#22c55e", fontWeight: "600" }}>
              ● Workflow Running
            </span>
            <br />
            {currentWorkflowId && (
              <span style={{ fontSize: "10px", fontFamily: "monospace" }}>
                ID: {currentWorkflowId}
              </span>
            )}
          </>
        ) : hasAptosNodes() ? (
          "Ready to launch your Aptos automation!"
        ) : (
          "Configure your workflow and click to run"
        )}
      </div>
    </div>
  );
};
