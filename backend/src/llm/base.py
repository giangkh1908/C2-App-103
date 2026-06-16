"""
base.py – Interface chung cho các LLM client (OpenAI, Gemini, …).

Không chứa logic gọi API thật; chỉ định nghĩa contract mà mọi
concrete client phải tuân theo.
"""

from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class LLMMessage(BaseModel):
    """Một message trong cuộc hội thoại với LLM."""

    role: str
    content: str


class LLMToolCall(BaseModel):
    """Thông tin về một tool call mà LLM yêu cầu thực thi."""

    name: str
    arguments: dict[str, Any] = Field(default_factory=dict)


class LLMResponse(BaseModel):
    """Kết quả trả về từ LLM sau mỗi lần generate.

    Một response chứa *hoặc* ``content`` (text thuần) *hoặc*
    ``tool_call`` (yêu cầu gọi tool), không nhất thiết phải có cả hai.
    ``raw`` lưu payload gốc từ provider để debug hoặc audit.
    """

    content: str | None = None
    tool_call: LLMToolCall | None = None
    raw: dict[str, Any] | None = None


# ---------------------------------------------------------------------------
# Abstract client
# ---------------------------------------------------------------------------


class BaseLLMClient(ABC):
    """Interface chung cho mọi LLM client.

    Subclass cụ thể (vd. ``OpenAIClient``, ``GeminiClient``) phải
    implement phương thức ``generate``.
    """

    @abstractmethod
    async def generate(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> LLMResponse:
        """Gửi danh sách message tới LLM và trả về kết quả.

        Args:
            messages: Danh sách message theo role (``system``, ``user``,
                ``assistant``). Thứ tự phần tử phản ánh thứ tự hội thoại.
            tools: Danh sách schema tool theo định dạng function-calling
                của từng provider. Truyền ``None`` nếu không dùng tool.

        Returns:
            :class:`LLMResponse` chứa text content *hoặc* thông tin
            tool call mà model yêu cầu thực thi.
        """