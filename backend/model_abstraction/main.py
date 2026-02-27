"""
DRAGON-IA Model Abstraction Layer
Unified interface for OpenAI, Anthropic, and local LLM backends with
automatic fallback.
"""

from fastapi import FastAPI

from .config import settings
from .routes import completions

app = FastAPI(
    title="DRAGON-IA Model Abstraction Layer",
    version="0.1.0",
)

app.include_router(completions.router, tags=["completions"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "model-abstraction"}
