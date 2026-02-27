"""Tool Execution Service configuration."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    sandbox_timeout: int = 30
    max_output_size: int = 65536
    search_api_key: str = ""

    model_config = {"env_prefix": "TOOLS_"}


settings = Settings()
