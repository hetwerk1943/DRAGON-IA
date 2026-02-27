"""Gateway configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 30
    redis_url: str = "redis://redis:6379/0"
    allowed_origins: list[str] = ["http://localhost:3000"]
    rate_limit: str = "60/minute"
    orchestrator_url: str = "http://ai-orchestrator:8000"

    model_config = {"env_prefix": "GATEWAY_"}


settings = Settings()
