"""Anthropic-compatible provider."""

import httpx
from .base import BaseProvider
from ..config import settings


class AnthropicProvider(BaseProvider):
    async def complete(self, request) -> str:
        if not settings.anthropic_api_key:
            raise RuntimeError("Anthropic API key not configured")
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": settings.anthropic_api_key,
                    "anthropic-version": "2023-06-01",
                },
                json={
                    "model": request.model.removeprefix("anthropic/"),
                    "messages": request.messages,
                    "max_tokens": request.max_tokens,
                },
                timeout=120.0,
            )
            resp.raise_for_status()
            data = resp.json()
        return data["content"][0]["text"]
