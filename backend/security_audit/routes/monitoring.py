"""Monitoring and abuse detection routes."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthStatus(BaseModel):
    service: str
    status: str
    uptime_seconds: float = 0


@router.get("/status", response_model=list[HealthStatus])
async def get_system_status():
    # TODO: poll all services for health
    services = [
        "gateway",
        "ai-orchestrator",
        "model-abstraction",
        "memory-service",
        "tool-execution",
    ]
    return [HealthStatus(service=s, status="unknown") for s in services]


@router.get("/abuse/check/{user_id}")
async def check_abuse(user_id: str):
    # TODO: implement rate-based abuse detection
    return {"user_id": user_id, "flagged": False, "reason": None}
