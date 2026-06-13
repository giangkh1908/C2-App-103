from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, Field


class LLMMessage(BaseModel):
    role: str
    content: str


class LLMToolCall(BaseModel):
    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)


class LLMResponse(BaseModel):
    content: str | None = None
    tool_call: LLMToolCall | None = None
    raw: dict[str, Any] | None = None


class BaseLLMClient(ABC):
    @abstractmethod
    async def generate(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> LLMResponse:
        raise NotImplementedError
