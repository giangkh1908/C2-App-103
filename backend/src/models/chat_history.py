"""
chat_history.py – Pydantic v2 response models cho API lịch sử hội thoại.

Chỉ chứa model definitions; không chứa business logic hay ORM.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ChatSessionSummary(BaseModel):
    """Thông tin ngắn gọn của một session, dùng để hiển thị trong sidebar."""

    session_id: str = Field(..., description="ID duy nhất của session.")
    title: str = Field(..., description="Tiêu đề tóm tắt của hội thoại.")
    grade: int = Field(..., description="Lớp học của học sinh trong session này.")
    message_count: int = Field(..., description="Tổng số tin nhắn trong session.")
    updated_at: datetime = Field(..., description="Thời điểm cập nhật gần nhất.")


class ChatMessage(BaseModel):
    """Một tin nhắn trong lịch sử hội thoại."""

    role: Literal["user", "assistant"] = Field(
        ..., description="Vai trò của người gửi: học sinh hoặc trợ lý."
    )
    content: str = Field(..., description="Nội dung tin nhắn.")
    created_at: datetime | None = Field(
        default=None, description="Thời điểm tin nhắn được tạo."
    )


class ChatSessionDetail(BaseModel):
    """Chi tiết đầy đủ của một session khi người dùng mở lại hội thoại."""

    session_id: str = Field(..., description="ID duy nhất của session.")
    title: str = Field(..., description="Tiêu đề tóm tắt của hội thoại.")
    messages: list[ChatMessage] = Field(
        default_factory=list,
        description="Danh sách tin nhắn theo thứ tự thời gian.",
    )


class CreateSessionResponse(BaseModel):
    """Response trả về khi tạo session hội thoại mới."""

    session_id: str = Field(..., description="ID của session vừa được tạo.")


class DeleteSessionResponse(BaseModel):
    """Response trả về khi xóa một session hội thoại."""

    success: bool = Field(..., description="True nếu session đã được xóa thành công.")


__all__ = [
    "ChatSessionSummary",
    "ChatMessage",
    "ChatSessionDetail",
    "CreateSessionResponse",
    "DeleteSessionResponse",
]