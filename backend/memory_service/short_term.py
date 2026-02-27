"""Short-term memory backed by Redis."""

from __future__ import annotations

import json

from .config import settings


class ShortTermMemory:
    async def _get_client(self):
        import redis.asyncio as aioredis
        return aioredis.from_url(settings.redis_url)

    async def store(self, session_id: str, content: str) -> None:
        client = await self._get_client()
        key = f"memory:short:{session_id}"
        await client.rpush(key, content)
        await client.expire(key, settings.short_term_ttl)
        await client.aclose()

    async def recall(self, session_id: str) -> list[str]:
        client = await self._get_client()
        key = f"memory:short:{session_id}"
        items = await client.lrange(key, 0, -1)
        await client.aclose()
        return [item.decode() if isinstance(item, bytes) else item for item in items]

    async def clear(self, session_id: str) -> None:
        client = await self._get_client()
        await client.delete(f"memory:short:{session_id}")
        await client.aclose()
