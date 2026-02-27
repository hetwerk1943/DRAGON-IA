"""Tool execution service for plugin management and safe execution."""
import subprocess
import tempfile
import os
from typing import Any, Optional
from sqlalchemy.orm import Session

from app.models.tool import Tool


# Tool registry
BUILTIN_TOOLS: dict[str, dict] = {
    "web_search": {
        "description": "Search the web for information",
        "tool_type": "web_search",
    },
    "code_executor": {
        "description": "Execute Python code in a sandboxed environment",
        "tool_type": "code_executor",
    },
    "file_processor": {
        "description": "Process and analyze uploaded files",
        "tool_type": "file_processor",
    },
}


class ToolService:
    """Manages tool registration and execution."""

    @staticmethod
    def list_available_tools(db: Session) -> list[Tool]:
        """List all active tools."""
        return db.query(Tool).filter(Tool.is_active is True).all()

    @staticmethod
    def get_tool(db: Session, tool_name: str) -> Optional[Tool]:
        """Get a tool by name."""
        return db.query(Tool).filter(Tool.name == tool_name, Tool.is_active is True).first()

    @staticmethod
    def register_tool(db: Session, name: str, description: str, tool_type: str, config: dict = None) -> Tool:
        """Register a new tool."""
        tool = Tool(
            name=name,
            description=description,
            tool_type=tool_type,
            config=config or {},
        )
        db.add(tool)
        db.commit()
        db.refresh(tool)
        return tool

    @staticmethod
    def execute_web_search(query: str) -> dict[str, Any]:
        """Execute a web search (abstraction layer)."""
        # In production, this would call a search API
        return {
            "tool": "web_search",
            "query": query,
            "results": [
                {"title": "Search result placeholder", "snippet": f"Results for: {query}"}
            ],
            "status": "success",
        }

    @staticmethod
    def execute_code(code: str, timeout: int = 10) -> dict[str, Any]:
        """Execute Python code in a sandboxed environment."""
        # Validate code safety
        forbidden = ["import os", "import sys", "subprocess", "eval(", "exec(", "__import__", "open("]
        for pattern in forbidden:
            if pattern in code:
                return {
                    "tool": "code_executor",
                    "status": "error",
                    "error": f"Forbidden operation detected: {pattern}",
                }

        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_path = f.name

            result = subprocess.run(
                ["python3", temp_path],
                capture_output=True,
                text=True,
                timeout=timeout,
                env={"PATH": "/usr/bin"},
            )
            return {
                "tool": "code_executor",
                "status": "success" if result.returncode == 0 else "error",
                "stdout": result.stdout[:5000],
                "stderr": result.stderr[:2000],
            }
        except subprocess.TimeoutExpired:
            return {"tool": "code_executor", "status": "error", "error": "Execution timed out"}
        except Exception as e:
            return {"tool": "code_executor", "status": "error", "error": str(e)}
        finally:
            if 'temp_path' in locals():
                os.unlink(temp_path)

    @staticmethod
    def execute_file_processor(filename: str, content: str) -> dict[str, Any]:
        """Process a file and return analysis."""
        return {
            "tool": "file_processor",
            "filename": filename,
            "size": len(content),
            "lines": content.count("\n") + 1,
            "status": "success",
        }

    def execute_tool(self, tool_name: str, **kwargs) -> dict[str, Any]:
        """Execute a tool by name."""
        executors = {
            "web_search": lambda: self.execute_web_search(kwargs.get("query", "")),
            "code_executor": lambda: self.execute_code(kwargs.get("code", "")),
            "file_processor": lambda: self.execute_file_processor(
                kwargs.get("filename", ""), kwargs.get("content", "")
            ),
        }
        executor = executors.get(tool_name)
        if not executor:
            return {"status": "error", "error": f"Unknown tool: {tool_name}"}
        return executor()
