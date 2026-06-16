from typing import Any

import pytest
from pydantic import Field

from src.tools.base import BaseTool, ToolInput, ToolResult


class DummyInput(ToolInput):
    value: int = Field(..., ge=1)


class DummyTool(BaseTool):
    name = "dummy_tool"
    description = "Dummy tool for testing"
    input_schema = DummyInput

    async def run(self, **kwargs: Any) -> ToolResult:
        validated_input = self.validate_input(kwargs)
        return ToolResult(success=True, data=validated_input)


def test_tool_result_defaults() -> None:
    result = ToolResult(success=True)

    assert result.success is True
    assert result.data == {}
    assert result.message is None
    assert result.error is None


def test_validate_input_returns_valid_dict() -> None:
    tool = DummyTool()

    validated_input = tool.validate_input({"value": 3})

    assert validated_input == {"value": 3}


def test_validate_input_raises_for_invalid_input() -> None:
    tool = DummyTool()

    with pytest.raises(Exception):
        tool.validate_input({"value": 0})


def test_to_openai_tool_schema_returns_function_schema() -> None:
    tool = DummyTool()

    schema = tool.to_openai_tool_schema()

    assert schema["type"] == "function"
    assert schema["function"]["name"] == "dummy_tool"
    assert schema["function"]["description"] == "Dummy tool for testing"
    assert "value" in schema["function"]["parameters"]["properties"]


@pytest.mark.asyncio
async def test_dummy_tool_run_returns_validated_data() -> None:
    tool = DummyTool()

    result = await tool.run(value=5)

    assert result.success is True
    assert result.data == {"value": 5}
