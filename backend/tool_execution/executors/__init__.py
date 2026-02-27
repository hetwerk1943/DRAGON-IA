"""Executor registry."""

from .base import BaseExecutor
from .code_runner import CodeRunner
from .web_search import WebSearch
from .file_processor import FileProcessor

_EXECUTORS: dict[str, BaseExecutor] = {
    "code": CodeRunner(),
    "web_search": WebSearch(),
    "file": FileProcessor(),
}


def get_executor(name: str) -> BaseExecutor:
    if name not in _EXECUTORS:
        raise ValueError(f"Unknown tool: {name}. Available: {list(_EXECUTORS.keys())}")
    return _EXECUTORS[name]
