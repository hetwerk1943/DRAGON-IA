"""API Gateway – FastAPI router exposing the DRAGON-IA orchestrator."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from dragon_ia.orchestrator.core import Orchestrator, OrchestrationRequest

router = APIRouter(prefix="/api/v1", tags=["gateway"])

# The orchestrator instance is injected at application startup (see main.py).
_orchestrator: Orchestrator | None = None


def init_gateway(orchestrator: Orchestrator) -> None:
    """Bind the shared orchestrator instance to the gateway."""
    global _orchestrator  # noqa: PLW0603
    _orchestrator = orchestrator


# ── Request / Response schemas ──────────────────────────────────────────


class ChatRequest(BaseModel):
    """Payload sent by clients."""

    session_id: str = Field(..., min_length=1, description="Unique session identifier")
    prompt: str = Field(..., min_length=1, description="User prompt")
    capability: str = Field(default="chat", description="Requested model capability")


class ToolRequest(BaseModel):
    """Payload for tool invocations."""

    session_id: str = Field(..., min_length=1)
    tool_name: str = Field(..., min_length=1)
    tool_kwargs: dict = Field(default_factory=dict)


class GatewayResponse(BaseModel):
    """Unified response envelope."""

    success: bool
    data: dict = Field(default_factory=dict)
    error: str = ""


# ── Endpoints ───────────────────────────────────────────────────────────


@router.post("/chat", response_model=GatewayResponse)
async def chat(body: ChatRequest) -> GatewayResponse:
    """Send a prompt through the AI orchestrator."""
    if _orchestrator is None:
        raise HTTPException(status_code=503, detail="Orchestrator not initialised")
    request = OrchestrationRequest(
        session_id=body.session_id,
        prompt=body.prompt,
        capability=body.capability,
    )
    result = await _orchestrator.handle(request)
    return GatewayResponse(success=result.success, data=result.data, error=result.error)


@router.post("/tool", response_model=GatewayResponse)
async def invoke_tool(body: ToolRequest) -> GatewayResponse:
    """Invoke a registered tool."""
    if _orchestrator is None:
        raise HTTPException(status_code=503, detail="Orchestrator not initialised")
    request = OrchestrationRequest(
        session_id=body.session_id,
        prompt="",
        tool_name=body.tool_name,
        tool_kwargs=body.tool_kwargs,
    )
    result = await _orchestrator.handle(request)
    return GatewayResponse(success=result.success, data=result.data, error=result.error)


@router.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe."""
    return {"status": "ok"}
