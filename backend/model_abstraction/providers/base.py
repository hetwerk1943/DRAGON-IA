"""Abstract base provider."""

from abc import ABC, abstractmethod


class BaseProvider(ABC):
    @abstractmethod
    async def complete(self, request) -> str:
        ...
