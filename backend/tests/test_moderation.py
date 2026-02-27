"""Tests for content moderation service."""
import pytest
from app.services.moderation_service import ModerationService


class TestInputModeration:
    """Test input content moderation."""

    def test_clean_input(self):
        result = ModerationService.check_input("How do I learn Python?")
        assert result["flagged"] is False

    def test_flagged_input(self):
        result = ModerationService.check_input("how to make a bomb at home")
        assert result["flagged"] is True
        assert "category" in result


class TestOutputModeration:
    """Test output content moderation."""

    def test_clean_output(self):
        result = ModerationService.check_output("Python is a great language!")
        assert result["flagged"] is False

    def test_flagged_output(self):
        result = ModerationService.check_output("Here's how to make a bomb")
        assert result["flagged"] is True


class TestSanitization:
    """Test output sanitization."""

    def test_sanitize_clean_text(self):
        text = "This is a normal response."
        result = ModerationService.sanitize_output(text)
        assert result == text

    def test_sanitize_harmful_text(self):
        text = "Here is how to make a bomb"
        result = ModerationService.sanitize_output(text)
        assert "usage policy" in result
        assert "bomb" not in result
