"""AI Orchestrator API routes."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai import ChatRequest, ChatResponse
from app.services.ai_orchestrator import AIOrchestrator
from app.services.billing_service import BillingService
from app.services.moderation_service import ModerationService

router = APIRouter()
orchestrator = AIOrchestrator()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a chat request to the AI orchestrator."""
    # Check quota
    if not BillingService.check_quota(db, current_user.id):
        raise HTTPException(status_code=429, detail="Token quota exceeded")

    # Validate input
    try:
        orchestrator.validate_input(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Moderation check
    for msg in request.messages:
        result = ModerationService.check_input(msg.content)
        if result["flagged"]:
            raise HTTPException(status_code=400, detail=result["reason"])

    # Route model
    model = orchestrator.route_model(request.model)
    context_window = orchestrator.get_context_window(model)

    # Trim context
    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    trimmed = orchestrator.trim_context(messages, context_window)

    # Build response (placeholder - in production would call actual AI API)
    prompt_tokens = sum(orchestrator.estimate_tokens(m["content"]) for m in trimmed)
    response_content = f"DRAGON AI response to your query using {model}. This is a placeholder response."
    completion_tokens = orchestrator.estimate_tokens(response_content)

    # Log usage
    BillingService.log_usage(db, current_user.id, model, prompt_tokens, completion_tokens)

    return orchestrator.build_response(model, response_content, prompt_tokens, completion_tokens)


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Stream a chat response using SSE."""
    # Check quota
    if not BillingService.check_quota(db, current_user.id):
        raise HTTPException(status_code=429, detail="Token quota exceeded")

    model = orchestrator.route_model(request.model)
    content = f"DRAGON AI streaming response using {model}. This is a placeholder."

    return StreamingResponse(
        orchestrator.stream_response(model, content),
        media_type="text/event-stream",
    )


@router.get("/models")
async def list_models():
    """List available AI models."""
    from app.services.ai_orchestrator import MODEL_CONTEXT_WINDOWS, MODEL_PRICING
    models = []
    for name, context in MODEL_CONTEXT_WINDOWS.items():
        pricing = MODEL_PRICING.get(name, (0, 0))
        models.append({
            "id": name,
            "context_window": context,
            "input_price_per_1k": pricing[0],
            "output_price_per_1k": pricing[1],
        })
    return {"models": models}
