from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Node Schemas
class NodeBase(BaseModel):
    label: str
    type: str
    position: List[float] = Field(default_factory=lambda: [0.0, 0.0, 0.0])
    riskScore: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class NodeCreate(NodeBase):
    id: str

class NodeUpdate(BaseModel):
    label: Optional[str] = None
    type: Optional[str] = None
    position: Optional[List[float]] = None
    riskScore: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

class NodeResponse(NodeBase):
    id: str

    class Config:
        from_attributes = True

# Edge Schemas
class EdgeBase(BaseModel):
    source: str
    target: str
    weight: Optional[float] = 1.0
    label: Optional[str] = None

class EdgeCreate(EdgeBase):
    id: str

class EdgeUpdate(BaseModel):
    weight: Optional[float] = None
    label: Optional[str] = None

class EdgeResponse(EdgeBase):
    id: str

    class Config:
        from_attributes = True

# Graph Schemas
class GraphBase(BaseModel):
    name: str
    description: Optional[str] = None

class GraphCreate(GraphBase):
    pass

class GraphUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class GraphResponse(GraphBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class GraphData(BaseModel):
    nodes: List[NodeResponse]
    edges: List[EdgeResponse]

class GraphDataCreate(BaseModel):
    nodes: List[NodeCreate]
    edges: List[EdgeCreate]