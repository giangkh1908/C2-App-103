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
    usage: dict[str, Any] | None = None


class AgentRunConfig(BaseModel):
    level: Literal["L1", "L2", "L3", "L4", "L5"] = "L3"
    max_steps: int = Field(default=4, ge=1, le=10)
    use_tools: bool = True
    prompt_version: str = "v1"
    prompt_id: str = "tutor_system"
    allowed_tool_names: list[str] | None = Field(
        default=None,
        description=(
            "Nếu được đặt, chỉ các tool có tên trong danh sách này được đưa cho LLM. "
            "Danh sách rỗng nghĩa là không tool nào được đưa (ép LLM trả lời bằng text). "
            "None nghĩa là không lọc — đưa toàn bộ tool đã đăng ký (hành vi mặc định cũ)."
        ),
    )
