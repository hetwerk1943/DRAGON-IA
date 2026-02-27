"""API key management routes."""

import secrets

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

# In-memory store (replace with DB in production)
_api_keys: dict[str, dict] = {}


class APIKeyCreate(BaseModel):
    name: str
    workspace_id: str


class APIKeyResponse(BaseModel):
    key: str
    name: str
    workspace_id: str


@router.post("/", response_model=APIKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(body: APIKeyCreate):
    key = f"dragon_{secrets.token_urlsafe(32)}"
    record = {"key": key, "name": body.name, "workspace_id": body.workspace_id}
    _api_keys[key] = record
    return APIKeyResponse(**record)


@router.delete("/{key}")
async def revoke_api_key(key: str):
    if key not in _api_keys:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Key not found")
    del _api_keys[key]
    return {"status": "revoked"}
