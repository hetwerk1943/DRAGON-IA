"""Tests for memory service."""
import pytest
import json
from unittest.mock import MagicMock, patch
from uuid import uuid4

from app.services.memory_service import MemoryService
from app.models.memory_embedding import MemoryEmbedding


class TestShortTermMemory:
    """Test Redis-based short-term memory."""

    def test_store_short_term_with_redis(self):
        redis_mock = MagicMock()
        service = MemoryService(redis_client=redis_mock)
        result = service.store_short_term("user1", "key1", "value1", ttl=3600)
        assert result is True
        redis_mock.setex.assert_called_once_with("memory:user1:key1", 3600, "value1")

    def test_store_short_term_without_redis(self):
        service = MemoryService(redis_client=None)
        result = service.store_short_term("user1", "key1", "value1")
        assert result is False

    def test_get_short_term_with_redis(self):
        redis_mock = MagicMock()
        redis_mock.get.return_value = b"stored_value"
        service = MemoryService(redis_client=redis_mock)
        result = service.get_short_term("user1", "key1")
        assert result == "stored_value"

    def test_get_short_term_missing_key(self):
        redis_mock = MagicMock()
        redis_mock.get.return_value = None
        service = MemoryService(redis_client=redis_mock)
        result = service.get_short_term("user1", "missing")
        assert result is None

    def test_get_short_term_without_redis(self):
        service = MemoryService(redis_client=None)
        result = service.get_short_term("user1", "key1")
        assert result is None


class TestConversationContext:
    """Test conversation context caching."""

    def test_store_conversation_context(self):
        redis_mock = MagicMock()
        service = MemoryService(redis_client=redis_mock)
        messages = [{"role": "user", "content": "Hello"}]
        result = service.store_conversation_context("user1", "conv1", messages)
        assert result is True

    def test_get_conversation_context(self):
        redis_mock = MagicMock()
        messages = [{"role": "user", "content": "Hello"}]
        redis_mock.get.return_value = json.dumps(messages).encode()
        service = MemoryService(redis_client=redis_mock)
        result = service.get_conversation_context("user1", "conv1")
        assert result == messages

    def test_get_conversation_context_missing(self):
        redis_mock = MagicMock()
        redis_mock.get.return_value = None
        service = MemoryService(redis_client=redis_mock)
        result = service.get_conversation_context("user1", "missing")
        assert result is None


class TestLongTermMemory:
    """Test database-based long-term memory."""

    def test_store_long_term(self, mock_db):
        user_id = uuid4()
        result = MemoryService.store_long_term(mock_db, user_id, "test content", "conversation")
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    def test_search_long_term(self, mock_db):
        mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = []
        user_id = uuid4()
        results = MemoryService.search_long_term(mock_db, user_id, "test query")
        assert results == []

    def test_get_user_memories(self, mock_db):
        mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = []
        user_id = uuid4()
        results = MemoryService.get_user_memories(mock_db, user_id)
        assert results == []


class TestMemoryInjection:
    """Test memory context injection."""

    def test_inject_memory_empty(self, mock_db):
        service = MemoryService()
        user_id = uuid4()
        mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = []
        result = service.inject_memory_context(mock_db, user_id, "test")
        assert result == ""

    def test_inject_memory_with_results(self, mock_db):
        service = MemoryService()
        user_id = uuid4()
        mock_memory = MagicMock()
        mock_memory.content = "Important fact"
        mock_db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = [mock_memory]
        result = service.inject_memory_context(mock_db, user_id, "test")
        assert "Important fact" in result
        assert "Relevant context" in result
