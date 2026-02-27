"""Tool execution API routes."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.tool_service import ToolService, BUILTIN_TOOLS

router = APIRouter()
tool_service = ToolService()


class ToolExecuteRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = {}


class ToolRegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str
    tool_type: str
    config: Optional[Dict[str, Any]] = None


@router.get("/")
def list_tools(db: Session = Depends(get_db)):
    """List all available tools."""
    db_tools = tool_service.list_available_tools(db)
    tools = [
        {"name": t.name, "description": t.description, "type": t.tool_type}
        for t in db_tools
    ]
    # Add built-in tools
    for name, info in BUILTIN_TOOLS.items():
        if not any(t["name"] == name for t in tools):
            tools.append({"name": name, "description": info["description"], "type": info["tool_type"]})
    return {"tools": tools}


@router.post("/execute")
def execute_tool(
    data: ToolExecuteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Execute a tool."""
    result = tool_service.execute_tool(data.tool_name, **data.arguments)
    return result


@router.post("/register", status_code=201)
def register_tool(
    data: ToolRegisterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Register a new tool (admin only)."""
    tool = tool_service.register_tool(db, data.name, data.description, data.tool_type, data.config)
    return {"id": str(tool.id), "name": tool.name, "status": "registered"}
