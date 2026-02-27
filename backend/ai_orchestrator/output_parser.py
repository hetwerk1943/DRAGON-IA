"""Structured output parser – normalises model responses."""


class StructuredOutputParser:
    @staticmethod
    def parse(raw: dict) -> dict:
        return {
            "content": raw.get("content", ""),
            "tool_calls": raw.get("tool_calls"),
        }
