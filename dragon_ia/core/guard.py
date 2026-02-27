"""Guard – input / output validation and safety checks."""

from __future__ import annotations

from dataclasses import dataclass

from dragon_ia.infrastructure.logger import get_logger

logger = get_logger(__name__)


@dataclass
class GuardResult:
    """Result of a guard check."""

    allowed: bool
    reason: str = ""


class Guard:
    """Validates inputs and outputs against configurable rules."""

    def __init__(self) -> None:
        self._blocked_patterns: list[str] = []
        self._max_input_length: int = 10_000

    def add_blocked_pattern(self, pattern: str) -> None:
        self._blocked_patterns.append(pattern)

    def set_max_input_length(self, length: int) -> None:
        self._max_input_length = length

    def check_input(self, text: str) -> GuardResult:
        if len(text) > self._max_input_length:
            logger.warning("Input rejected: exceeds max length (%d)", self._max_input_length)
            return GuardResult(allowed=False, reason="Input exceeds maximum allowed length")
        for pattern in self._blocked_patterns:
            if pattern.lower() in text.lower():
                logger.warning("Input rejected: blocked pattern detected")
                return GuardResult(allowed=False, reason="Input contains blocked content")
        return GuardResult(allowed=True)

    def check_output(self, text: str) -> GuardResult:
        for pattern in self._blocked_patterns:
            if pattern.lower() in text.lower():
                logger.warning("Output rejected: blocked pattern detected")
                return GuardResult(allowed=False, reason="Output contains blocked content")
        return GuardResult(allowed=True)
