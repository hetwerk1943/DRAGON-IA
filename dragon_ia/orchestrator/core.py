"""AI Orchestrator – coordinates Model Router, Memory, Tools, and Guard."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from dragon_ia.core.guard import Guard
from dragon_ia.core.memory import Memory, MemoryEntry
from dragon_ia.core.model_router import ModelRouter
from dragon_ia.core.tools import ToolRegistry
from dragon_ia.infrastructure.logger import get_logger

logger = get_logger(__name__)


@dataclass
class OrchestrationRequest:
    """A request flowing through the orchestrator."""

    session_id: str
    prompt: str
    capability: str = "chat"
    tool_name: str | None = None
    tool_kwargs: dict[str, Any] = field(default_factory=dict)


@dataclass
class OrchestrationResponse:
    """The orchestrator's response."""

    success: bool
    data: dict[str, Any]
    error: str = ""


class Orchestrator:
    """Central brain that ties all core modules together."""

    def __init__(
        self,
        model_router: ModelRouter,
        memory: Memory,
        tools: ToolRegistry,
        guard: Guard,
    ) -> None:
        self.model_router = model_router
        self.memory = memory
        self.tools = tools
        self.guard = guard

    async def handle(self, request: OrchestrationRequest) -> OrchestrationResponse:
        # 1. Guard – validate input
        guard_result = self.guard.check_input(request.prompt)
        if not guard_result.allowed:
            logger.warning("Request blocked by guard: %s", guard_result.reason)
            return OrchestrationResponse(success=False, data={}, error=guard_result.reason)

        # 2. Memory – store user message
        self.memory.store(
            request.session_id,
            MemoryEntry(role="user", content=request.prompt),
        )

        # 3. Tool invocation (if requested)
        if request.tool_name:
            try:
                tool_result = await self.tools.invoke(request.tool_name, **request.tool_kwargs)
                return OrchestrationResponse(success=True, data={"tool_result": tool_result})
            except KeyError as exc:
                return OrchestrationResponse(success=False, data={}, error=str(exc))

        # 4. Model routing
        route_result = await self.model_router.route(request.prompt, request.capability)
        if "error" in route_result:
            return OrchestrationResponse(success=False, data=route_result, error=route_result["error"])

        # 5. Build context from memory
        history = self.memory.recall(request.session_id, last_n=10)
        context = [{"role": e.role, "content": e.content} for e in history]

        response_data: dict[str, Any] = {
            **route_result,
            "context": context,
        }

        # 6. Guard – validate output placeholder
        output_text = route_result.get("prompt", "")
        output_check = self.guard.check_output(output_text)
        if not output_check.allowed:
            return OrchestrationResponse(success=False, data={}, error=output_check.reason)

        # 7. Memory – store assistant message
        self.memory.store(
            request.session_id,
            MemoryEntry(role="assistant", content=str(response_data)),
        )

        logger.info("Orchestration complete for session %s", request.session_id)
        return OrchestrationResponse(success=True, data=response_data)
