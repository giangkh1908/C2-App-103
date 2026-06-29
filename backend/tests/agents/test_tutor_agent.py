"""
test_tutor_agent.py – Unit tests cho TutorAgent.
"""

from collections.abc import AsyncGenerator
from typing import Any

import pytest

from src.agents.tutor_agent import TutorAgent
from src.llm.base import BaseLLMClient, LLMMessage, LLMResponse, LLMStreamUsage
from src.tools.registry import create_default_tool_registry

_LLM_ANSWER = "Xin chào, mình sẽ giúp bạn học toán."


# ---------------------------------------------------------------------------
# Fake LLM
# ---------------------------------------------------------------------------


class SimpleLLM(BaseLLMClient):
    """Fake LLM luôn trả về một câu trả lời cố định."""

    async def generate(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> LLMResponse:
        return LLMResponse(content=_LLM_ANSWER)

    async def generate_stream(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncGenerator[str | LLMStreamUsage, None]:
        yield _LLM_ANSWER
        yield LLMStreamUsage(prompt_tokens=0, completion_tokens=0)


# ---------------------------------------------------------------------------
# Fixture
# ---------------------------------------------------------------------------


@pytest.fixture
def agent() -> TutorAgent:
    return TutorAgent(llm=SimpleLLM(), tool_registry=create_default_tool_registry())


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_chat_empty_message_returns_prompt(agent: TutorAgent) -> None:
    response = await agent.chat("   ")
    assert "nhập một câu hỏi toán học" in response.answer


@pytest.mark.asyncio
async def test_chat_normal_message_returns_llm_answer(agent: TutorAgent) -> None:
    response = await agent.chat("Dạy em phép nhân", level="L3")
    assert response.answer == _LLM_ANSWER


@pytest.mark.asyncio
async def test_chat_invalid_level_falls_back_without_exception(
    agent: TutorAgent,
) -> None:
    response = await agent.chat("Dạy em phép nhân", level="L9")
    assert response.answer == _LLM_ANSWER
