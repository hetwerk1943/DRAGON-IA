"""Tests for the AI Orchestrator."""

import asyncio

from dragon_ia.core.guard import Guard
from dragon_ia.core.memory import Memory
from dragon_ia.core.model_router import ModelRouter, ModelSpec
from dragon_ia.core.tools import ToolRegistry
from dragon_ia.orchestrator.core import Orchestrator, OrchestrationRequest


def _make_orchestrator() -> Orchestrator:
    router = ModelRouter()
    router.register(ModelSpec(name="test-model", provider="test", capabilities=["chat"]))
    memory = Memory()
    tools = ToolRegistry()
    guard = Guard()
    return Orchestrator(model_router=router, memory=memory, tools=tools, guard=guard)


class TestOrchestrator:
    def test_successful_chat(self):
        orch = _make_orchestrator()
        req = OrchestrationRequest(session_id="s1", prompt="hi")
        resp = asyncio.run(orch.handle(req))
        assert resp.success is True
        assert resp.data["model"] == "test-model"

    def test_guard_blocks_input(self):
        orch = _make_orchestrator()
        orch.guard.add_blocked_pattern("blocked")
        req = OrchestrationRequest(session_id="s1", prompt="this is blocked content")
        resp = asyncio.run(orch.handle(req))
        assert resp.success is False

    def test_tool_invocation(self):
        orch = _make_orchestrator()

        async def echo(text: str) -> str:
            return text

        orch.tools.register("echo", "echoes text", echo)
        req = OrchestrationRequest(
            session_id="s1", prompt="", tool_name="echo", tool_kwargs={"text": "hello"}
        )
        resp = asyncio.run(orch.handle(req))
        assert resp.success is True
        assert resp.data["tool_result"] == "hello"

    def test_missing_tool(self):
        orch = _make_orchestrator()
        req = OrchestrationRequest(session_id="s1", prompt="", tool_name="nope")
        resp = asyncio.run(orch.handle(req))
        assert resp.success is False

    def test_memory_persists_across_calls(self):
        orch = _make_orchestrator()
        asyncio.run(
            orch.handle(OrchestrationRequest(session_id="s1", prompt="first"))
        )
        asyncio.run(
            orch.handle(OrchestrationRequest(session_id="s1", prompt="second"))
        )
        entries = orch.memory.recall("s1")
        # Each request stores a user + assistant entry
        assert len(entries) == 4

    def test_no_model_for_capability(self):
        orch = _make_orchestrator()
        req = OrchestrationRequest(session_id="s1", prompt="draw", capability="image")
        resp = asyncio.run(orch.handle(req))
        assert resp.success is False
        assert "No model available" in resp.error
