"""Long-term memory backed by Qdrant vector database."""

from __future__ import annotations

from .config import settings


class LongTermMemory:
    async def store(self, session_id: str, content: str, metadata: dict | None = None) -> None:
        # TODO: generate embedding via Model Abstraction Layer, then upsert to Qdrant
        pass

    async def search(self, query: str, top_k: int = 5) -> list[dict]:
        # TODO: embed query, search Qdrant, return results
        return []
