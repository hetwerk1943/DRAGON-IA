"""
DRAGON-IA Security & Audit Service
Provides monitoring, audit trail logging, and abuse detection.
"""

from fastapi import FastAPI

from .config import settings
from .routes import audit, monitoring

app = FastAPI(
    title="DRAGON-IA Security & Audit Service",
    version="0.1.0",
)

app.include_router(audit.router, prefix="/audit", tags=["audit"])
app.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "security-audit"}
