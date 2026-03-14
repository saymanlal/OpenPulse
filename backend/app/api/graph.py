from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.services.graph_service import GraphService
from app.models.schemas import (
    NodeCreate,
    NodeUpdate,
    NodeResponse,
    EdgeCreate,
    EdgeUpdate,
    EdgeResponse,
    GraphData,
    GraphDataCreate,
)

router = APIRouter(prefix="/api/graph", tags=["graph"])

# Graph Data Endpoints
@router.get("/data", response_model=GraphData)
async def get_graph_data(db: AsyncSession = Depends(get_db)):
    """Get all nodes and edges"""
    data = await GraphService.get_graph_data(db)
    return data

@router.post("/data", response_model=GraphData)
async def create_graph_data(
    graph_data: GraphDataCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create graph data (nodes and edges)"""
    data = await GraphService.bulk_create_graph_data(
        db, 
        graph_data.nodes, 
        graph_data.edges
    )
    return data

@router.delete("/data")
async def clear_graph_data(db: AsyncSession = Depends(get_db)):
    """Clear all nodes and edges"""
    success = await GraphService.clear_graph_data(db)
    return {"success": success, "message": "Graph data cleared"}

# Node Endpoints
@router.get("/nodes", response_model=List[NodeResponse])
async def list_nodes(
    skip: int = 0,
    limit: int = 1000,
    db: AsyncSession = Depends(get_db)
):
    """List all nodes"""
    nodes = await GraphService.list_nodes(db, skip, limit)
    return [node.to_dict() for node in nodes]

@router.post("/nodes", response_model=NodeResponse)
async def create_node(
    node: NodeCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new node"""
    db_node = await GraphService.create_node(db, node)
    return db_node.to_dict()

@router.get("/nodes/{node_id}", response_model=NodeResponse)
async def get_node(
    node_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific node"""
    node = await GraphService.get_node(db, node_id)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node.to_dict()

@router.put("/nodes/{node_id}", response_model=NodeResponse)
async def update_node(
    node_id: str,
    node_data: NodeUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a node"""
    node = await GraphService.update_node(db, node_id, node_data)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node.to_dict()

@router.delete("/nodes/{node_id}")
async def delete_node(
    node_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a node"""
    success = await GraphService.delete_node(db, node_id)
    if not success:
        raise HTTPException(status_code=404, detail="Node not found")
    return {"success": True, "message": "Node deleted"}

# Edge Endpoints
@router.get("/edges", response_model=List[EdgeResponse])
async def list_edges(
    skip: int = 0,
    limit: int = 2000,
    db: AsyncSession = Depends(get_db)
):
    """List all edges"""
    edges = await GraphService.list_edges(db, skip, limit)
    return [edge.to_dict() for edge in edges]

@router.post("/edges", response_model=EdgeResponse)
async def create_edge(
    edge: EdgeCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new edge"""
    db_edge = await GraphService.create_edge(db, edge)
    return db_edge.to_dict()

@router.get("/edges/{edge_id}", response_model=EdgeResponse)
async def get_edge(
    edge_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific edge"""
    edge = await GraphService.get_edge(db, edge_id)
    if not edge:
        raise HTTPException(status_code=404, detail="Edge not found")
    return edge.to_dict()

@router.delete("/edges/{edge_id}")
async def delete_edge(
    edge_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete an edge"""
    success = await GraphService.delete_edge(db, edge_id)
    if not success:
        raise HTTPException(status_code=404, detail="Edge not found")
    return {"success": True, "message": "Edge deleted"}