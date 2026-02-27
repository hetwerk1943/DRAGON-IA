"""Abstract base executor."""

from abc import ABC, abstractmethod


class BaseExecutor(ABC):
    @abstractmethod
    async def run(self, parameters: dict) -> str:
        ...
