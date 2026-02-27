"""Tests for tool execution service."""
from app.services.tool_service import ToolService, BUILTIN_TOOLS


class TestToolRegistry:
    """Test tool registration and listing."""

    def test_builtin_tools_exist(self):
        assert "web_search" in BUILTIN_TOOLS
        assert "code_executor" in BUILTIN_TOOLS
        assert "file_processor" in BUILTIN_TOOLS

    def test_list_available_tools(self, mock_db):
        mock_db.query.return_value.filter.return_value.all.return_value = []
        tools = ToolService.list_available_tools(mock_db)
        assert tools == []

    def test_register_tool(self, mock_db):
        ToolService.register_tool(mock_db, "test_tool", "A test tool", "custom")
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()


class TestWebSearch:
    """Test web search tool."""

    def test_execute_web_search(self):
        result = ToolService.execute_web_search("test query")
        assert result["tool"] == "web_search"
        assert result["status"] == "success"
        assert result["query"] == "test query"
        assert len(result["results"]) > 0


class TestCodeExecutor:
    """Test code execution tool."""

    def test_execute_forbidden_os_import(self):
        result = ToolService.execute_code("import os\nos.system('ls')")
        assert result["status"] == "error"
        assert "Forbidden" in result["error"]

    def test_execute_forbidden_subprocess(self):
        result = ToolService.execute_code("import subprocess")
        assert result["status"] == "error"

    def test_execute_forbidden_eval(self):
        result = ToolService.execute_code("eval('1+1')")
        assert result["status"] == "error"

    def test_execute_forbidden_exec(self):
        result = ToolService.execute_code("exec('print(1)')")
        assert result["status"] == "error"

    def test_execute_forbidden_open(self):
        result = ToolService.execute_code("open('/etc/passwd')")
        assert result["status"] == "error"


class TestFileProcessor:
    """Test file processor tool."""

    def test_process_file(self):
        result = ToolService.execute_file_processor("test.txt", "line1\nline2\nline3")
        assert result["tool"] == "file_processor"
        assert result["status"] == "success"
        assert result["filename"] == "test.txt"
        assert result["lines"] == 3
        assert result["size"] == len("line1\nline2\nline3")


class TestToolExecution:
    """Test generic tool execution."""

    def test_execute_known_tool(self):
        service = ToolService()
        result = service.execute_tool("web_search", query="test")
        assert result["status"] == "success"

    def test_execute_unknown_tool(self):
        service = ToolService()
        result = service.execute_tool("nonexistent_tool")
        assert result["status"] == "error"
        assert "Unknown tool" in result["error"]
