"""
DRAGON-IA Gateway Service
Handles authentication, rate limiting, API key management, and request routing.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routes import auth, api_keys, proxy

app = FastAPI(
    title="DRAGON-IA Gateway",
    version="0.1.0",
    description="Gateway service for the DRAGON-IA platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(api_keys.router, prefix="/api-keys", tags=["api-keys"])
app.include_router(proxy.router, prefix="/v1", tags=["proxy"])


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "gateway"}
