"""Billing service for usage tracking and subscription management."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.usage_log import UsageLog
from app.models.subscription import Subscription, SubscriptionTier
from app.services.ai_orchestrator import AIOrchestrator


# Tier limits (tokens per month)
TIER_LIMITS = {
    SubscriptionTier.FREE: 100_000,
    SubscriptionTier.PRO: 1_000_000,
    SubscriptionTier.ENTERPRISE: 10_000_000,
}

# Tier pricing (monthly USD)
TIER_PRICING = {
    SubscriptionTier.FREE: 0.0,
    SubscriptionTier.PRO: 29.99,
    SubscriptionTier.ENTERPRISE: 299.99,
}


class BillingService:
    """Manages usage tracking and subscription billing."""

    @staticmethod
    def log_usage(
        db: Session,
        user_id: UUID,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
    ) -> UsageLog:
        """Log token usage for a user."""
        cost = AIOrchestrator.calculate_cost(model, prompt_tokens, completion_tokens)
        total_tokens = prompt_tokens + completion_tokens

        usage = UsageLog(
            user_id=user_id,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cost=cost,
        )
        db.add(usage)

        # Update subscription token count
        subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if subscription:
            subscription.tokens_used += total_tokens

        db.commit()
        db.refresh(usage)
        return usage

    @staticmethod
    def check_quota(db: Session, user_id: UUID) -> bool:
        """Check if user has remaining token quota."""
        subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if not subscription:
            return False
        return subscription.tokens_used < subscription.monthly_token_limit

    @staticmethod
    def get_usage_summary(
        db: Session,
        user_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> dict:
        """Get usage summary for a user."""
        query = db.query(
            func.count(UsageLog.id).label("total_requests"),
            func.coalesce(func.sum(UsageLog.total_tokens), 0).label("total_tokens"),
            func.coalesce(func.sum(UsageLog.cost), 0).label("total_cost"),
        ).filter(UsageLog.user_id == user_id)

        if start_date:
            query = query.filter(UsageLog.created_at >= start_date)
        if end_date:
            query = query.filter(UsageLog.created_at <= end_date)

        result = query.first()
        return {
            "total_requests": result.total_requests or 0,
            "total_tokens": int(result.total_tokens or 0),
            "total_cost": float(result.total_cost or 0),
            "period_start": start_date,
            "period_end": end_date,
        }

    @staticmethod
    def get_subscription(db: Session, user_id: UUID) -> Optional[Subscription]:
        """Get user's subscription."""
        return db.query(Subscription).filter(Subscription.user_id == user_id).first()

    @staticmethod
    def update_subscription(db: Session, user_id: UUID, tier: str) -> Subscription:
        """Update user's subscription tier."""
        subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if not subscription:
            subscription = Subscription(user_id=user_id)
            db.add(subscription)

        tier_enum = SubscriptionTier(tier)
        subscription.tier = tier_enum
        subscription.monthly_token_limit = TIER_LIMITS.get(tier_enum, 100_000)
        db.commit()
        db.refresh(subscription)
        return subscription

    @staticmethod
    def calculate_monthly_bill(db: Session, user_id: UUID) -> dict:
        """Calculate the monthly bill for a user."""
        subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
        if not subscription:
            return {"tier": "FREE", "base_cost": 0, "overage_cost": 0, "total": 0}

        base_cost = TIER_PRICING.get(subscription.tier, 0)
        overage_tokens = max(0, subscription.tokens_used - subscription.monthly_token_limit)
        overage_cost = (overage_tokens / 1000) * 0.002  # $0.002 per 1K overage tokens

        return {
            "tier": subscription.tier.value,
            "base_cost": base_cost,
            "overage_cost": round(overage_cost, 4),
            "total": round(base_cost + overage_cost, 4),
            "tokens_used": subscription.tokens_used,
            "token_limit": subscription.monthly_token_limit,
        }
