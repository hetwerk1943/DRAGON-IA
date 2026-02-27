"""Context builder – enriches messages with memory and metadata."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .config import Settings


class ContextBuilder:
    def __init__(self, settings: "Settings"):
        self._settings = settings

    async def build(self, messages: list) -> list[dict]:
        # TODO: fetch relevant memories from Memory Service
        return [{"role": m.role, "content": m.content} for m in messages]
