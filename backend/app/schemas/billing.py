"""Billing and usage schemas."""
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class UsageLogResponse(BaseModel):
    id: UUID
    model: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost: float
    created_at: datetime

    model_config = {"from_attributes": True}


class UsageSummary(BaseModel):
    total_tokens: int
    total_cost: float
    total_requests: int
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None


class SubscriptionResponse(BaseModel):
    id: UUID
    tier: str
    monthly_token_limit: float
    tokens_used: float
    current_period_start: datetime
    current_period_end: Optional[datetime]

    model_config = {"from_attributes": True}


class SubscriptionUpdate(BaseModel):
    tier: str
