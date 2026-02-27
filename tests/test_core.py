"""Tests for the Core modules – Model Router, Memory, Tools, Guard."""

import asyncio
import pytest

from dragon_ia.core.model_router import ModelRouter, ModelSpec
from dragon_ia.core.memory import Memory, MemoryEntry
from dragon_ia.core.tools import ToolRegistry
from dragon_ia.core.guard import Guard


# ── Model Router ────────────────────────────────────────────────────────


class TestModelRouter:
    def test_register_and_resolve(self):
        router = ModelRouter()
        router.register(ModelSpec(name="m1", provider="p", capabilities=["chat"]))
        assert router.resolve("chat") is not None
        assert router.resolve("chat").name == "m1"

    def test_resolve_missing_capability(self):
        router = ModelRouter()
        router.register(ModelSpec(name="m1", provider="p", capabilities=["chat"]))
        assert router.resolve("image") is None

    def test_route_success(self):
        router = ModelRouter()
        router.register(ModelSpec(name="m1", provider="p", capabilities=["chat"]))
        result = asyncio.get_event_loop().run_until_complete(router.route("hi", "chat"))
        assert result["model"] == "m1"

    def test_route_no_model(self):
        router = ModelRouter()
        result = asyncio.get_event_loop().run_until_complete(router.route("hi", "missing"))
        assert "error" in result


# ── Memory ──────────────────────────────────────────────────────────────


class TestMemory:
    def test_store_and_recall(self):
        mem = Memory()
        mem.store("s1", MemoryEntry(role="user", content="hello"))
        entries = mem.recall("s1")
        assert len(entries) == 1
        assert entries[0].content == "hello"

    def test_recall_last_n(self):
        mem = Memory()
        for i in range(5):
            mem.store("s1", MemoryEntry(role="user", content=str(i)))
        entries = mem.recall("s1", last_n=2)
        assert len(entries) == 2
        assert entries[0].content == "3"

    def test_clear(self):
        mem = Memory()
        mem.store("s1", MemoryEntry(role="user", content="x"))
        mem.clear("s1")
        assert mem.recall("s1") == []

    def test_max_entries_window(self):
        mem = Memory(max_entries=3)
        for i in range(5):
            mem.store("s1", MemoryEntry(role="user", content=str(i)))
        entries = mem.recall("s1")
        assert len(entries) == 3
        assert entries[0].content == "2"


# ── Tools ───────────────────────────────────────────────────────────────


class TestToolRegistry:
    def test_register_and_list(self):
        reg = ToolRegistry()

        async def dummy() -> str:
            return "ok"

        reg.register("greet", "says hi", dummy)
        assert "greet" in reg.list_tools()

    def test_invoke(self):
        reg = ToolRegistry()

        async def add(a: int, b: int) -> int:
            return a + b

        reg.register("add", "adds two numbers", add)
        result = asyncio.get_event_loop().run_until_complete(reg.invoke("add", a=1, b=2))
        assert result == 3

    def test_invoke_missing_tool(self):
        reg = ToolRegistry()
        with pytest.raises(KeyError):
            asyncio.get_event_loop().run_until_complete(reg.invoke("nope"))


# ── Guard ───────────────────────────────────────────────────────────────


class TestGuard:
    def test_allows_normal_input(self):
        g = Guard()
        assert g.check_input("hello").allowed is True

    def test_blocks_long_input(self):
        g = Guard()
        g.set_max_input_length(5)
        assert g.check_input("toolong").allowed is False

    def test_blocks_pattern(self):
        g = Guard()
        g.add_blocked_pattern("bad-word")
        assert g.check_input("this has bad-word inside").allowed is False

    def test_output_guard(self):
        g = Guard()
        g.add_blocked_pattern("secret")
        assert g.check_output("here is secret data").allowed is False
        assert g.check_output("safe text").allowed is True
