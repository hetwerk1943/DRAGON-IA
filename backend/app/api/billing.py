"""Billing API routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.billing import UsageSummary, SubscriptionResponse, SubscriptionUpdate
from app.services.billing_service import BillingService

router = APIRouter()


@router.get("/usage", response_model=UsageSummary)
def get_usage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's usage summary."""
    summary = BillingService.get_usage_summary(db, current_user.id)
    return summary


@router.get("/subscription", response_model=SubscriptionResponse)
def get_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current user's subscription."""
    sub = BillingService.get_subscription(db, current_user.id)
    if not sub:
        return {"id": current_user.id, "tier": "FREE", "monthly_token_limit": 100000, "tokens_used": 0,
                "current_period_start": None, "current_period_end": None}
    return sub


@router.put("/subscription")
def update_subscription(
    data: SubscriptionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update subscription tier."""
    sub = BillingService.update_subscription(db, current_user.id, data.tier)
    return {"tier": sub.tier.value, "monthly_token_limit": sub.monthly_token_limit}


@router.get("/invoice")
def get_invoice(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get current billing invoice."""
    return BillingService.calculate_monthly_bill(db, current_user.id)
