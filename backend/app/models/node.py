from sqlalchemy import Column, String, Float, JSON, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class NodeType(str, enum.Enum):
    SERVICE = "service"
    LIBRARY = "library"
    REPOSITORY = "repository"
    DATABASE = "database"
    API = "api"
    SERVER = "server"
    IP = "ip"
    THREAT = "threat"
    VULNERABILITY = "vulnerability"

class NodeModel(Base):
    __tablename__ = "nodes"

    id = Column(String, primary_key=True, index=True)
    label = Column(String, nullable=False)
    type = Column(SQLEnum(NodeType), nullable=False)
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    position_z = Column(Float, default=0.0)
    risk_score = Column(Float, nullable=True)
    node_metadata = Column(JSON, default=dict)  # Changed from 'metadata'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "label": self.label,
            "type": self.type.value,
            "position": [self.position_x, self.position_y, self.position_z],
            "riskScore": self.risk_score,
            "metadata": self.node_metadata or {},  # Return as 'metadata' in API
        }