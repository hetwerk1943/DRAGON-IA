"""Security & Audit Service configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://dragon:dragon@postgres:5432/dragon_audit"
    abuse_threshold: int = 100
    abuse_window_seconds: int = 60

    model_config = {"env_prefix": "AUDIT_"}


settings = Settings()
