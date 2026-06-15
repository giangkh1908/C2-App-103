"""
tutor_agent.py – Lớp điều phối cấp cao cho agent dạy toán.

Được dùng bởi API layer; không chứa logic endpoint hay test.
"""

from pydantic import ValidationError

from .agent_loop import AgentLoop
from .schemas import AgentResponse, AgentRunConfig
from src.llm.base import BaseLLMClient
from src.tools.registry import ToolRegistry

_FALLBACK_LEVEL = "L3"


class TutorAgent:
    """Agent dạy toán cấp cao, điều phối AgentLoop cho từng lượt hội thoại."""

    def __init__(self, llm: BaseLLMClient, tool_registry: ToolRegistry) -> None:
        self.llm = llm
        self.tool_registry = tool_registry
        self.agent_loop = AgentLoop(llm=llm, tool_registry=tool_registry)

    async def chat(
        self,
        message: str,
        level: str = "L3",
        use_tools: bool = True,
        history: list[dict[str, str]] | None = None,
    ) -> AgentResponse:
        """Xử lý một câu hỏi toán học của học sinh.

        Args:
            message: Câu hỏi hoặc yêu cầu từ học sinh.
            level: Cấp độ học sinh (vd. ``"L1"``, ``"L2"``, ``"L3"``).
                Nếu không hợp lệ sẽ tự động fallback về ``"L3"``.
            use_tools: Cho phép agent dùng tool trực quan hay không.
            history: Lịch sử cuộc trò chuyện truyền xuống AgentLoop.

        Returns:
            :class:`AgentResponse` chứa câu trả lời và các bước trung gian.
        """
        if not message.strip():
            return AgentResponse(
                answer="Bạn hãy nhập một câu hỏi toán học để mình giúp nhé."
            )

        try:
            config = AgentRunConfig(level=level, use_tools=use_tools)
        except ValidationError:
            config = AgentRunConfig(level=_FALLBACK_LEVEL, use_tools=use_tools)

        try:
            return await self.agent_loop.run(user_message=message, config=config, history=history)
        except Exception:
            return AgentResponse(
                answer="Mình gặp lỗi khi xử lý câu hỏi. Bạn thử hỏi lại ngắn hơn nhé."
            )