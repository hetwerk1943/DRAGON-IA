"""FastAPI dependencies for dependency injection."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import decode_access_token, hash_api_key
from app.models.user import User, UserRole
from app.models.api_key import ApiKey

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Get the current authenticated user from JWT or API key."""
    token = credentials.credentials

    # Try JWT first
    payload = decode_access_token(token)
    if payload and "sub" in payload:
        user = db.query(User).filter(User.id == payload["sub"]).first()
        if user and user.is_active:
            return user

    # Try API key
    key_hash = hash_api_key(token)
    api_key = db.query(ApiKey).filter(ApiKey.key_hash == key_hash, ApiKey.is_active == True).first()
    if api_key:
        user = db.query(User).filter(User.id == api_key.user_id).first()
        if user and user.is_active:
            return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired credentials",
    )


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role."""
    if current_user.role not in (UserRole.ADMIN, UserRole.ENTERPRISE):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
