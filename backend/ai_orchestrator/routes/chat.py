"""Chat completion endpoint with orchestration logic."""

from fastapi import APIRouter
from pydantic import BaseModel

from ..config import settings
from ..context import ContextBuilder
from ..tool_loop import ToolExecutionLoop
from ..output_parser import StructuredOutputParser

router = APIRouter()


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: str | None = None
    messages: list[Message]
    tools: list[dict] | None = None
    stream: bool = False


class ChatResponse(BaseModel):
    id: str = ""
    model: str = ""
    content: str = ""
    tool_calls: list[dict] | None = None


@router.post("/chat/completions", response_model=ChatResponse)
async def chat_completions(body: ChatRequest):
    model = body.model or settings.default_model

    context = await ContextBuilder(settings).build(body.messages)

    if body.tools:
        loop = ToolExecutionLoop(settings)
        result = await loop.run(model, context, body.tools)
    else:
        result = {"content": "Echo: " + (body.messages[-1].content if body.messages else "")}

    parsed = StructuredOutputParser.parse(result)
    return ChatResponse(model=model, **parsed)
