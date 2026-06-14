from typing import Any

import pytest

from src.tools.base import BaseTool, ToolResult
from src.tools.registry import ToolRegistry, create_default_tool_registry


class DummyTool(BaseTool):
    name = "dummy"
    description = "Dummy tool"

    async def run(self, **kwargs: Any) -> ToolResult:
        return ToolResult(success=True, data=kwargs)


class FailingTool(BaseTool):
    name = "failing"
    description = "Failing tool"

    async def run(self, **kwargs: Any) -> ToolResult:
        raise RuntimeError("boom")


def test_registry_registers_and_gets_tool() -> None:
    tool = DummyTool()
    registry = ToolRegistry()

    registry.register(tool)

    assert registry.get("dummy") is tool


def test_registry_raises_for_duplicate_tool_name() -> None:
    registry = ToolRegistry([DummyTool()])

    with pytest.raises(ValueError):
        registry.register(DummyTool())


def test_registry_list_tools_returns_registered_tools() -> None:
    registry = ToolRegistry([DummyTool(), FailingTool()])

    tools = registry.list_tools()

    assert len(tools) == 2


def test_registry_list_tool_schemas_returns_function_schemas() -> None:
    registry = ToolRegistry([DummyTool()])

    schemas = registry.list_tool_schemas()

    assert len(schemas) == 1
    assert schemas[0]["function"]["name"] == "dummy"


@pytest.mark.asyncio
async def test_registry_call_returns_tool_result() -> None:
    registry = ToolRegistry([DummyTool()])

    result = await registry.call("dummy", {"x": 1})

    assert result.success is True
    assert result.data["x"] == 1


@pytest.mark.asyncio
async def test_registry_call_returns_error_for_missing_tool() -> None:
    registry = ToolRegistry()

    result = await registry.call("missing_tool", {})

    assert result.success is False


@pytest.mark.asyncio
async def test_registry_call_catches_unexpected_tool_error() -> None:
    registry = ToolRegistry([FailingTool()])

    result = await registry.call("failing", {})

    assert result.success is False
    assert "boom" in result.error


def test_create_default_tool_registry_registers_math_tools() -> None:
    registry = create_default_tool_registry()

    tools = registry.list_tools()

    assert len(tools) == 4
