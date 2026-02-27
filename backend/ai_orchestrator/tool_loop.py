"""Tool execution loop – iteratively calls tools until the model stops."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .config import Settings


class ToolExecutionLoop:
    def __init__(self, settings: "Settings"):
        self._settings = settings

    async def run(self, model: str, context: list[dict], tools: list[dict]) -> dict:
        # TODO: implement iterative tool calling via Model Abstraction Layer
        return {"content": "Tool execution placeholder", "tool_calls": []}
