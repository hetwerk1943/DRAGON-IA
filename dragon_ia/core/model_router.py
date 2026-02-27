"""Model Router – directs requests to the appropriate AI model."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from dragon_ia.infrastructure.logger import get_logger

logger = get_logger(__name__)


@dataclass
class ModelSpec:
    """Specification for a registered model."""

    name: str
    provider: str
    capabilities: list[str]


class ModelRouter:
    """Routes prompts to the most suitable registered model."""

    def __init__(self) -> None:
        self._models: dict[str, ModelSpec] = {}

    def register(self, spec: ModelSpec) -> None:
        self._models[spec.name] = spec
        logger.info("Registered model %s (%s)", spec.name, spec.provider)

    def resolve(self, required_capability: str) -> ModelSpec | None:
        """Return the first model that has the requested capability."""
        for spec in self._models.values():
            if required_capability in spec.capabilities:
                return spec
        return None

    async def route(self, prompt: str, capability: str = "chat") -> dict[str, Any]:
        spec = self.resolve(capability)
        if spec is None:
            return {"error": f"No model available for capability: {capability}"}
        logger.info("Routing to model %s for capability %s", spec.name, capability)
        return {"model": spec.name, "provider": spec.provider, "prompt": prompt}
