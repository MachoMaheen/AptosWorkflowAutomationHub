from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import asyncio
import logging
from datetime import datetime
import aiohttp
import hashlib
import time

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Aptos Workflow Automation Hub", version="1.0.0")

# Enhanced CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class Node(BaseModel):
    id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]

class NodeConnection(BaseModel):
    source_handle: str
    target_handle: str
    data_type: str  # "trigger", "data", "success", "error", "condition", "metadata"

class Edge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None
    connection_type: Optional[NodeConnection] = None

class PipelineData(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

class AptosEventFilter(BaseModel):
    event_type: str
    contract_address: str
    collection_name: Optional[str] = None
    polling_interval: int = 10
    event_filter: Dict[str, Any] = {}

class WorkflowExecution(BaseModel):
    id: str
    pipeline_id: str
    status: str  # "running", "completed", "failed", "paused"
    created_at: datetime
    last_updated: datetime
    events_processed: int = 0
    actions_executed: int = 0

# In-memory storage for demo (replace with Redis/Database in production)
active_workflows: Dict[str, Dict] = {}
event_listeners: Dict[str, asyncio.Task] = {}
websocket_connections: List[WebSocket] = []

# Aptos Testnet Configuration
APTOS_TESTNET_URL = "https://fullnode.testnet.aptoslabs.com/v1"
APTOS_INDEXER_URL = "https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql"

def validate_node_connections(nodes: List[Node], edges: List[Edge]) -> Dict[str, Any]:
    """Validate node connections based on handle types like VectorShift."""
    validation_result = {
        "valid": True,
        "errors": [],
        "warnings": []
    }
    
    # Define valid connection patterns based on handle types
    valid_connections = {
        # Trigger handles can connect to trigger inputs
        "trigger": ["trigger"],
        # Data handles can connect to data inputs and some special cases
        "data": ["data", "input", "prompt", "context", "system"],
        # Success/error handles can trigger other processes
        "success": ["trigger", "condition"],
        "error": ["trigger", "condition"], 
        # Response handles provide data output
        "response": ["data", "input", "prompt"],
        # Metadata handles provide auxiliary information
        "metadata": ["data", "context"],
        # System handles provide configuration
        "system": ["system"],
        # Context handles provide additional data
        "context": ["context"],
        # Condition handles provide boolean logic
        "condition": ["condition"],
        # Event data from triggers
        "event": ["data", "input", "prompt", "context"]
    }
    
    for edge in edges:
        source_handle = edge.sourceHandle
        target_handle = edge.targetHandle
        
        if source_handle and target_handle:
            # Extract handle types from handle IDs
            source_type = source_handle.split('-')[-1] if '-' in source_handle else source_handle
            target_type = target_handle.split('-')[-1] if '-' in target_handle else target_handle
            
            # Check if connection is valid
            if source_type in valid_connections:
                if target_type not in valid_connections[source_type]:
                    validation_result["valid"] = False
                    validation_result["errors"].append(
                        f"Invalid connection: {source_type} handle cannot connect to {target_type} handle"
                    )
            else:
                validation_result["warnings"].append(
                    f"Unknown source handle type: {source_type}"
                )
    
    return validation_result

def get_execution_order(nodes: List[Node], edges: List[Edge]) -> List[str]:
    """Get the execution order of nodes based on dependencies."""
    # Build dependency graph
    dependencies = {node.id: [] for node in nodes}
    for edge in edges:
        if edge.target in dependencies:
            dependencies[edge.target].append(edge.source)
    
    # Topological sort
    execution_order = []
    visited = set()
    temp_visited = set()
    
    def visit(node_id):
        if node_id in temp_visited:
            return False  # Cycle detected
        if node_id in visited:
            return True
        
        temp_visited.add(node_id)
        for dep in dependencies.get(node_id, []):
            if not visit(dep):
                return False
        temp_visited.remove(node_id)
        visited.add(node_id)
        execution_order.append(node_id)
        return True
    
    # Visit all nodes
    for node in nodes:
        if node.id not in visited:
            if not visit(node.id):
                return []  # Cycle detected
    
    return execution_order

def is_dag(nodes: List[Node], edges: List[Edge]) -> bool:
    """Check if the graph is a Directed Acyclic Graph (DAG)."""
    if not nodes or not edges:
        return True
    
    # Create adjacency list
    graph = {node.id: [] for node in nodes}
    for edge in edges:
        if edge.source in graph and edge.target in graph:
            graph[edge.source].append(edge.target)
    
    # Color coding for cycle detection
    colors = {node.id: 0 for node in nodes}  # 0=white, 1=gray, 2=black
    
    def dfs(node_id):
        if colors[node_id] == 1:  # Gray node means cycle
            return False
        if colors[node_id] == 2:  # Already processed
            return True
        
        colors[node_id] = 1  # Mark as gray
        
        for neighbor in graph[node_id]:
            if not dfs(neighbor):
                return False
        
        colors[node_id] = 2  # Mark as black
        return True
    
    # Check all nodes for cycles
    for node in nodes:
        if colors[node.id] == 0:
            if not dfs(node.id):
                return False
    
    return True

async def execute_node_based_on_type(node: Node, input_data: Dict = None) -> Dict:
    """Execute a node based on its type and input data."""
    try:
        node_type = node.type
        node_data = node.data
        
        if node_type == "aptosEventTrigger":
            # Event trigger nodes don't execute, they listen
            return {
                "status": "listening",
                "node_id": node.id,
                "event_type": node_data.get("eventType", "nft_mint"),
                "message": "Event trigger is active"
            }
            
        elif node_type == "aptosAction":
            # Execute Aptos action with input data
            merged_data = {**node_data}
            if input_data:
                merged_data.update(input_data)
            
            result = await execute_aptos_action(merged_data, input_data or {})
            return {
                "status": "executed",
                "node_id": node.id,
                "result": result
            }
            
        elif node_type == "conditional":
            # Execute conditional logic
            condition_type = node_data.get("condition", "greater_than")
            threshold = node_data.get("compareValue", "")
            input_value = input_data.get("value", "") if input_data else ""
            
            # Simple condition evaluation
            condition_met = False
            if condition_type == "greater_than":
                try:
                    condition_met = float(input_value) > float(threshold)
                except (ValueError, TypeError):
                    condition_met = False
            elif condition_type == "equals":
                condition_met = str(input_value) == str(threshold)
            elif condition_type == "contains":
                condition_met = str(threshold) in str(input_value)
            
            return {
                "status": "evaluated",
                "node_id": node.id,
                "condition_met": condition_met,
                "input_value": input_value,
                "threshold": threshold
            }
            
        elif node_type == "filter":
            # Execute filter logic
            filter_criteria = node_data.get("filterCriteria", {})
            if input_data:
                # Apply filter logic here
                filtered_data = input_data  # Simplified for demo
                return {
                    "status": "filtered",
                    "node_id": node.id,
                    "filtered_data": filtered_data
                }
            
        elif node_type == "customOutput":
            # Output node - log or store the data
            return {
                "status": "output",
                "node_id": node.id,
                "output_data": input_data or node_data,
                "message": "Data output successfully"
            }
            
        else:
            # Default handling for other node types
            return {
                "status": "executed",
                "node_id": node.id,
                "message": f"Node type {node_type} executed",
                "data": input_data or node_data
            }
            
    except Exception as e:
        logger.error(f"Error executing node {node.id}: {e}")
        return {
            "status": "error",
            "node_id": node.id,
            "error": str(e)
        }

async def execute_workflow_chain(nodes: List[Node], edges: List[Edge], trigger_node_id: str, trigger_data: Dict) -> List[Dict]:
    """Execute a chain of connected nodes starting from a trigger."""
    execution_results = []
    
    # Get execution order
    execution_order = get_execution_order(nodes, edges)
    
    # Create node lookup
    node_lookup = {node.id: node for node in nodes}
    
    # Track data flow between nodes
    node_outputs = {trigger_node_id: trigger_data}
    
    # Execute nodes in dependency order
    for node_id in execution_order:
        if node_id in node_lookup:
            node = node_lookup[node_id]
            
            # Collect input data from connected nodes
            input_data = {}
            connected_edges = [edge for edge in edges if edge.target == node_id]
            
            for edge in connected_edges:
                source_output = node_outputs.get(edge.source, {})
                if source_output:
                    # Merge data based on handle types
                    if edge.sourceHandle and "data" in edge.sourceHandle:
                        input_data.update(source_output)
                    elif edge.sourceHandle and "trigger" in edge.sourceHandle:
                        input_data["triggered_by"] = edge.source
                        input_data.update(source_output)
            
            # Execute the node
            result = await execute_node_based_on_type(node, input_data)
            execution_results.append(result)
            
            # Store output for downstream nodes
            node_outputs[node_id] = result
            
            # Broadcast execution status
            await broadcast_to_websockets({
                "type": "node_executed",
                "node_id": node_id,
                "result": result,
                "timestamp": datetime.now().isoformat()
            })
    
    return execution_results

async def fetch_aptos_events(event_filter: AptosEventFilter) -> List[Dict]:
    """Fetch events from Aptos blockchain."""
    try:
        async with aiohttp.ClientSession() as session:
            # Example: Fetch events by event handle
            if event_filter.event_type == "nft_mint":
                url = f"{APTOS_TESTNET_URL}/events/{event_filter.contract_address}"
                async with session.get(url) as response:
                    if response.status == 200:
                        events = await response.json()
                        return events
                    else:
                        logger.error(f"Failed to fetch events: {response.status}")
                        return []
            
            # For custom events, use indexer GraphQL
            if event_filter.event_type == "custom_event":
                graphql_query = {
                    "query": """
                    query GetEvents($contract_address: String!) {
                        events(
                            where: {account_address: {_eq: $contract_address}}
                            order_by: {sequence_number: desc}
                            limit: 10
                        ) {
                            sequence_number
                            creation_number
                            account_address
                            type
                            data
                            inserted_at
                        }
                    }
                    """,
                    "variables": {
                        "contract_address": event_filter.contract_address
                    }
                }
                
                async with session.post(
                    APTOS_INDEXER_URL,
                    json=graphql_query,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return result.get("data", {}).get("events", [])
                    else:
                        logger.error(f"GraphQL query failed: {response.status}")
                        return []
                        
    except Exception as e:
        logger.error(f"Error fetching Aptos events: {e}")
        return []
    
    return []

async def execute_aptos_action(action_data: Dict, event_data: Dict) -> Dict:
    """Execute an Aptos blockchain action."""
    try:
        action_type = action_data.get("actionType", "token_transfer")
        
        if action_type == "token_transfer":
            # Simulate APT transfer
            recipient = action_data.get("recipientAddress", "")
            amount = action_data.get("amount", 100000000)  # 1 APT in octas
            
            # In a real implementation, you would:
            # 1. Create and sign the transaction
            # 2. Submit to Aptos network
            # 3. Wait for confirmation
            
            # For demo, simulate transaction
            tx_hash = hashlib.sha256(f"{recipient}{amount}{time.time()}".encode()).hexdigest()
            
            return {
                "status": "success",
                "transaction_hash": f"0x{tx_hash}",
                "recipient": recipient,
                "amount": amount,
                "timestamp": datetime.now().isoformat()
            }
            
        elif action_type == "entry_function":
            function_name = action_data.get("functionName", "")
            function_args = action_data.get("functionArgs", "[]")
            
            # Simulate entry function call
            tx_hash = hashlib.sha256(f"{function_name}{function_args}{time.time()}".encode()).hexdigest()
            
            return {
                "status": "success", 
                "transaction_hash": f"0x{tx_hash}",
                "function": function_name,
                "arguments": function_args,
                "timestamp": datetime.now().isoformat()
            }
            
    except Exception as e:
        logger.error(f"Error executing Aptos action: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

async def monitor_events_for_workflow_enhanced(workflow_id: str, trigger_node: Node, nodes: List[Node], edges: List[Edge]):
    """Enhanced event monitoring for workflow execution."""
    try:
        event_filter = AptosEventFilter(
            event_type=trigger_node.data.get("eventType", "nft_mint"),
            creator_address=trigger_node.data.get("creatorAddress", ""),
            collection_name=trigger_node.data.get("collectionName", "")
        )
        
        logger.info(f"Starting enhanced event monitoring for workflow {workflow_id}, trigger {trigger_node.id}")
        
        while workflow_id in active_workflows:
            try:
                events = await fetch_aptos_events(event_filter)
                
                for event in events:
                    logger.info(f"Event detected for workflow {workflow_id}: {event}")
                    
                    # Update workflow stats
                    if workflow_id in active_workflows:
                        active_workflows[workflow_id]["events_processed"] += 1
                        active_workflows[workflow_id]["last_updated"] = datetime.now()
                    
                    # Execute the workflow chain
                    execution_results = await execute_workflow_chain(
                        nodes, edges, trigger_node.id, event
                    )
                    
                    # Update action count
                    if workflow_id in active_workflows:
                        active_workflows[workflow_id]["actions_executed"] += len(execution_results)
                    
                    # Broadcast workflow completion
                    await broadcast_to_websockets({
                        "type": "workflow_executed",
                        "workflow_id": workflow_id,
                        "trigger_node": trigger_node.id,
                        "event": event,
                        "results": execution_results,
                        "timestamp": datetime.now().isoformat()
                    })
                
                # Wait before checking again
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"Error in event monitoring loop for workflow {workflow_id}: {e}")
                await asyncio.sleep(10)  # Wait longer on error
                
    except Exception as e:
        logger.error(f"Error monitoring events for workflow {workflow_id}: {e}")
        # Mark workflow as failed
        if workflow_id in active_workflows:
            active_workflows[workflow_id]["status"] = "failed"
            active_workflows[workflow_id]["error"] = str(e)

async def workflow_event_listener(workflow_id: str, pipeline: PipelineData):
    """Background task to listen for events and execute workflow."""
    logger.info(f"Starting event listener for workflow {workflow_id}")
    
    # Find event trigger nodes
    trigger_nodes = [node for node in pipeline_data.nodes if node.type == "aptosEventTrigger"]
    action_nodes = [node for node in pipeline_data.nodes if node.type == "aptosAction"]
    
    if not trigger_nodes:
        logger.warning(f"No event trigger nodes found in workflow {workflow_id}")
        return
    
    last_processed_events = {}
    
    try:
        while workflow_id in active_workflows:
            for trigger_node in trigger_nodes:
                try:
                    # Create event filter from node data
                    event_filter = AptosEventFilter(
                        event_type=trigger_node.data.get("eventType", "nft_mint"),
                        contract_address=trigger_node.data.get("contractAddress", ""),
                        collection_name=trigger_node.data.get("collectionName", ""),
                        polling_interval=trigger_node.data.get("pollingInterval", 10),
                        event_filter=json.loads(trigger_node.data.get("eventFilter", "{}"))
                    )
                    
                    # Fetch events
                    events = await fetch_aptos_events(event_filter)
                    
                    # Process new events
                    for event in events:
                        event_id = event.get("sequence_number", f"{time.time()}")
                        
                        if event_id not in last_processed_events.get(trigger_node.id, set()):
                            logger.info(f"Processing new event {event_id} for workflow {workflow_id}")
                            
                            # Execute connected actions
                            for action_node in action_nodes:
                                # Check if action is connected to this trigger
                                connected_edges = [
                                    edge for edge in pipeline_data.edges 
                                    if edge.source == trigger_node.id and edge.target == action_node.id
                                ]
                                
                                if connected_edges:
                                    result = await execute_aptos_action(action_node.data, event)
                                    logger.info(f"Action result: {result}")
                                    
                                    # Broadcast to connected WebSocket clients
                                    await broadcast_to_websockets({
                                        "type": "action_executed",
                                        "workflow_id": workflow_id,
                                        "event": event,
                                        "result": result,
                                        "timestamp": datetime.now().isoformat()
                                    })
                            
                            # Mark event as processed
                            if trigger_node.id not in last_processed_events:
                                last_processed_events[trigger_node.id] = set()
                            last_processed_events[trigger_node.id].add(event_id)
                            
                            # Update workflow stats
                            if workflow_id in active_workflows:
                                active_workflows[workflow_id]["events_processed"] += 1
                                active_workflows[workflow_id]["last_updated"] = datetime.now()
                
                except Exception as e:
                    logger.error(f"Error in event processing for trigger {trigger_node.id}: {e}")
            
            # Wait before next polling cycle
            await asyncio.sleep(10)  # Poll every 10 seconds
            
    except asyncio.CancelledError:
        logger.info(f"Event listener for workflow {workflow_id} was cancelled")
    except Exception as e:
        logger.error(f"Error in workflow event listener {workflow_id}: {e}")
    finally:
        logger.info(f"Event listener for workflow {workflow_id} stopped")

async def broadcast_to_websockets(message: Dict):
    """Broadcast message to all connected WebSocket clients."""
    if websocket_connections:
        message_json = json.dumps(message)
        disconnected = []
        
        for websocket in websocket_connections:
            try:
                await websocket.send_text(message_json)
            except Exception:
                disconnected.append(websocket)
        
        # Remove disconnected clients
        for ws in disconnected:
            websocket_connections.remove(ws)

# API Routes
@app.get("/")
def read_root():
    return {
        "message": "Aptos Workflow Automation Hub Backend",
        "status": "running",
        "version": "1.0.0"
    }

@app.post("/pipelines/parse")
def parse_pipeline(pipeline: PipelineData):
    """Parse and validate pipeline structure."""
    try:
        num_nodes = len(pipeline.nodes)
        num_edges = len(pipeline.edges)
        dag_check = is_dag(pipeline.nodes, pipeline.edges)
        
        # Count Aptos-specific nodes
        aptos_trigger_nodes = len([n for n in pipeline.nodes if n.type == "aptosEventTrigger"])
        aptos_action_nodes = len([n for n in pipeline.nodes if n.type == "aptosAction"])
        wallet_nodes = len([n for n in pipeline.nodes if n.type == "walletConnection"])
        
        return {
            "num_nodes": num_nodes,
            "num_edges": num_edges,
            "is_dag": dag_check,
            "aptos_trigger_nodes": aptos_trigger_nodes,
            "aptos_action_nodes": aptos_action_nodes,
            "wallet_nodes": wallet_nodes,
            "status": "success",
            "message": "Pipeline parsed successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing pipeline: {str(e)}")

@app.post("/workflows/start")
async def start_workflow(pipeline: PipelineData, background_tasks: BackgroundTasks):
    """Start executing a workflow with full n8n-style capabilities."""
    try:
        workflow_id = hashlib.sha256(f"{time.time()}{json.dumps(pipeline.dict(), sort_keys=True)}".encode()).hexdigest()[:16]
        
        nodes = pipeline.nodes
        edges = pipeline.edges
        
        # Validate connections
        validation_errors = validate_node_connections(nodes, edges)
        if validation_errors:
            raise HTTPException(status_code=400, detail=f"Invalid connections: {validation_errors}")
        
        # Validate pipeline is a DAG
        if not is_dag(nodes, edges):
            raise HTTPException(status_code=400, detail="Pipeline contains cycles")
        
        # Create workflow record
        workflow = {
            "id": workflow_id,
            "pipeline": pipeline.dict(),
            "status": "running",
            "created_at": datetime.now(),
            "last_updated": datetime.now(),
            "events_processed": 0,
            "actions_executed": 0
        }
        
        active_workflows[workflow_id] = workflow
        
        # Find trigger nodes and set up execution
        trigger_nodes = [node for node in nodes if node.type in ["aptosEventTrigger", "input"]]
        
        if not trigger_nodes:
            raise HTTPException(status_code=400, detail="No trigger nodes found in workflow")
        
        workflow_results = []
        for trigger_node in trigger_nodes:
            if trigger_node.type == "aptosEventTrigger":
                # Start background event listener for this trigger
                task = asyncio.create_task(monitor_events_for_workflow_enhanced(
                    workflow_id, trigger_node, nodes, edges
                ))
                event_listeners[f"{workflow_id}_{trigger_node.id}"] = task
                
                workflow_results.append({
                    "trigger_node": trigger_node.id,
                    "status": "monitoring",
                    "message": "Event monitoring started"
                })
            
            elif trigger_node.type == "input":
                # Execute workflow immediately with input data
                trigger_data = trigger_node.data or {}
                execution_results = await execute_workflow_chain(
                    nodes, edges, trigger_node.id, trigger_data
                )
                
                workflow_results.append({
                    "trigger_node": trigger_node.id,
                    "status": "executed",
                    "results": execution_results
                })
        
        logger.info(f"Started enhanced workflow {workflow_id} with {len(trigger_nodes)} triggers")
        
        return {
            "workflow_id": workflow_id,
            "status": "started",
            "message": "Enhanced workflow started successfully",
            "trigger_count": len(trigger_nodes),
            "node_count": len(nodes),
            "edge_count": len(edges),
            "results": workflow_results
        }
        
    except Exception as e:
        logger.error(f"Error starting workflow: {e}")
        raise HTTPException(status_code=500, detail=f"Error starting workflow: {str(e)}")

@app.post("/workflows/{workflow_id}/stop")
async def stop_workflow(workflow_id: str):
    """Stop a running workflow."""
    try:
        if workflow_id not in active_workflows:
            raise HTTPException(status_code=404, detail="Workflow not found")
        
        # Cancel event listener task
        if workflow_id in event_listeners:
            event_listeners[workflow_id].cancel()
            del event_listeners[workflow_id]
        
        # Update workflow status
        active_workflows[workflow_id]["status"] = "stopped"
        active_workflows[workflow_id]["last_updated"] = datetime.now()
        
        logger.info(f"Stopped workflow {workflow_id}")
        
        return {
            "workflow_id": workflow_id,
            "status": "stopped",
            "message": "Workflow stopped successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error stopping workflow: {str(e)}")

@app.get("/workflows")
def get_workflows():
    """Get all workflows."""
    workflows = []
    for workflow_id, workflow in active_workflows.items():
        workflows.append({
            "id": workflow_id,
            "status": workflow["status"],
            "created_at": workflow["created_at"].isoformat(),
            "last_updated": workflow["last_updated"].isoformat(),
            "events_processed": workflow["events_processed"],
            "actions_executed": workflow["actions_executed"]
        })
    
    return {"workflows": workflows}

@app.get("/workflows/{workflow_id}")
def get_workflow(workflow_id: str):
    """Get specific workflow details."""
    if workflow_id not in active_workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow = active_workflows[workflow_id]
    return {
        "id": workflow_id,
        "status": workflow["status"],
        "created_at": workflow["created_at"].isoformat(),
        "last_updated": workflow["last_updated"].isoformat(),
        "events_processed": workflow["events_processed"],
        "actions_executed": workflow["actions_executed"],
        "pipeline": workflow["pipeline"]
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await websocket.accept()
    websocket_connections.append(websocket)
    
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_connections.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
