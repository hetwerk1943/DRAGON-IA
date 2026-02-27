"""Memory embedding model for vector storage metadata."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class MemoryEmbedding(Base):
    __tablename__ = "memory_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    embedding_id = Column(String(255), nullable=True)  # ID in vector DB
    relevance_score = Column(Float, nullable=True)
    source = Column(String(100), default="conversation")
    created_at = Column(DateTime, default=datetime.utcnow)
