from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.agents.schemas import AgentResponse
from src.services.learning_core import LearningCoreService
from src.services.types import LearningCoreRequest


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
async def test_learning_core_calls_llm_for_grade1_curriculum_path() -> None:
    with patch("src.services.learning_core.MemoryRepository") as memory_repository_cls:
        memory_repository_cls.return_value.append_turn = AsyncMock()
        service = _build_service(
            chat=AsyncMock(
                return_value=AgentResponse(answer="Đây là cách so sánh 37 và 42 cho con.")
            ),
        )

    result = await service.generate(
        LearningCoreRequest(
            user_id="user-1",
            session_id="session-1",
            grade=1,
            message="So sánh 37 và 42",
        )
    )

    assert result.curriculum_topic_id == "G1-NUM-02"
    assert result.visual_card is not None
    assert result.visual_card.visual_data.type == "comparison_visual"
    assert result.assistant_message == "Đây là cách so sánh 37 và 42 cho con."
    assert result.session_metadata.response_source == "llm"
    service.tutor_agent.chat.assert_awaited_once()


@pytest.mark.asyncio
async def test_learning_core_contextless_message_returns_clarification_without_math_fallback() -> (
    None
):
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
            message="Giup con voi",
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
