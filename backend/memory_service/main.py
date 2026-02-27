"""
DRAGON-IA Memory Service
Manages short-term (Redis) and long-term (Qdrant vector DB) memory with
context compression.
"""

from fastapi import FastAPI

from .config import settings
from .routes import memory

app = FastAPI(
    title="DRAGON-IA Memory Service",
    version="0.1.0",
)

app.include_router(memory.router, prefix="/memory", tags=["memory"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "memory-service"}
