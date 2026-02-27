"""Database abstraction for persistent storage."""

from __future__ import annotations

from typing import Any


class Database:
    """Simple in-memory database for development."""

    def __init__(self) -> None:
        self._store: dict[str, Any] = {}

    async def get(self, key: str) -> Any | None:
        return self._store.get(key)

    async def set(self, key: str, value: Any) -> None:
        self._store[key] = value

    async def delete(self, key: str) -> bool:
        return self._store.pop(key, None) is not None

    async def keys(self) -> list[str]:
        return list(self._store.keys())
