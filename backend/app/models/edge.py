from sqlalchemy import Column, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Edge(Base):
    __tablename__ = "edges"

    id = Column(String, primary_key=True, index=True)
    source = Column(String, ForeignKey("nodes.id"), nullable=False)
    target = Column(String, ForeignKey("nodes.id"), nullable=False)
    weight = Column(Float, default=1.0)
    label = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "source": self.source,
            "target": self.target,
            "weight": self.weight,
            "label": self.label,
        }

# Alias for backward compatibility
EdgeModel = Edge
