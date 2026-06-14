from typing import Any

from .base import BaseTool, ToolResult
from .math_visual_tools import get_math_visual_tools


class ToolRegistry:
    def __init__(self, tools: list[BaseTool] | None = None) -> None:
        self.tools: dict[str, BaseTool] = {}

        if tools is not None:
            for tool in tools:
                self.register(tool)

    def register(self, tool: BaseTool) -> None:
        if not tool.name:
            raise ValueError("Tool name must not be empty")

        if tool.name in self.tools:
            raise ValueError(f"Tool '{tool.name}' is already registered")

        self.tools[tool.name] = tool

    def get(self, name: str) -> BaseTool | None:
        return self.tools.get(name)

    def list_tools(self) -> list[BaseTool]:
        return list(self.tools.values())

    def list_tool_schemas(self) -> list[dict[str, Any]]:
        return [tool.to_openai_tool_schema() for tool in self.tools.values()]

    async def call(
        self,
        name: str,
        arguments: dict[str, Any] | None = None,
    ) -> ToolResult:
        tool = self.get(name)
        if tool is None:
            return ToolResult(
                success=False,
                error=f"Tool '{name}' not found",
                message="Không tìm thấy công cụ phù hợp.",
            )

        try:
            return await tool.run(**(arguments or {}))
        except Exception as exc:
            return ToolResult(
                success=False,
                error=str(exc),
                message="Công cụ gặp lỗi khi xử lý.",
            )


def create_default_tool_registry() -> ToolRegistry:
    return ToolRegistry(get_math_visual_tools())

from typing import Any

from .base import BaseTool, ToolResult
from .math_visual_tools import get_math_visual_tools


class ToolRegistry:
    def __init__(self, tools: list[BaseTool] | None = None) -> None:
        self.tools: dict[str, BaseTool] = {}

        if tools is not None:
            for tool in tools:
                self.register(tool)

    def register(self, tool: BaseTool) -> None:
        if not tool.name:
            raise ValueError("Tool name must not be empty")

        if tool.name in self.tools:
            raise ValueError(f"Tool '{tool.name}' is already registered")

        self.tools[tool.name] = tool

    def get(self, name: str) -> BaseTool | None:
        return self.tools.get(name)

    def list_tools(self) -> list[BaseTool]:
        return list(self.tools.values())

    def list_tool_schemas(self) -> list[dict[str, Any]]:
        return [tool.to_openai_tool_schema() for tool in self.tools.values()]

    async def call(
        self,
        name: str,
        arguments: dict[str, Any] | None = None,
    ) -> ToolResult:
        tool = self.get(name)
        if tool is None:
            return ToolResult(
                success=False,
                error=f"Tool '{name}' not found",
                message="Không tìm thấy công cụ phù hợp.",
            )

        try:
            return await tool.run(**(arguments or {}))
        except Exception as exc:
            return ToolResult(
                success=False,
                error=str(exc),
                message="Công cụ gặp lỗi khi xử lý.",
            )


def create_default_tool_registry() -> ToolRegistry:
    return ToolRegistry(get_math_visual_tools())
