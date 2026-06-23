"""agent_loop.py – Agent loop đơn giản: LLM gọi tool nếu cần, rồi trả lờ
cuối.

Không chứa rule-based parsing, không gọi API endpoint trực tiếp.
"""

from __future__ import annotations

import json
from collections.abc import AsyncGenerator
from typing import Any

from src.core.config import settings as app_settings
from src.core.langfuse import (
    generation_observation,
    span_observation,
    trace_observation,
)
from src.core.logging import get_logger
from src.core.metrics import record_tool_call
from src.llm.base import BaseLLMClient, LLMMessage, LLMToolCall
from src.tools.registry import ToolRegistry

from .prompts import build_tutor_system_prompt
from .schemas import AgentResponse, AgentRunConfig, AgentStep, ToolCall, ToolObservation

logger = get_logger("toan_truc_quan.agents.agent_loop")


class AgentLoop:
    """Điều phối vòng lặp LLM ↔ tool cho một câu hỏi của học sinh."""

    def __init__(self, llm: BaseLLMClient, tool_registry: ToolRegistry) -> None:
        self.llm = llm
        self.tool_registry = tool_registry

    async def run(
        self,
        user_message: str,
        config: AgentRunConfig | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> AgentResponse:
        """Chạy agent loop và trả về câu trả lờ cuối cùng.

        Args:
            user_message: Câu hỏi hoặc yêu cầu của học sinh.
            config: Cấu hình chạy agent; dùng giá trị mặc định nếu ``None``.
            history: Lịch sử cuộc trò chuyện dưới dạng danh sách các dictionary.

        Returns:
            :class:`AgentResponse` chứa câu trả lờ và danh sách các bước
            trung gian (tool calls + observations).
        """
        if config is None:
            config = AgentRunConfig()

        history_messages = []
        if history:
            for msg in history:
                history_messages.append(
                    LLMMessage(role=msg["role"], content=msg["content"])
                )

        messages: list[LLMMessage] = [
            LLMMessage(role="system", content=build_tutor_system_prompt(config.level)),
            *history_messages,
            LLMMessage(role="user", content=user_message),
        ]

        tools: list[dict[str, Any]] | None = (
            self.tool_registry.list_tool_schemas() if config.use_tools else None
        )

        steps: list[AgentStep] = []
        last_observation: ToolObservation | None = None
        last_tool_name: str | None = None

        # Langfuse is optional: if unavailable, trace remains None and we
        # skip all observation calls.
        trace = trace_observation(
            "agent_loop",
            metadata={"level": config.level, "max_steps": config.max_steps},
        )
        agent_span = span_observation(trace, "agent_loop_run")

        for _ in range(config.max_steps):
            try:
                if app_settings.langfuse_capture_content:
                    gen_input = [{"role": m.role, "content": m.content} for m in messages]
                else:
                    gen_input = [
                        {"role": m.role, "content_length": len(m.content)} for m in messages
                    ]
                gen = generation_observation(
                    agent_span or trace,
                    name="llm_generate",
                    input_messages=gen_input,
                )
                llm_response = await self.llm.generate(messages=messages, tools=tools)
                if gen is not None:
                    try:
                        model = llm_response.raw.get("model") if llm_response.raw else None
                        if app_settings.langfuse_capture_content:
                            lf_output = llm_response.content or ""
                        else:
                            lf_output = None
                        tool_name = (
                            llm_response.tool_call.name
                            if llm_response.tool_call
                            else None
                        )
                        gen.end(
                            output=lf_output,
                            metadata={
                                "has_tool_call": llm_response.tool_call is not None,
                                "tool_name": tool_name,
                            },
                            usage=llm_response.raw.get("usage") if llm_response.raw else None,
                            model=model,
                        )
                    except Exception:
                        pass
            except Exception:
                logger.exception("agent_loop_llm_failed", step=len(steps) + 1)
                if agent_span is not None:
                    try:
                        agent_span.end(metadata={"error": "llm_failed"})
                    except Exception:
                        pass
                return AgentResponse(
                    answer=(
                        "Hiện tại mình chưa xử lý được câu hỏi này. "
                        "Bạn thử hỏi lại ngắn hơn nhé."
                    ),
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
                record_tool_call(tool_result.success)

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

                tool_span = span_observation(
                    agent_span or trace,
                    f"tool_call:{tool_call.name}",
                    metadata={
                        "tool_name": tool_call.name,
                        "tool_arg_keys": list(tool_call.arguments.keys()),
                        "success": observation.success,
                    },
                )
                if tool_span is not None:
                    try:
                        tool_span.end()
                    except Exception:
                        pass

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

                continue  # tiếp tục vòng lặp để LLM sinh câu trả lờ cuối

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

            if agent_span is not None:
                try:
                    agent_span.end(
                        metadata={
                            "steps": len(steps),
                            "tool_used": last_tool_name,
                            "has_visual_data": bool(visual_data),
                        }
                    )
                except Exception:
                    pass

            return AgentResponse(
                answer=content,
                steps=steps,
                tool_used=last_tool_name,
                visual_data=visual_data,
            )

        # --------------------------------------------------------------------
        # Hết max_steps mà chưa có final answer
        # --------------------------------------------------------------------
        if agent_span is not None:
            try:
                agent_span.end(metadata={"error": "max_steps_exceeded"})
            except Exception:
                pass

        return AgentResponse(
            answer="Mình đã thử xử lý bài toán nhưng cần thêm thông tin để giải thích rõ hơn.",
            steps=steps,
        )

    async def run_stream(
        self,
        user_message: str,
        config: AgentRunConfig | None = None,
        history: list[dict[str, str]] | None = None,
    ) -> AsyncGenerator[tuple[str, Any], None]:
        """Like run() but streams the final LLM answer token-by-token.

        Yields:
            ``("chunk", str)`` for each text token from the final LLM call.
            ``("done", AgentResponse)`` once the full response is assembled.
        """
        if config is None:
            config = AgentRunConfig()

        history_messages: list[LLMMessage] = []
        if history:
            for msg in history:
                history_messages.append(LLMMessage(role=msg["role"], content=msg["content"]))

        messages: list[LLMMessage] = [
            LLMMessage(role="system", content=build_tutor_system_prompt(config.level)),
            *history_messages,
            LLMMessage(role="user", content=user_message),
        ]

        tools: list[dict[str, Any]] | None = (
            self.tool_registry.list_tool_schemas() if config.use_tools else None
        )

        steps: list[AgentStep] = []
        last_observation: ToolObservation | None = None
        last_tool_name: str | None = None

        for _ in range(config.max_steps):
            full_content = ""
            pending_tool_call: LLMToolCall | None = None

            try:
                async for event in self.llm.generate_stream(messages=messages, tools=tools):
                    if isinstance(event, LLMToolCall):
                        pending_tool_call = event
                    else:
                        full_content += event
                        yield ("chunk", event)
            except Exception:
                logger.exception("agent_loop_stream_failed", step=len(steps) + 1)
                yield (
                    "done",
                    AgentResponse(
                        answer=(
                            "Hiện tại mình chưa xử lý được câu hỏi này. "
                            "Bạn thử hỏi lại ngắn hơn nhé."
                        ),
                        steps=steps,
                    ),
                )
                return

            if pending_tool_call is not None:
                tool_call = ToolCall(
                    name=pending_tool_call.name,
                    arguments=pending_tool_call.arguments,
                )
                tool_result = await self.tool_registry.call(tool_call.name, tool_call.arguments)
                record_tool_call(tool_result.success)

                observation = ToolObservation(
                    tool_name=tool_call.name,
                    success=tool_result.success,
                    data=tool_result.data,
                    message=tool_result.message,
                    error=tool_result.error,
                )
                steps.append(
                    AgentStep(step_index=len(steps) + 1, tool_call=tool_call, observation=observation)
                )
                last_observation = observation
                last_tool_name = tool_call.name

                messages.append(
                    LLMMessage(
                        role="assistant",
                        content=(
                            f"Mình sẽ dùng công cụ «{tool_call.name}» với tham số: "
                            f"{json.dumps(tool_call.arguments, ensure_ascii=False)}."
                        ),
                    )
                )
                messages.append(
                    LLMMessage(
                        role="user",
                        content=(
                            f"Kết quả từ công cụ {tool_call.name}: "
                            f"{json.dumps(observation.data, ensure_ascii=False)}"
                        ),
                    )
                )
                continue

            # Final answer — text was already yielded chunk-by-chunk above
            visual_data: dict[str, Any] | None = None
            if (
                last_observation is not None
                and isinstance(last_observation.data, dict)
                and last_observation.data.get("type")
            ):
                visual_data = last_observation.data

            yield (
                "done",
                AgentResponse(
                    answer=full_content,
                    steps=steps,
                    tool_used=last_tool_name,
                    visual_data=visual_data,
                ),
            )
            return

        yield (
            "done",
            AgentResponse(
                answer="Mình đã thử xử lý bài toán nhưng cần thêm thông tin để giải thích rõ hơn.",
                steps=steps,
            ),
        )
