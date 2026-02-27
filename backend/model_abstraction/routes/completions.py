"""Unified completion endpoint."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..providers import get_provider
from ..config import settings

router = APIRouter()


class CompletionRequest(BaseModel):
    model: str
    messages: list[dict]
    temperature: float = 0.7
    max_tokens: int = 2048


class CompletionResponse(BaseModel):
    content: str
    model: str
    provider: str


@router.post("/completions", response_model=CompletionResponse)
async def create_completion(body: CompletionRequest):
    last_error: Exception | None = None
    for provider_name in settings.fallback_order:
        try:
            provider = get_provider(provider_name)
            result = await provider.complete(body)
            return CompletionResponse(content=result, model=body.model, provider=provider_name)
        except Exception as exc:
            last_error = exc
            continue
    raise HTTPException(status_code=502, detail=f"All providers failed: {last_error}")
