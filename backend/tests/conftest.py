"""Test configuration and fixtures."""
import pytest
from unittest.mock import MagicMock
from uuid import uuid4

from app.models.user import User, UserRole
from app.models.subscription import Subscription, SubscriptionTier


@pytest.fixture
def mock_db():
    """Mock database session."""
    db = MagicMock()
    db.query.return_value = db
    db.filter.return_value = db
    db.first.return_value = None
    db.all.return_value = []
    db.scalar.return_value = 0
    return db


@pytest.fixture
def mock_user():
    """Mock user object."""
    user = MagicMock(spec=User)
    user.id = uuid4()
    user.email = "test@example.com"
    user.full_name = "Test User"
    user.role = UserRole.USER
    user.is_active = True
    user.hashed_password = "$2b$12$test_hash"
    return user


@pytest.fixture
def mock_subscription():
    """Mock subscription object."""
    sub = MagicMock(spec=Subscription)
    sub.id = uuid4()
    sub.tier = SubscriptionTier.FREE
    sub.monthly_token_limit = 100000
    sub.tokens_used = 0
    return sub
