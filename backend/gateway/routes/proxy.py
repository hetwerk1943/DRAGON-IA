"""Proxy routes – forwards validated requests to internal services."""

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
import httpx

from ..config import settings

router = APIRouter()


@router.post("/chat/completions")
async def chat_completions(request: Request):
    body = await request.json()
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{settings.orchestrator_url}/chat/completions",
            json=body,
            timeout=120.0,
        )
    return response.json()
