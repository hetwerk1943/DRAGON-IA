"""Tools – registry for callable tools / functions."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Awaitable

from dragon_ia.infrastructure.logger import get_logger

logger = get_logger(__name__)

ToolFunction = Callable[..., Awaitable[Any]]


@dataclass
class ToolSpec:
    """Describes a registered tool."""

    name: str
    description: str
    fn: ToolFunction


class ToolRegistry:
    """Manages available tools that the orchestrator can invoke."""

    def __init__(self) -> None:
        self._tools: dict[str, ToolSpec] = {}

    def register(self, name: str, description: str, fn: ToolFunction) -> None:
        self._tools[name] = ToolSpec(name=name, description=description, fn=fn)
        logger.info("Registered tool: %s", name)

    def list_tools(self) -> list[str]:
        return list(self._tools.keys())

    def get(self, name: str) -> ToolSpec | None:
        return self._tools.get(name)

    async def invoke(self, name: str, **kwargs: Any) -> Any:
        spec = self._tools.get(name)
        if spec is None:
            raise KeyError(f"Tool not found: {name}")
        logger.info("Invoking tool: %s", name)
        return await spec.fn(**kwargs)
