"""Content moderation service for input/output safety."""


class ModerationService:
    """Handles content moderation and safety checks."""

    # Categories of harmful content
    BLOCKED_PATTERNS = [
        "how to make a bomb",
        "how to hack",
        "illegal drugs",
        "self-harm instructions",
    ]

    @staticmethod
    def check_input(text: str) -> dict:
        """Check input text for harmful content."""
        text_lower = text.lower()
        for pattern in ModerationService.BLOCKED_PATTERNS:
            if pattern in text_lower:
                return {
                    "flagged": True,
                    "reason": "Content violates usage policy",
                    "category": "harmful_content",
                }
        return {"flagged": False}

    @staticmethod
    def check_output(text: str) -> dict:
        """Check output text for harmful content."""
        text_lower = text.lower()
        for pattern in ModerationService.BLOCKED_PATTERNS:
            if pattern in text_lower:
                return {
                    "flagged": True,
                    "reason": "Generated content flagged for review",
                    "category": "harmful_content",
                }
        return {"flagged": False}

    @staticmethod
    def sanitize_output(text: str) -> str:
        """Sanitize output to remove potentially harmful content."""
        result = ModerationService.check_output(text)
        if result["flagged"]:
            return "I'm sorry, but I can't provide that information as it violates our usage policy."
        return text
