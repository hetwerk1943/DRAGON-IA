"""DRAGON AI - Main application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api import auth, conversations, ai, memory, tools, billing, admin
from app.core.middleware import RateLimitMiddleware, AuditLogMiddleware

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Orchestration Platform with multi-model support, memory, and tool execution",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware
app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuditLogMiddleware)

# Routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(conversations.router, prefix="/api/v1/conversations", tags=["Conversations"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI Orchestrator"])
app.include_router(memory.router, prefix="/api/v1/memory", tags=["Memory"])
app.include_router(tools.router, prefix="/api/v1/tools", tags=["Tools"])
app.include_router(billing.router, prefix="/api/v1/billing", tags=["Billing"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": settings.APP_NAME, "version": settings.APP_VERSION}
