"""Graph service for database operations."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional
from app.models.node import Node
from app.models.edge import Edge
from app.models.schemas import NodeCreate, NodeUpdate, EdgeCreate, EdgeUpdate


class GraphService:
    """Service for graph data operations."""

    @staticmethod
    async def get_graph_data(db: AsyncSession):
        """Get all nodes and edges."""
        nodes_result = await db.execute(select(Node))
        edges_result = await db.execute(select(Edge))
        
        nodes = nodes_result.scalars().all()
        edges = edges_result.scalars().all()
        
        return {
            "nodes": [node.to_dict() for node in nodes],
            "edges": [edge.to_dict() for edge in edges]
        }

    @staticmethod
    async def bulk_create_graph_data(
        db: AsyncSession,
        nodes: List[NodeCreate],
        edges: List[EdgeCreate]
    ):
        """Create multiple nodes and edges."""
        # Clear existing data
        await db.execute(delete(Edge))
        await db.execute(delete(Node))
        
        # Create new nodes
        db_nodes = []
        for node_data in nodes:
            db_node = Node(**node_data.model_dump())
            db.add(db_node)
            db_nodes.append(db_node)
        
        # Create new edges
        db_edges = []
        for edge_data in edges:
            db_edge = Edge(**edge_data.model_dump())
            db.add(db_edge)
            db_edges.append(db_edge)
        
        await db.commit()
        
        return {
            "nodes": [node.to_dict() for node in db_nodes],
            "edges": [edge.to_dict() for edge in db_edges]
        }

    @staticmethod
    async def clear_graph_data(db: AsyncSession) -> bool:
        """Clear all nodes and edges."""
        await db.execute(delete(Edge))
        await db.execute(delete(Node))
        await db.commit()
        return True

    @staticmethod
    async def list_nodes(db: AsyncSession, skip: int = 0, limit: int = 1000) -> List[Node]:
        """List all nodes."""
        result = await db.execute(select(Node).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def create_node(db: AsyncSession, node_data: NodeCreate) -> Node:
        """Create a new node."""
        db_node = Node(**node_data.model_dump())
        db.add(db_node)
        await db.commit()
        await db.refresh(db_node)
        return db_node

    @staticmethod
    async def get_node(db: AsyncSession, node_id: str) -> Optional[Node]:
        """Get a specific node."""
        result = await db.execute(select(Node).filter(Node.id == node_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def update_node(db: AsyncSession, node_id: str, node_data: NodeUpdate) -> Optional[Node]:
        """Update a node."""
        result = await db.execute(select(Node).filter(Node.id == node_id))
        db_node = result.scalar_one_or_none()
        
        if not db_node:
            return None
        
        update_data = node_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_node, field, value)
        
        await db.commit()
        await db.refresh(db_node)
        return db_node

    @staticmethod
    async def delete_node(db: AsyncSession, node_id: str) -> bool:
        """Delete a node."""
        result = await db.execute(select(Node).filter(Node.id == node_id))
        db_node = result.scalar_one_or_none()
        
        if not db_node:
            return False
        
        await db.delete(db_node)
        await db.commit()
        return True

    @staticmethod
    async def list_edges(db: AsyncSession, skip: int = 0, limit: int = 2000) -> List[Edge]:
        """List all edges."""
        result = await db.execute(select(Edge).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def create_edge(db: AsyncSession, edge_data: EdgeCreate) -> Edge:
        """Create a new edge."""
        db_edge = Edge(**edge_data.model_dump())
        db.add(db_edge)
        await db.commit()
        await db.refresh(db_edge)
        return db_edge

    @staticmethod
    async def get_edge(db: AsyncSession, edge_id: str) -> Optional[Edge]:
        """Get a specific edge."""
        result = await db.execute(select(Edge).filter(Edge.id == edge_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def delete_edge(db: AsyncSession, edge_id: str) -> bool:
        """Delete an edge."""
        result = await db.execute(select(Edge).filter(Edge.id == edge_id))
        db_edge = result.scalar_one_or_none()
        
        if not db_edge:
            return False
        
        await db.delete(db_edge)
        await db.commit()
        return True
