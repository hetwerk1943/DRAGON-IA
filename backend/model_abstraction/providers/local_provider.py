"""Local LLM provider (Ollama-compatible)."""

import httpx
from .base import BaseProvider
from ..config import settings


class LocalProvider(BaseProvider):
    async def complete(self, request) -> str:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.local_llm_url}/api/chat",
                json={
                    "model": request.model.removeprefix("local/"),
                    "messages": request.messages,
                    "stream": False,
                },
                timeout=300.0,
            )
            resp.raise_for_status()
            data = resp.json()
        return data["message"]["content"]
