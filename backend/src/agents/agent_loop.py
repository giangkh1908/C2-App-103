"""
agent_loop.py – Agent loop đơn giản: LLM gọi tool nếu cần, rồi trả lời cuối.

Không chứa rule-based parsing, không gọi API endpoint trực tiếp.
"""

import json
from typing import Any

from .schemas import AgentResponse, AgentRunConfig, AgentStep, ToolCall, ToolObservation
from .prompts import build_tutor_system_prompt
from src.llm.base import BaseLLMClient, LLMMessage
from src.tools.registry import ToolRegistry


class AgentLoop:
    """Điều phối vòng lặp LLM ↔ tool cho một câu hỏi của học sinh."""

    def __init__(self, llm: BaseLLMClient, tool_registry: ToolRegistry) -> None:
        self.llm = llm
        self.tool_registry = tool_registry

    async def run(
        self,
        user_message: str,
        config: AgentRunConfig | None = None,
    ) -> AgentResponse:
        """Chạy agent loop và trả về câu trả lời cuối cùng.

        Args:
            user_message: Câu hỏi hoặc yêu cầu của học sinh.
            config: Cấu hình chạy agent; dùng giá trị mặc định nếu ``None``.

        Returns:
            :class:`AgentResponse` chứa câu trả lời và danh sách các bước
            trung gian (tool calls + observations).
        """
        if config is None:
            config = AgentRunConfig()

        messages: list[LLMMessage] = [
            LLMMessage(role="system", content=build_tutor_system_prompt(config.level)),
            LLMMessage(role="user", content=user_message),
        ]

        tools: list[dict[str, Any]] | None = (
            self.tool_registry.list_tool_schemas() if config.use_tools else None
        )

        steps: list[AgentStep] = []
        last_observation: ToolObservation | None = None
        last_tool_name: str | None = None

        for _ in range(config.max_steps):
            try:
                llm_response = await self.llm.generate(messages=messages, tools=tools)
            except Exception:
                return AgentResponse(
                    answer="Hiện tại mình chưa xử lý được câu hỏi này. Bạn thử hỏi lại ngắn hơn nhé.",
                    steps=steps,
                )

            # ----------------------------------------------------------------
            # Nhánh tool call
            # ----------------------------------------------------------------
            if llm_response.tool_call:
                raw_tc = llm_response.tool_call
                tool_call = ToolCall(
                    name=raw_tc.name,
                    arguments=raw_tc.arguments,
                )

                tool_result = await self.tool_registry.call(tool_call.name, tool_call.arguments)

                observation = ToolObservation(
                    tool_name=tool_call.name,
                    success=tool_result.success,
                    data=tool_result.data,
                    message=tool_result.message,
                    error=tool_result.error,
                )

                steps.append(
                    AgentStep(
                        step_index=len(steps) + 1,
                        tool_call=tool_call,
                        observation=observation,
                    )
                )
                
                last_observation = observation
                last_tool_name = tool_call.name

                # Thêm assistant message mô tả tool call
                messages.append(
                    LLMMessage(
                        role="assistant",
                        content=(
                            f"Mình sẽ dùng công cụ «{tool_call.name}» với tham số: "
                            f"{json.dumps(tool_call.arguments, ensure_ascii=False)}."
                        ),
                    )
                )

                # Thêm kết quả tool để LLM dùng cho bước tiếp theo
                messages.append(
                    LLMMessage(
                        role="user",
                        content=(
                            f"Kết quả từ công cụ {tool_call.name}: "
                            f"{json.dumps(observation.data, ensure_ascii=False)}"
                        ),
                    )
                )

                continue  # tiếp tục vòng lặp để LLM sinh câu trả lời cuối

            # ----------------------------------------------------------------
            # Nhánh final answer (không có tool call)
            # ----------------------------------------------------------------
            content: str = llm_response.content or ""

            visual_data: dict[str, Any] | None = None
            if (
                last_observation is not None
                and isinstance(last_observation.data, dict)
                and last_observation.data.get("type")
            ):
                visual_data = last_observation.data

            return AgentResponse(
                answer=content,
                steps=steps,
                tool_used=last_tool_name,
                visual_data=visual_data,
            )

        # --------------------------------------------------------------------
        # Hết max_steps mà chưa có final answer
        # --------------------------------------------------------------------
        return AgentResponse(
            answer="Mình đã thử xử lý bài toán nhưng cần thêm thông tin để giải thích rõ hơn.",
            steps=steps,
        )