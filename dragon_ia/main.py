"""DRAGON-IA application entry-point.

Wires together every architectural layer:

    Client Layer (Web / Mobile / API)
            ↓
    API Gateway  (FastAPI)
            ↓
    AI Orchestrator  (Core Brain)
            ↓
    ┌────────────┬────────┬───────┬───────┐
    │ ModelRouter │ Memory │ Tools │ Guard │
    └────────────┴────────┴───────┴───────┘
            ↓
    Infrastructure Layer
    (DB, Vector DB, Cache, Queue, Logs)
"""

from __future__ import annotations

from fastapi import FastAPI

from dragon_ia.core.guard import Guard
from dragon_ia.core.memory import Memory
from dragon_ia.core.model_router import ModelRouter, ModelSpec
from dragon_ia.core.tools import ToolRegistry
from dragon_ia.gateway.router import init_gateway, router as gateway_router
from dragon_ia.infrastructure.cache import Cache
from dragon_ia.infrastructure.database import Database
from dragon_ia.infrastructure.logger import get_logger
from dragon_ia.infrastructure.queue import MessageQueue
from dragon_ia.infrastructure.vector_db import VectorDB
from dragon_ia.orchestrator.core import Orchestrator

logger = get_logger(__name__)


def create_app() -> FastAPI:
    """Build and return the fully wired FastAPI application."""

    # ── Infrastructure Layer ────────────────────────────────────────────
    database = Database()
    vector_db = VectorDB()
    cache = Cache()
    queue = MessageQueue()

    # ── Core Modules ────────────────────────────────────────────────────
    model_router = ModelRouter()
    model_router.register(
        ModelSpec(name="default-chat", provider="openai", capabilities=["chat"]),
    )

    memory = Memory()
    tools = ToolRegistry()
    guard = Guard()

    # ── AI Orchestrator ─────────────────────────────────────────────────
    orchestrator = Orchestrator(
        model_router=model_router,
        memory=memory,
        tools=tools,
        guard=guard,
    )

    # ── API Gateway (FastAPI) ───────────────────────────────────────────
    app = FastAPI(title="DRAGON-IA", version="0.1.0")
    init_gateway(orchestrator)
    app.include_router(gateway_router)

    # Expose infrastructure on app state for extensibility
    app.state.database = database
    app.state.vector_db = vector_db
    app.state.cache = cache
    app.state.queue = queue

    logger.info("DRAGON-IA application initialised")
    return app


app = create_app()
