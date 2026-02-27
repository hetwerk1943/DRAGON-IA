"""Audit trail routes."""

from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# In-memory store (replace with PostgreSQL in production)
_audit_log: list[dict] = []


class AuditEntry(BaseModel):
    user_id: str
    action: str
    resource: str
    details: dict | None = None


class AuditRecord(BaseModel):
    id: int
    timestamp: str
    user_id: str
    action: str
    resource: str
    details: dict | None = None


@router.post("/log", response_model=AuditRecord)
async def log_event(entry: AuditEntry):
    record = {
        "id": len(_audit_log) + 1,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **entry.model_dump(),
    }
    _audit_log.append(record)
    return AuditRecord(**record)


@router.get("/logs", response_model=list[AuditRecord])
async def get_logs(user_id: str | None = None, limit: int = 50):
    logs = _audit_log
    if user_id:
        logs = [l for l in logs if l["user_id"] == user_id]
    return [AuditRecord(**l) for l in logs[-limit:]]
