"""Memory service for short-term and long-term memory management."""
import json
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.memory_embedding import MemoryEmbedding


class MemoryService:
    """Manages short-term (Redis) and long-term (Vector DB) memory."""

    def __init__(self, redis_client=None, vector_client=None):
        self.redis = redis_client
        self.vector = vector_client

    def store_short_term(self, user_id: str, key: str, value: str, ttl: int = 3600) -> bool:
        """Store data in short-term memory (Redis)."""
        if self.redis:
            full_key = f"memory:{user_id}:{key}"
            self.redis.setex(full_key, ttl, value)
            return True
        return False

    def get_short_term(self, user_id: str, key: str) -> Optional[str]:
        """Retrieve data from short-term memory."""
        if self.redis:
            full_key = f"memory:{user_id}:{key}"
            value = self.redis.get(full_key)
            return value.decode() if value else None
        return None

    def store_conversation_context(self, user_id: str, conversation_id: str, messages: list) -> bool:
        """Cache recent conversation context in Redis."""
        if self.redis:
            key = f"context:{user_id}:{conversation_id}"
            self.redis.setex(key, 7200, json.dumps(messages))
            return True
        return False

    def get_conversation_context(self, user_id: str, conversation_id: str) -> Optional[list]:
        """Get cached conversation context."""
        if self.redis:
            key = f"context:{user_id}:{conversation_id}"
            data = self.redis.get(key)
            if data:
                return json.loads(data.decode())
        return None

    @staticmethod
    def store_long_term(db: Session, user_id: UUID, content: str, source: str = "conversation") -> MemoryEmbedding:
        """Store content in long-term memory (PostgreSQL + Vector DB metadata)."""
        embedding = MemoryEmbedding(
            user_id=user_id,
            content=content,
            source=source,
        )
        db.add(embedding)
        db.commit()
        db.refresh(embedding)
        return embedding

    @staticmethod
    def search_long_term(db: Session, user_id: UUID, query: str, limit: int = 5) -> list[MemoryEmbedding]:
        """Search long-term memory by content similarity (basic text search)."""
        results = (
            db.query(MemoryEmbedding)
            .filter(
                MemoryEmbedding.user_id == user_id,
                MemoryEmbedding.content.ilike(f"%{query}%"),
            )
            .order_by(MemoryEmbedding.created_at.desc())
            .limit(limit)
            .all()
        )
        return results

    @staticmethod
    def get_user_memories(db: Session, user_id: UUID, limit: int = 20) -> list[MemoryEmbedding]:
        """Get recent memories for a user."""
        return (
            db.query(MemoryEmbedding)
            .filter(MemoryEmbedding.user_id == user_id)
            .order_by(MemoryEmbedding.created_at.desc())
            .limit(limit)
            .all()
        )

    def inject_memory_context(self, db: Session, user_id: UUID, query: str) -> str:
        """Build memory context string for injection into AI prompts."""
        memories = self.search_long_term(db, user_id, query, limit=3)
        if not memories:
            return ""
        context_parts = [f"- {m.content}" for m in memories]
        return "Relevant context from memory:\n" + "\n".join(context_parts)
