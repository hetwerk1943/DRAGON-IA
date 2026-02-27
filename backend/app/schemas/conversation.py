"""Conversation and message schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class MessageCreate(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1, max_length=100000)


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    token_count: int
    model: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"
    model: Optional[str] = "gpt-3.5-turbo"


class ConversationResponse(BaseModel):
    id: UUID
    title: str
    model: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    model_config = {"from_attributes": True}


class ConversationListItem(BaseModel):
    id: UUID
    title: str
    model: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
