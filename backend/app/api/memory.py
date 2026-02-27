"""Memory API routes."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.memory_service import MemoryService

router = APIRouter()
memory_service = MemoryService()


class MemoryStore(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    source: str = "manual"


class MemorySearch(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    limit: int = Field(default=5, ge=1, le=50)


@router.post("/store", status_code=201)
def store_memory(
    data: MemoryStore,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Store a memory entry."""
    embedding = memory_service.store_long_term(db, current_user.id, data.content, data.source)
    return {"id": str(embedding.id), "status": "stored"}


@router.post("/search")
def search_memory(
    data: MemorySearch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search memories."""
    results = memory_service.search_long_term(db, current_user.id, data.query, data.limit)
    return {
        "results": [
            {"id": str(r.id), "content": r.content, "source": r.source, "created_at": str(r.created_at)}
            for r in results
        ]
    }


@router.get("/")
def list_memories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List recent memories."""
    memories = memory_service.get_user_memories(db, current_user.id)
    return {
        "memories": [
            {"id": str(m.id), "content": m.content, "source": m.source, "created_at": str(m.created_at)}
            for m in memories
        ]
    }
