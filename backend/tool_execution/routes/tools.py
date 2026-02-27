"""Tool execution routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..executors import get_executor

router = APIRouter()


class ToolRequest(BaseModel):
    tool: str
    parameters: dict


class ToolResponse(BaseModel):
    tool: str
    result: str
    success: bool


@router.post("/execute", response_model=ToolResponse)
async def execute_tool(body: ToolRequest):
    try:
        executor = get_executor(body.tool)
        result = await executor.run(body.parameters)
        return ToolResponse(tool=body.tool, result=result, success=True)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        return ToolResponse(tool=body.tool, result=str(exc), success=False)
