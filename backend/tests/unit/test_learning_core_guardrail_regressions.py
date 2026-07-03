from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.agents.schemas import AgentResponse
from src.services.curriculum_adapter import (
    build_curriculum_out_of_scope_message,
    get_prompt_examples_for_grade,
)
from src.services.learning_core import LearningCoreService
from src.services.types import LearningCoreRequest

pytestmark = pytest.mark.skip(reason="Replaced by curriculum scope regression coverage.")


def _build_service(*, chat: AsyncMock | None = None, chat_stream: AsyncMock | None = None):
    tutor_agent = SimpleNamespace()
    if chat is not None:
        tutor_agent.chat = chat
    if chat_stream is not None:
        tutor_agent.chat_stream = chat_stream

    service = LearningCoreService(
        tutor_agent=tutor_agent,
        tool_registry=SimpleNamespace(call=AsyncMock()),
    )
    service.session_repository.get_recent_turns = AsyncMock(return_value=[])
    service.session_repository.get_latest_turn = AsyncMock(return_value=None)
    service.session_repository.save = AsyncMock()
    service.memory_repository.append_turn = AsyncMock()
    service.memory_repository.load_messages = AsyncMock(return_value=[])
    return service


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "message",
    [
        "thời tiết Hà Nội hôm nay",
        "thoi tiet ha noi hom nay",
        "chào cô, thời tiết Hà Nội hôm nay thế nào",
    ],
)
async def test_learning_core_blocks_weather_requests_before_llm_call(message: str) -> None:
    with patch("src.services.learning_core.MemoryRepository") as memory_repository_cls:
        memory_repository_cls.return_value.append_turn = AsyncMock()
        service = _build_service(chat=AsyncMock())

    request = LearningCoreRequest(
        user_id="user-1",
        session_id="session-1",
        grade=3,
        message=message,
    )

    with patch("src.services.learning_core.record_guardrail_block") as record_guardrail_block:
        result = await service.generate(request)

    assert result.response_mode == "clarification_needed"
    assert result.session_metadata.response_source == "fallback"
    assert result.assistant_message == (
        "Cô chuyên hỗ trợ học toán trực quan thôi nhé. "
        "Con hãy hỏi một bài toán hoặc khái niệm toán học."
    )
    assert result.agent_metadata is not None
    assert result.agent_metadata["guardrail"] == "non_math"
    assert result.agent_metadata["guardrail_stage"] == "input"
    assert "3 x 4" not in result.assistant_message
    record_guardrail_block.assert_called_once()
    service.tutor_agent.chat.assert_not_awaited()


@pytest.mark.asyncio
async def test_learning_core_stream_blocks_weather_requests_before_llm_call() -> None:
    with patch("src.services.learning_core.MemoryRepository") as memory_repository_cls:
        memory_repository_cls.return_value.append_turn = AsyncMock()
        service = _build_service(chat_stream=AsyncMock())

    request = LearningCoreRequest(
        user_id="user-1",
        session_id="session-1",
        grade=3,
        message="thời tiết Hà Nội hôm nay",
    )

    with patch("src.services.learning_core.record_guardrail_block") as record_guardrail_block:
        events = []
        async for event in service.generate_stream(request):
            events.append(event)

    assert events[-1][0] == "done"
    assert events[-1][1].response_mode == "clarification_needed"
    assert events[-1][1].agent_metadata["guardrail"] == "non_math"
    record_guardrail_block.assert_called_once()
    service.tutor_agent.chat_stream.assert_not_awaited()


@pytest.mark.asyncio
async def test_learning_core_contextless_message_returns_clarification_without_math_fallback() -> None:
    with patch("src.services.learning_core.MemoryRepository") as memory_repository_cls:
        memory_repository_cls.return_value.append_turn = AsyncMock()
        service = _build_service(
            chat=AsyncMock(return_value=AgentResponse(answer="Minh co the giup con.")),
        )

    result = await service.generate(
        LearningCoreRequest(
            user_id="user-1",
            session_id="session-1",
            grade=3,
            message="Giúp con với",
        )
    )

    assert result.response_mode == "clarification_needed"
    assert result.session_metadata.response_source == "fallback"
    assert result.visual_card is None
    assert result.practice_question_chat is None
    assert result.assistant_message == (
        "Con hãy nói rõ hơn bài toán hoặc chủ đề toán học con muốn học nhé."
    )
    assert result.agent_metadata is not None
    assert result.agent_metadata["context_resolution"] == "missing_topic"
    service.tool_registry.call.assert_not_awaited()
