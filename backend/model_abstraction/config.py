"""Model Abstraction Layer configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    local_llm_url: str = "http://localhost:11434"
    fallback_order: list[str] = ["openai", "anthropic", "local"]

    model_config = {"env_prefix": "MODEL_"}


settings = Settings()
