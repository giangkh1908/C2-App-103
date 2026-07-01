"""
test_agent_loop.py – Unit tests cho AgentLoop với fake LLM.
"""

from collections.abc import AsyncGenerator
from typing import Any

import pytest

from src.agents.agent_loop import AgentLoop
from src.agents.schemas import AgentRunConfig
from src.llm.base import BaseLLMClient, LLMMessage, LLMResponse, LLMStreamUsage, LLMToolCall
from src.tools.registry import create_default_tool_registry

# ---------------------------------------------------------------------------
# Fake LLM – luôn trả về final answer ngay lập tức
# ---------------------------------------------------------------------------


class FinalAnswerLLM(BaseLLMClient):
    """Fake LLM ghi lại input và trả về câu trả lời cố định."""

    def __init__(self) -> None:
        self.last_messages: list[LLMMessage] = []
        self.last_tools: list[dict[str, Any]] | None = None

    async def generate(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> LLMResponse:
        self.last_messages = messages
        self.last_tools = tools
        return LLMResponse(content="Câu trả lời cuối cùng")

    async def generate_stream(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncGenerator[str | LLMToolCall | LLMStreamUsage, None]:
        yield "Câu trả lời cuối cùng"
        yield LLMStreamUsage(prompt_tokens=0, completion_tokens=0)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_agent_loop_final_answer_no_tool_call() -> None:
    fake_llm = FinalAnswerLLM()
    registry = create_default_tool_registry()
    loop = AgentLoop(llm=fake_llm, tool_registry=registry)

    response = await loop.run(
        "Dạy em 3 x 4",
        AgentRunConfig(level="L3", use_tools=True),
    )

    # Câu trả lời đúng
    assert response.answer == "Câu trả lời cuối cùng"

    # Không có tool call nào xảy ra
    assert response.steps == []

    # LLM nhận đúng toàn bộ tool schemas đã đăng ký (không lọc theo topic)
    assert fake_llm.last_tools is not None
    assert len(fake_llm.last_tools) == 8

    # Messages gồm ít nhất system + user
    assert len(fake_llm.last_messages) >= 2
    assert fake_llm.last_messages[0].role == "system"
    assert fake_llm.last_messages[1].role == "user"
    assert fake_llm.last_messages[1].content == "Dạy em 3 x 4"


# ---------------------------------------------------------------------------
# Fake LLM – gọi tool lần đầu, trả final answer lần hai
# ---------------------------------------------------------------------------

_FINAL_ANSWER = "Có 3 nhóm, mỗi nhóm 4 viên kẹo, vậy có 12 viên kẹo."


class ToolThenFinalLLM(BaseLLMClient):
    """Fake LLM: lần 1 yêu cầu tool call, lần 2 trả câu trả lời cuối."""

    def __init__(self) -> None:
        self.call_count: int = 0
        self.messages_history: list[list[LLMMessage]] = []

    async def generate(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> LLMResponse:
        self.call_count += 1
        self.messages_history.append(list(messages))

        if self.call_count == 1:
            return LLMResponse(
                tool_call=LLMToolCall(
                    name="candy_multiplication",
                    arguments={"groups": 3, "items_per_group": 4},
                )
            )

        return LLMResponse(content=_FINAL_ANSWER)

    async def generate_stream(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncGenerator[str | LLMToolCall | LLMStreamUsage, None]:
        yield _FINAL_ANSWER
        yield LLMStreamUsage(prompt_tokens=0, completion_tokens=0)


# ---------------------------------------------------------------------------
# Test – tool call rồi final answer
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_agent_loop_tool_then_final_answer() -> None:
    fake_llm = ToolThenFinalLLM()
    registry = create_default_tool_registry()
    loop = AgentLoop(llm=fake_llm, tool_registry=registry)

    response = await loop.run(
        "Dạy em 3 x 4 bằng kẹo",
        AgentRunConfig(level="L3", use_tools=True),
    )

    # Câu trả lời cuối đúng
    assert response.answer == _FINAL_ANSWER

    # Metadata tool
    assert response.tool_used == "candy_multiplication"

    # Visual data hợp lệ
    assert response.visual_data is not None
    assert response.visual_data["type"] == "candy_multiplication"
    assert response.visual_data["total"] == 12

    # Đúng 1 step
    assert len(response.steps) == 1

    step = response.steps[0]
    assert step.step_index == 1
    assert step.observation.success is True


# ---------------------------------------------------------------------------
# Fake LLM – gọi tool không tồn tại rồi trả final answer
# ---------------------------------------------------------------------------

_MISSING_TOOL_ANSWER = "Mình chưa có công cụ phù hợp cho bài này."


class MissingToolThenFinalLLM(BaseLLMClient):
    """Fake LLM: lần 1 gọi tool không tồn tại, lần 2 trả câu trả lời cuối."""

    def __init__(self) -> None:
        self.call_count: int = 0

    async def generate(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> LLMResponse:
        self.call_count += 1

        if self.call_count == 1:
            return LLMResponse(tool_call=LLMToolCall(name="unknown_tool", arguments={}))

        return LLMResponse(content=_MISSING_TOOL_ANSWER)

    async def generate_stream(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncGenerator[str | LLMToolCall | LLMStreamUsage, None]:
        yield _MISSING_TOOL_ANSWER
        yield LLMStreamUsage(prompt_tokens=0, completion_tokens=0)


# ---------------------------------------------------------------------------
# Test – missing tool
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_agent_loop_missing_tool() -> None:
    fake_llm = MissingToolThenFinalLLM()
    registry = create_default_tool_registry()
    loop = AgentLoop(llm=fake_llm, tool_registry=registry)

    response = await loop.run(
        "Dùng tool không tồn tại",
        AgentRunConfig(level="L3", use_tools=True),
    )

    # Final answer từ LLM sau khi nhận observation lỗi
    assert response.answer == _MISSING_TOOL_ANSWER

    # Có đúng 1 step dù tool fail
    assert len(response.steps) == 1

    observation = response.steps[0].observation
    assert observation.success is False
    assert "not found" in (observation.error or "").lower()


# ---------------------------------------------------------------------------
# Fake LLM – luôn raise exception
# ---------------------------------------------------------------------------


class ErrorLLM(BaseLLMClient):
    """Fake LLM luôn raise RuntimeError."""

    async def generate(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> LLMResponse:
        raise RuntimeError("llm down")

    async def generate_stream(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncGenerator[str | LLMToolCall | LLMStreamUsage, None]:
        raise RuntimeError("llm down")


# ---------------------------------------------------------------------------
# Test – LLM exception
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_agent_loop_llm_exception_returns_fallback() -> None:
    fake_llm = ErrorLLM()
    registry = create_default_tool_registry()
    loop = AgentLoop(llm=fake_llm, tool_registry=registry)

    response = await loop.run(
        "Câu hỏi bất kỳ",
        AgentRunConfig(level="L3", use_tools=True),
    )

    # Fallback message phải chứa một trong hai cụm từ
    answer_lower = response.answer.lower()
    assert "chưa xử lý được" in answer_lower or "thử hỏi lại" in answer_lower

    # Không có step nào vì LLM lỗi ngay lần đầu
    assert response.steps == []


# ---------------------------------------------------------------------------
# Test – allowed_tool_names lọc tool theo topic trước khi đưa cho LLM
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_agent_loop_filters_tools_to_allowed_tool_names() -> None:
    fake_llm = FinalAnswerLLM()
    registry = create_default_tool_registry()
    loop = AgentLoop(llm=fake_llm, tool_registry=registry)

    await loop.run(
        "5 + 3 bằng mấy",
        AgentRunConfig(level="L3", use_tools=True, allowed_tool_names=["addition_subtraction"]),
    )

    assert fake_llm.last_tools is not None
    assert [tool["function"]["name"] for tool in fake_llm.last_tools] == ["addition_subtraction"]


@pytest.mark.asyncio
async def test_agent_loop_passes_no_tools_when_allowed_tool_names_empty() -> None:
    fake_llm = FinalAnswerLLM()
    registry = create_default_tool_registry()
    loop = AgentLoop(llm=fake_llm, tool_registry=registry)

    await loop.run(
        "Dạy con toán",
        AgentRunConfig(level="L3", use_tools=True, allowed_tool_names=[]),
    )

    assert fake_llm.last_tools is None


@pytest.mark.asyncio
async def test_agent_loop_ignores_unknown_allowed_tool_names() -> None:
    fake_llm = FinalAnswerLLM()
    registry = create_default_tool_registry()
    loop = AgentLoop(llm=fake_llm, tool_registry=registry)

    await loop.run(
        "Câu hỏi bất kỳ",
        AgentRunConfig(level="L3", use_tools=True, allowed_tool_names=["not_a_real_tool"]),
    )

    assert fake_llm.last_tools is None
