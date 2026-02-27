"""Memory – conversation and context management."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from dragon_ia.infrastructure.logger import get_logger

logger = get_logger(__name__)


@dataclass
class MemoryEntry:
    """A single memory entry in a conversation."""

    role: str
    content: str
    metadata: dict[str, Any] = field(default_factory=dict)


class Memory:
    """Per-session conversation memory with configurable window size."""

    def __init__(self, max_entries: int = 100) -> None:
        self._sessions: dict[str, list[MemoryEntry]] = {}
        self._max_entries = max_entries

    def store(self, session_id: str, entry: MemoryEntry) -> None:
        entries = self._sessions.setdefault(session_id, [])
        entries.append(entry)
        if len(entries) > self._max_entries:
            self._sessions[session_id] = entries[-self._max_entries :]
        logger.info("Stored memory for session %s (total: %d)", session_id, len(self._sessions[session_id]))

    def recall(self, session_id: str, last_n: int | None = None) -> list[MemoryEntry]:
        entries = self._sessions.get(session_id, [])
        if last_n is not None:
            return entries[-last_n:]
        return list(entries)

    def clear(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)
