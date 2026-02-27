"""Async message queue for task processing."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Message:
    """A message placed on the queue."""

    topic: str
    payload: Any
    metadata: dict[str, str] = field(default_factory=dict)


class MessageQueue:
    """In-memory async message queue."""

    def __init__(self) -> None:
        self._queue: asyncio.Queue[Message] = asyncio.Queue()

    async def publish(self, message: Message) -> None:
        await self._queue.put(message)

    async def consume(self) -> Message:
        return await self._queue.get()

    def pending(self) -> int:
        return self._queue.qsize()
