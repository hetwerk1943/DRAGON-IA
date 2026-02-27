"""
DRAGON-IA AI Orchestrator
Routes requests to the correct model, builds context, executes tools,
and parses structured output.
"""

from fastapi import FastAPI

from .config import settings
from .routes import chat
from .context import ContextBuilder
from .tool_loop import ToolExecutionLoop
from .output_parser import StructuredOutputParser

app = FastAPI(
    title="DRAGON-IA AI Orchestrator",
    version="0.1.0",
)

app.include_router(chat.router, tags=["chat"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-orchestrator"}
