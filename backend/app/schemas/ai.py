"""AI orchestrator schemas."""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str = Field(..., min_length=1)


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = None
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, ge=1, le=128000)
    stream: Optional[bool] = False
    tools: Optional[List[str]] = None
    conversation_id: Optional[str] = None
    use_memory: Optional[bool] = True


class ChatChoice(BaseModel):
    index: int
    message: ChatMessage
    finish_reason: str


class UsageInfo(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatResponse(BaseModel):
    id: str
    model: str
    choices: List[ChatChoice]
    usage: UsageInfo


class ToolCall(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]
    result: Optional[Any] = None


class StreamChunk(BaseModel):
    id: str
    model: str
    delta: Dict[str, str]
    finish_reason: Optional[str] = None
