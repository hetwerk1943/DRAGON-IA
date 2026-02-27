"""Memory Service configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://redis:6379/1"
    qdrant_url: str = "http://qdrant:6333"
    qdrant_collection: str = "dragon_memories"
    short_term_ttl: int = 3600
    embedding_dimension: int = 1536

    model_config = {"env_prefix": "MEMORY_"}


settings = Settings()
