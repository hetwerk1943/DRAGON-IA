"""AI Orchestrator - core brain of the DRAGON AI platform."""
import uuid
import json
from typing import Optional, AsyncGenerator

from app.config import settings
from app.core.security import detect_prompt_injection
from app.schemas.ai import ChatRequest, ChatResponse, ChatChoice, ChatMessage, UsageInfo


# Model pricing per 1K tokens (input, output)
MODEL_PRICING = {
    "gpt-4": (0.03, 0.06),
    "gpt-4-turbo": (0.01, 0.03),
    "gpt-3.5-turbo": (0.0005, 0.0015),
}

# Model context windows
MODEL_CONTEXT_WINDOWS = {
    "gpt-4": 8192,
    "gpt-4-turbo": 128000,
    "gpt-3.5-turbo": 16385,
}

# Model fallback chain
MODEL_FALLBACK_CHAIN = {
    "gpt-4": "gpt-4-turbo",
    "gpt-4-turbo": "gpt-3.5-turbo",
    "gpt-3.5-turbo": "gpt-3.5-turbo",
}


class AIOrchestrator:
    """Orchestrates AI model routing, context management, and tool execution."""

    @staticmethod
    def route_model(requested_model: Optional[str]) -> str:
        """Route to the appropriate model based on request and availability."""
        model = requested_model or settings.DEFAULT_MODEL
        if model in MODEL_CONTEXT_WINDOWS:
            return model
        return settings.DEFAULT_MODEL

    @staticmethod
    def get_fallback_model(model: str) -> str:
        """Get fallback model when primary fails."""
        return MODEL_FALLBACK_CHAIN.get(model, settings.FALLBACK_MODEL)

    @staticmethod
    def get_context_window(model: str) -> int:
        """Get the context window size for a model."""
        return MODEL_CONTEXT_WINDOWS.get(model, settings.MAX_CONTEXT_TOKENS)

    @staticmethod
    def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
        """Calculate the cost of an API call."""
        pricing = MODEL_PRICING.get(model, (0.0005, 0.0015))
        input_cost = (prompt_tokens / 1000) * pricing[0]
        output_cost = (completion_tokens / 1000) * pricing[1]
        return round(input_cost + output_cost, 6)

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """Estimate token count for a text string (rough: ~4 chars per token)."""
        return max(1, len(text) // 4)

    @staticmethod
    def validate_input(request: ChatRequest) -> None:
        """Validate and sanitize input, detect prompt injection."""
        for msg in request.messages:
            if detect_prompt_injection(msg.content):
                raise ValueError("Potential prompt injection detected")

    @staticmethod
    def trim_context(messages: list[dict], max_tokens: int) -> list[dict]:
        """Trim messages to fit within context window, keeping system + recent messages."""
        if not messages:
            return messages

        system_msgs = [m for m in messages if m.get("role") == "system"]
        other_msgs = [m for m in messages if m.get("role") != "system"]

        total_tokens = sum(len(m.get("content", "")) // 4 for m in system_msgs)
        result = list(system_msgs)

        # Add messages from most recent, backwards
        for msg in reversed(other_msgs):
            msg_tokens = len(msg.get("content", "")) // 4
            if total_tokens + msg_tokens > max_tokens:
                break
            result.append(msg)
            total_tokens += msg_tokens

        # Restore order (system first, then chronological)
        non_system = [m for m in result if m.get("role") != "system"]
        return system_msgs + list(reversed(non_system))

    @staticmethod
    def build_response(
        model: str,
        content: str,
        prompt_tokens: int,
        completion_tokens: int,
    ) -> ChatResponse:
        """Build a structured chat response."""
        return ChatResponse(
            id=f"chatcmpl-{uuid.uuid4().hex[:12]}",
            model=model,
            choices=[
                ChatChoice(
                    index=0,
                    message=ChatMessage(role="assistant", content=content),
                    finish_reason="stop",
                )
            ],
            usage=UsageInfo(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens,
            ),
        )

    @staticmethod
    async def stream_response(model: str, content: str) -> AsyncGenerator[str, None]:
        """Generate streaming response chunks (SSE format)."""
        chunk_id = f"chatcmpl-{uuid.uuid4().hex[:12]}"
        words = content.split()
        for i, word in enumerate(words):
            chunk = {
                "id": chunk_id,
                "model": model,
                "delta": {"content": word + " "},
                "finish_reason": None if i < len(words) - 1 else "stop",
            }
            yield f"data: {json.dumps(chunk)}\n\n"
        yield "data: [DONE]\n\n"
