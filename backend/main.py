from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import json

app = FastAPI()

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Node(BaseModel):
    id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]

class Edge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: str = None
    targetHandle: str = None

class PipelineData(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

def is_dag(nodes: List[Node], edges: List[Edge]) -> bool:
    """
    Check if the graph formed by nodes and edges is a Directed Acyclic Graph (DAG).
    Uses DFS-based cycle detection with color coding.
    """
    if not nodes or not edges:
        return True  # Empty graph or graph with no edges is a DAG
    
    # Create adjacency list
    graph = {node.id: [] for node in nodes}
    for edge in edges:
        if edge.source in graph and edge.target in graph:
            graph[edge.source].append(edge.target)
    
    # Color coding: 0 = white (unvisited), 1 = gray (visiting), 2 = black (visited)
    colors = {node.id: 0 for node in nodes}
    
    def dfs(node_id):
        if colors[node_id] == 1:  # Gray node means back edge (cycle)
            return False
        if colors[node_id] == 2:  # Black node already processed
            return True
        
        colors[node_id] = 1  # Mark as gray (visiting)
        
        # Visit all neighbors
        for neighbor in graph[node_id]:
            if not dfs(neighbor):
                return False
        
        colors[node_id] = 2  # Mark as black (visited)
        return True
    
    # Check all nodes (for disconnected components)
    for node in nodes:
        if colors[node.id] == 0:  # Unvisited node
            if not dfs(node.id):
                return False
    
    return True

@app.get('/')
def read_root():
    return {'message': 'VectorShift Pipeline Backend', 'status': 'running'}

@app.post('/pipelines/parse')
def parse_pipeline(pipeline: PipelineData):
    """
    Parse pipeline data and return analysis results.
    
    Returns:
        dict: Contains num_nodes, num_edges, and is_dag
    """
    try:
        num_nodes = len(pipeline.nodes)
        num_edges = len(pipeline.edges)
        dag_check = is_dag(pipeline.nodes, pipeline.edges)
        
        return {
            'num_nodes': num_nodes,
            'num_edges': num_edges,
            'is_dag': dag_check,
            'status': 'success'
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing pipeline: {str(e)}")

@app.get('/pipelines/parse')
def get_parse_info():
    """
    Get information about the parse endpoint.
    """
    return {
        'message': 'POST to this endpoint with pipeline data',
        'expected_format': {
            'nodes': [{'id': 'string', 'type': 'string', 'position': {'x': 0, 'y': 0}, 'data': {}}],
            'edges': [{'id': 'string', 'source': 'string', 'target': 'string'}]
        }
    }
