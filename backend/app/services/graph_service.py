from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional
import uuid

from app.models.node import NodeModel, NodeType
from app.models.edge import EdgeModel
from app.models.graph import GraphModel
from app.models.schemas import NodeCreate, EdgeCreate, GraphCreate, NodeUpdate, EdgeUpdate

class GraphService:
    
    @staticmethod
    async def create_graph(db: AsyncSession, graph_data: GraphCreate) -> GraphModel:
        graph = GraphModel(
            id=str(uuid.uuid4()),
            name=graph_data.name,
            description=graph_data.description,
        )
        db.add(graph)
        await db.commit()
        await db.refresh(graph)
        return graph

    @staticmethod
    async def get_graph(db: AsyncSession, graph_id: str) -> Optional[GraphModel]:
        result = await db.execute(select(GraphModel).where(GraphModel.id == graph_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_graphs(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[GraphModel]:
        result = await db.execute(select(GraphModel).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def delete_graph(db: AsyncSession, graph_id: str) -> bool:
        result = await db.execute(delete(GraphModel).where(GraphModel.id == graph_id))
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def create_node(db: AsyncSession, node_data: NodeCreate) -> NodeModel:
        node = NodeModel(
            id=node_data.id,
            label=node_data.label,
            type=NodeType(node_data.type),
            position_x=node_data.position[0],
            position_y=node_data.position[1],
            position_z=node_data.position[2],
            risk_score=node_data.riskScore,
            metadata=node_data.metadata,
        )
        db.add(node)
        await db.commit()
        await db.refresh(node)
        return node

    @staticmethod
    async def get_node(db: AsyncSession, node_id: str) -> Optional[NodeModel]:
        result = await db.execute(select(NodeModel).where(NodeModel.id == node_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_nodes(db: AsyncSession, skip: int = 0, limit: int = 1000) -> List[NodeModel]:
        result = await db.execute(select(NodeModel).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def update_node(db: AsyncSession, node_id: str, node_data: NodeUpdate) -> Optional[NodeModel]:
        node = await GraphService.get_node(db, node_id)
        if not node:
            return None

        if node_data.label is not None:
            node.label = node_data.label
        if node_data.type is not None:
            node.type = NodeType(node_data.type)
        if node_data.position is not None:
            node.position_x = node_data.position[0]
            node.position_y = node_data.position[1]
            node.position_z = node_data.position[2]
        if node_data.riskScore is not None:
            node.risk_score = node_data.riskScore
        if node_data.metadata is not None:
            node.metadata = node_data.metadata

        await db.commit()
        await db.refresh(node)
        return node

    @staticmethod
    async def delete_node(db: AsyncSession, node_id: str) -> bool:
        result = await db.execute(delete(NodeModel).where(NodeModel.id == node_id))
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def create_edge(db: AsyncSession, edge_data: EdgeCreate) -> EdgeModel:
        edge = EdgeModel(
            id=edge_data.id,
            source=edge_data.source,
            target=edge_data.target,
            weight=edge_data.weight,
            label=edge_data.label,
        )
        db.add(edge)
        await db.commit()
        await db.refresh(edge)
        return edge

    @staticmethod
    async def get_edge(db: AsyncSession, edge_id: str) -> Optional[EdgeModel]:
        result = await db.execute(select(EdgeModel).where(EdgeModel.id == edge_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def list_edges(db: AsyncSession, skip: int = 0, limit: int = 2000) -> List[EdgeModel]:
        result = await db.execute(select(EdgeModel).offset(skip).limit(limit))
        return result.scalars().all()

    @staticmethod
    async def delete_edge(db: AsyncSession, edge_id: str) -> bool:
        result = await db.execute(delete(EdgeModel).where(EdgeModel.id == edge_id))
        await db.commit()
        return result.rowcount > 0

    @staticmethod
    async def get_graph_data(db: AsyncSession) -> dict:
        nodes = await GraphService.list_nodes(db)
        edges = await GraphService.list_edges(db)
        
        return {
            "nodes": [node.to_dict() for node in nodes],
            "edges": [edge.to_dict() for edge in edges],
        }

    @staticmethod
    async def clear_graph_data(db: AsyncSession) -> bool:
        await db.execute(delete(EdgeModel))
        await db.execute(delete(NodeModel))
        await db.commit()
        return True

    @staticmethod
    async def bulk_create_graph_data(
        db: AsyncSession, 
        nodes: List[NodeCreate], 
        edges: List[EdgeCreate]
    ) -> dict:
        # Clear existing data
        await GraphService.clear_graph_data(db)
        
        # Create nodes
        for node_data in nodes:
            await GraphService.create_node(db, node_data)
        
        # Create edges
        for edge_data in edges:
            await GraphService.create_edge(db, edge_data)
        
        return await GraphService.get_graph_data(db)