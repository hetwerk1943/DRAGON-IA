"""OpenAI-compatible provider."""

import httpx
from .base import BaseProvider
from ..config import settings


class OpenAIProvider(BaseProvider):
    async def complete(self, request) -> str:
        if not settings.openai_api_key:
            raise RuntimeError("OpenAI API key not configured")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={
                    "model": request.model.removeprefix("openai/"),
                    "messages": request.messages,
                    "temperature": request.temperature,
                    "max_tokens": request.max_tokens,
                },
                timeout=120.0,
            )
            resp.raise_for_status()
            data = resp.json()
        return data["choices"][0]["message"]["content"]
