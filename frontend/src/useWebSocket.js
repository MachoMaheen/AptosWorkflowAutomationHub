// WebSocket hook for real-time workflow updates

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";

export const useWebSocket = (url) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case "workflow_executed":
        toast.success(
          `🎯 Workflow executed! Processed ${data.results?.length || 0} nodes`,
          {
            duration: 4000,
            style: {
              background: "#10b981",
              color: "white",
            },
          }
        );
        break;

      case "node_executed":
        if (data.result?.status === "executed") {
          toast.success(`⚡ Node executed: ${data.node_id}`, {
            duration: 2000,
            style: {
              background: "#3b82f6",
              color: "white",
            },
          });
        } else if (data.result?.status === "error") {
          toast.error(
            `❌ Node failed: ${data.node_id} - ${data.result.error}`,
            {
              duration: 5000,
            }
          );
        }
        break;

      case "event_detected":
        toast.success(`📡 Event detected: ${data.event_type}`, {
          duration: 3000,
          style: {
            background: "#8b5cf6",
            color: "white",
          },
        });
        break;

      case "workflow_error":
        toast.error(`🚨 Workflow error: ${data.error}`, {
          duration: 6000,
        });
        break;

      default:
        console.log("Unhandled message type:", data.type);
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (ws.current) {
      ws.current.close();
    }
  }, []);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
          console.log("WebSocket connected");
          setIsConnected(true);
          reconnectAttempts.current = 0;
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("WebSocket message received:", data);
            setLastMessage(data);

            // Handle different message types
            handleMessage(data);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        ws.current.onclose = () => {
          console.log("WebSocket disconnected");
          setIsConnected(false);

          // Attempt to reconnect
          if (reconnectAttempts.current < 5) {
            reconnectAttempts.current += 1;
            const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff

            console.log(
              `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`
            );

            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, delay);
          }
        };

        ws.current.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
      } catch (error) {
        console.error("Error creating WebSocket connection:", error);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, handleMessage]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    disconnect,
  };
};
