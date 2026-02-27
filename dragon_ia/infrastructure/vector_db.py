"""Vector database abstraction for semantic search."""

from __future__ import annotations

import math
from dataclasses import dataclass, field


@dataclass
class VectorRecord:
    """A stored vector with its identifier and metadata."""

    id: str
    vector: list[float]
    metadata: dict[str, str] = field(default_factory=dict)


class VectorDB:
    """In-memory vector store using cosine similarity."""

    def __init__(self) -> None:
        self._records: list[VectorRecord] = []

    async def insert(self, record: VectorRecord) -> None:
        self._records.append(record)

    async def search(self, query_vector: list[float], top_k: int = 5) -> list[VectorRecord]:
        scored = [
            (r, self._cosine_similarity(query_vector, r.vector))
            for r in self._records
        ]
        scored.sort(key=lambda pair: pair[1], reverse=True)
        return [r for r, _ in scored[:top_k]]

    @staticmethod
    def _cosine_similarity(a: list[float], b: list[float]) -> float:
        if len(a) != len(b):
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(x * x for x in b))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return dot / (norm_a * norm_b)
