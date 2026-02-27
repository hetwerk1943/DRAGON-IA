"""Sandboxed code execution."""

import subprocess
import tempfile
from .base import BaseExecutor
from ..config import settings


class CodeRunner(BaseExecutor):
    async def run(self, parameters: dict) -> str:
        language = parameters.get("language", "python")
        code = parameters.get("code", "")
        if not code:
            raise ValueError("No code provided")

        suffix = ".py" if language == "python" else ".js"
        cmd = ["python3"] if language == "python" else ["node"]

        with tempfile.NamedTemporaryFile(mode="w", suffix=suffix, delete=True) as f:
            f.write(code)
            f.flush()
            try:
                result = subprocess.run(
                    [*cmd, f.name],
                    capture_output=True,
                    text=True,
                    timeout=settings.sandbox_timeout,
                )
                output = result.stdout or result.stderr
                return output[: settings.max_output_size]
            except subprocess.TimeoutExpired:
                return "Execution timed out"
