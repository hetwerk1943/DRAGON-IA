"""Authentication service."""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.workspace import Workspace
from app.models.api_key import ApiKey
from app.models.subscription import Subscription, SubscriptionTier
from app.core.security import hash_password, verify_password, create_access_token, generate_api_key
from app.schemas.auth import UserCreate


class AuthService:
    """Handles user authentication and registration."""

    @staticmethod
    def register(db: Session, user_data: UserCreate) -> User:
        """Register a new user."""
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        user = User(
            email=user_data.email,
            hashed_password=hash_password(user_data.password),
            full_name=user_data.full_name,
        )
        db.add(user)
        db.flush()

        # Create default subscription
        subscription = Subscription(user_id=user.id, tier=SubscriptionTier.FREE)
        db.add(subscription)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def login(db: Session, email: str, password: str) -> str:
        """Authenticate user and return JWT token."""
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated",
            )
        return create_access_token(data={"sub": str(user.id), "role": user.role.value})

    @staticmethod
    def create_api_key(db: Session, user: User, name: str) -> tuple[ApiKey, str]:
        """Create a new API key for a user."""
        raw_key, hashed_key = generate_api_key()
        api_key = ApiKey(key_hash=hashed_key, name=name, user_id=user.id)
        db.add(api_key)
        db.commit()
        db.refresh(api_key)
        return api_key, raw_key

    @staticmethod
    def create_workspace(db: Session, name: str, slug: str) -> Workspace:
        """Create a new workspace."""
        existing = db.query(Workspace).filter(Workspace.slug == slug).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workspace slug already taken",
            )
        workspace = Workspace(name=name, slug=slug)
        db.add(workspace)
        db.commit()
        db.refresh(workspace)
        return workspace
