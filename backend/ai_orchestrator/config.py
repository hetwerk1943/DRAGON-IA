"""Orchestrator configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    default_model: str = "openai/gpt-4"
    model_abstraction_url: str = "http://model-abstraction:8000"
    memory_service_url: str = "http://memory-service:8000"
    tool_service_url: str = "http://tool-execution:8000"
    max_tool_iterations: int = 5

    model_config = {"env_prefix": "ORCHESTRATOR_"}


settings = Settings()
