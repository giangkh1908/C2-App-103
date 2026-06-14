"""
schemas.py – Pydantic schemas cho API chat giữa frontend và backend.

Không chứa business logic, router hay dependency.
"""

from typing import Any, Literal

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request gửi lên từ frontend mỗi lượt chat."""

    message: str = Field(
        min_length=1,
        description="Câu hỏi hoặc yêu cầu của học sinh.",
    )
    level: str = Field(
        default="L3",
        description="Cấp độ học sinh (ví dụ: L1, L2, L3, L4, L5).",
    )


class SimulationResponse(BaseModel):
    """Dữ liệu trực quan trả về cho frontend để render simulation.

    ``type`` xác định loại simulation (candy, fraction, rectangle, …).
    ``payload`` chứa các tham số tuỳ theo từng loại, giữ schema linh hoạt
    để dễ mở rộng mà không cần thay đổi contract chính.
    """

    type: str
    payload: dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    """Response chính trả về cho frontend sau mỗi lượt chat.

    ``explanation`` là câu giải thích bằng lời từ agent.
    ``simulation`` chứa dữ liệu trực quan nếu agent đã dùng tool;
    ``None`` nếu agent trả lời thuần văn bản.
    """

    explanation: str
    simulation: SimulationResponse | None = None


class HealthResponse(BaseModel):
    """Response cho health-check endpoint."""

    status: Literal["ok"]