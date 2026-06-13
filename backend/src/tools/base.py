from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, Field


class ToolResult(BaseModel):
    success: bool
    data: dict[str, Any] = Field(default_factory=dict)
    message: str | None = None
    error: str | None = None


class ToolInput(BaseModel):
    pass


class BaseTool(ABC):
    name: str
    description: str
    input_schema: type[ToolInput] | None = None

    @abstractmethod
    async def run(self, **kwargs: Any) -> ToolResult:
        pass

    def to_tool_schema(self) -> dict[str, Any]:
        parameters = (
            self.input_schema.model_json_schema()
            if self.input_schema is not None
            else {"type": "object", "properties": {}, "required": []}
        )

        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": parameters,
            },
        }

    def validate_input(self, kwargs: dict[str, Any]) -> dict[str, Any]:
        if self.input_schema is None:
            return kwargs

        return self.input_schema(**kwargs).model_dump()
