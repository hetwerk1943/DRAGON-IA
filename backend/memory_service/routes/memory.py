"""Memory CRUD routes."""

from fastapi import APIRouter
from pydantic import BaseModel

from ..short_term import ShortTermMemory
from ..long_term import LongTermMemory

router = APIRouter()

short_term = ShortTermMemory()
long_term = LongTermMemory()


class MemoryStore(BaseModel):
    session_id: str
    content: str
    metadata: dict | None = None


class MemoryQuery(BaseModel):
    session_id: str
    query: str
    top_k: int = 5


@router.post("/store")
async def store_memory(body: MemoryStore):
    await short_term.store(body.session_id, body.content)
    await long_term.store(body.session_id, body.content, body.metadata)
    return {"status": "stored"}


@router.post("/recall")
async def recall_memory(body: MemoryQuery):
    short = await short_term.recall(body.session_id)
    long = await long_term.search(body.query, body.top_k)
    return {"short_term": short, "long_term": long}


@router.delete("/{session_id}")
async def clear_memory(session_id: str):
    await short_term.clear(session_id)
    return {"status": "cleared"}
