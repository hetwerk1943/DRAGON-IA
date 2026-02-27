"""Tests for billing service."""
from unittest.mock import MagicMock
from uuid import uuid4

from app.services.billing_service import BillingService, TIER_LIMITS, TIER_PRICING
from app.models.subscription import SubscriptionTier


class TestUsageLogging:
    """Test usage logging."""

    def test_log_usage(self, mock_db, mock_subscription):
        mock_db.query.return_value.filter.return_value.first.return_value = mock_subscription
        user_id = uuid4()
        BillingService.log_usage(mock_db, user_id, "gpt-3.5-turbo", 100, 50)
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()


class TestQuotaCheck:
    """Test quota checking."""

    def test_check_quota_under_limit(self, mock_db, mock_subscription):
        mock_subscription.tokens_used = 50000
        mock_subscription.monthly_token_limit = 100000
        mock_db.query.return_value.filter.return_value.first.return_value = mock_subscription
        assert BillingService.check_quota(mock_db, uuid4()) is True

    def test_check_quota_over_limit(self, mock_db, mock_subscription):
        mock_subscription.tokens_used = 150000
        mock_subscription.monthly_token_limit = 100000
        mock_db.query.return_value.filter.return_value.first.return_value = mock_subscription
        assert BillingService.check_quota(mock_db, uuid4()) is False

    def test_check_quota_no_subscription(self, mock_db):
        mock_db.query.return_value.filter.return_value.first.return_value = None
        assert BillingService.check_quota(mock_db, uuid4()) is False


class TestUsageSummary:
    """Test usage summary."""

    def test_get_usage_summary(self, mock_db):
        mock_result = MagicMock()
        mock_result.total_requests = 10
        mock_result.total_tokens = 5000
        mock_result.total_cost = 0.5
        mock_db.query.return_value.filter.return_value.first.return_value = mock_result

        summary = BillingService.get_usage_summary(mock_db, uuid4())
        assert summary["total_requests"] == 10
        assert summary["total_tokens"] == 5000
        assert summary["total_cost"] == 0.5


class TestSubscription:
    """Test subscription management."""

    def test_tier_limits_defined(self):
        assert SubscriptionTier.FREE in TIER_LIMITS
        assert SubscriptionTier.PRO in TIER_LIMITS
        assert SubscriptionTier.ENTERPRISE in TIER_LIMITS

    def test_tier_pricing_defined(self):
        assert TIER_PRICING[SubscriptionTier.FREE] == 0.0
        assert TIER_PRICING[SubscriptionTier.PRO] > 0
        assert TIER_PRICING[SubscriptionTier.ENTERPRISE] > TIER_PRICING[SubscriptionTier.PRO]

    def test_free_tier_has_lowest_limit(self):
        assert TIER_LIMITS[SubscriptionTier.FREE] < TIER_LIMITS[SubscriptionTier.PRO]
        assert TIER_LIMITS[SubscriptionTier.PRO] < TIER_LIMITS[SubscriptionTier.ENTERPRISE]


class TestMonthlyBill:
    """Test monthly bill calculation."""

    def test_calculate_bill_free_tier(self, mock_db):
        mock_sub = MagicMock()
        mock_sub.tier = SubscriptionTier.FREE
        mock_sub.tokens_used = 50000
        mock_sub.monthly_token_limit = 100000
        mock_db.query.return_value.filter.return_value.first.return_value = mock_sub

        bill = BillingService.calculate_monthly_bill(mock_db, uuid4())
        assert bill["tier"] == "FREE"
        assert bill["base_cost"] == 0.0
        assert bill["overage_cost"] == 0

    def test_calculate_bill_with_overage(self, mock_db):
        mock_sub = MagicMock()
        mock_sub.tier = SubscriptionTier.PRO
        mock_sub.tokens_used = 1_100_000
        mock_sub.monthly_token_limit = 1_000_000
        mock_db.query.return_value.filter.return_value.first.return_value = mock_sub

        bill = BillingService.calculate_monthly_bill(mock_db, uuid4())
        assert bill["tier"] == "PRO"
        assert bill["overage_cost"] > 0
        assert bill["total"] > bill["base_cost"]

    def test_calculate_bill_no_subscription(self, mock_db):
        mock_db.query.return_value.filter.return_value.first.return_value = None
        bill = BillingService.calculate_monthly_bill(mock_db, uuid4())
        assert bill["tier"] == "FREE"
        assert bill["total"] == 0
