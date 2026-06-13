from typing import Any, Literal

from pydantic import BaseModel, Field


class ToolCall(BaseModel):
    name: str = Field(..., description="Tên tool cần gọi")
    arguments: dict[str, Any] = Field(
        default_factory=dict,
        description="Tham số truyền vào tool",
    )


class ToolObservation(BaseModel):
    tool_name: str
    success: bool
    data: dict[str, Any] = Field(default_factory=dict)
    message: str | None = None
    error: str | None = None


class AgentStep(BaseModel):
    step_index: int
    thought: str | None = None
    tool_call: ToolCall | None = None
    observation: ToolObservation | None = None


class AgentResponse(BaseModel):
    answer: str
    tool_used: str | None = None
    visual_data: dict[str, Any] | None = None
    suggestions: list[str] = Field(default_factory=list)
    steps: list[AgentStep] = Field(default_factory=list)


class AgentRunConfig(BaseModel):
    level: Literal["L1", "L2", "L3", "L4", "L5"] = "L3"
    max_steps: int = Field(default=4, ge=1, le=10)
    use_tools: bool = True
