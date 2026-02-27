"""Tests for the Infrastructure Layer."""

import asyncio
import pytest

from dragon_ia.infrastructure.database import Database
from dragon_ia.infrastructure.vector_db import VectorDB, VectorRecord
from dragon_ia.infrastructure.cache import Cache
from dragon_ia.infrastructure.queue import MessageQueue, Message
from dragon_ia.infrastructure.logger import get_logger


# ── Database ────────────────────────────────────────────────────────────


class TestDatabase:
    def test_set_and_get(self):
        db = Database()
        asyncio.get_event_loop().run_until_complete(db.set("k", "v"))
        assert asyncio.get_event_loop().run_until_complete(db.get("k")) == "v"

    def test_get_missing_key(self):
        db = Database()
        assert asyncio.get_event_loop().run_until_complete(db.get("nope")) is None

    def test_delete(self):
        db = Database()
        asyncio.get_event_loop().run_until_complete(db.set("k", 1))
        assert asyncio.get_event_loop().run_until_complete(db.delete("k")) is True
        assert asyncio.get_event_loop().run_until_complete(db.get("k")) is None

    def test_keys(self):
        db = Database()
        asyncio.get_event_loop().run_until_complete(db.set("a", 1))
        asyncio.get_event_loop().run_until_complete(db.set("b", 2))
        keys = asyncio.get_event_loop().run_until_complete(db.keys())
        assert sorted(keys) == ["a", "b"]


# ── VectorDB ────────────────────────────────────────────────────────────


class TestVectorDB:
    def test_insert_and_search(self):
        vdb = VectorDB()
        loop = asyncio.get_event_loop()
        loop.run_until_complete(vdb.insert(VectorRecord(id="a", vector=[1.0, 0.0])))
        loop.run_until_complete(vdb.insert(VectorRecord(id="b", vector=[0.0, 1.0])))
        results = loop.run_until_complete(vdb.search([1.0, 0.0], top_k=1))
        assert len(results) == 1
        assert results[0].id == "a"

    def test_cosine_similarity_identical(self):
        sim = VectorDB._cosine_similarity([1, 0], [1, 0])
        assert sim == pytest.approx(1.0)

    def test_cosine_similarity_orthogonal(self):
        sim = VectorDB._cosine_similarity([1, 0], [0, 1])
        assert sim == pytest.approx(0.0)


# ── Cache ───────────────────────────────────────────────────────────────


class TestCache:
    def test_set_and_get(self):
        c = Cache()
        loop = asyncio.get_event_loop()
        loop.run_until_complete(c.set("k", "v"))
        assert loop.run_until_complete(c.get("k")) == "v"

    def test_missing_key(self):
        c = Cache()
        assert asyncio.get_event_loop().run_until_complete(c.get("x")) is None

    def test_delete(self):
        c = Cache()
        loop = asyncio.get_event_loop()
        loop.run_until_complete(c.set("k", "v"))
        assert loop.run_until_complete(c.delete("k")) is True
        assert loop.run_until_complete(c.get("k")) is None


# ── MessageQueue ────────────────────────────────────────────────────────


class TestMessageQueue:
    def test_publish_and_consume(self):
        q = MessageQueue()
        loop = asyncio.get_event_loop()
        loop.run_until_complete(q.publish(Message(topic="t", payload="p")))
        assert q.pending() == 1
        msg = loop.run_until_complete(q.consume())
        assert msg.topic == "t"
        assert q.pending() == 0


# ── Logger ──────────────────────────────────────────────────────────────


class TestLogger:
    def test_returns_named_logger(self):
        lg = get_logger("test.infra")
        assert lg.name == "test.infra"
