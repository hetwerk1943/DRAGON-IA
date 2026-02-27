"""
DRAGON-IA Tool Execution Service
Provides sandboxed code execution, web search, file processing,
and external API integrations.
"""

from fastapi import FastAPI

from .config import settings
from .routes import tools

app = FastAPI(
    title="DRAGON-IA Tool Execution Service",
    version="0.1.0",
)

app.include_router(tools.router, prefix="/tools", tags=["tools"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "tool-execution"}
