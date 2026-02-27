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
        asyncio.run(db.set("k", "v"))
        assert asyncio.run(db.get("k")) == "v"

    def test_get_missing_key(self):
        db = Database()
        assert asyncio.run(db.get("nope")) is None

    def test_delete(self):
        db = Database()
        asyncio.run(db.set("k", 1))
        assert asyncio.run(db.delete("k")) is True
        assert asyncio.run(db.get("k")) is None

    def test_keys(self):
        db = Database()
        asyncio.run(db.set("a", 1))
        asyncio.run(db.set("b", 2))
        keys = asyncio.run(db.keys())
        assert sorted(keys) == ["a", "b"]


# ── VectorDB ────────────────────────────────────────────────────────────


class TestVectorDB:
    def test_insert_and_search(self):
        vdb = VectorDB()
        asyncio.run(vdb.insert(VectorRecord(id="a", vector=[1.0, 0.0])))
        asyncio.run(vdb.insert(VectorRecord(id="b", vector=[0.0, 1.0])))
        results = asyncio.run(vdb.search([1.0, 0.0], top_k=1))
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
        asyncio.run(c.set("k", "v"))
        assert asyncio.run(c.get("k")) == "v"

    def test_missing_key(self):
        c = Cache()
        assert asyncio.run(c.get("x")) is None

    def test_delete(self):
        c = Cache()
        asyncio.run(c.set("k", "v"))
        assert asyncio.run(c.delete("k")) is True
        assert asyncio.run(c.get("k")) is None


# ── MessageQueue ────────────────────────────────────────────────────────


class TestMessageQueue:
    def test_publish_and_consume(self):
        q = MessageQueue()
        asyncio.run(q.publish(Message(topic="t", payload="p")))
        assert q.pending() == 1
        msg = asyncio.run(q.consume())
        assert msg.topic == "t"
        assert q.pending() == 0


# ── Logger ──────────────────────────────────────────────────────────────


class TestLogger:
    def test_returns_named_logger(self):
        lg = get_logger("test.infra")
        assert lg.name == "test.infra"
