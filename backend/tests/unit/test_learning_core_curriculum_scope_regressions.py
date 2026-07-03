from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.agents.schemas import AgentResponse
from src.services.curriculum_adapter import (
    build_curriculum_out_of_scope_message,
    build_curriculum_scope_redirect_message,
    get_prompt_examples_for_grade,
    get_prompt_examples_for_curriculum_topic,
)
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
@pytest.mark.parametrize("grade", [1, 2])
async def test_learning_core_blocks_out_of_curriculum_requests_before_llm_call(
    grade: int,
) -> None:
    with patch("src.services.learning_core.MemoryRepository") as memory_repository_cls:
        memory_repository_cls.return_value.append_turn = AsyncMock()
        service = _build_service(chat=AsyncMock())

    result = await service.generate(
        LearningCoreRequest(
            user_id="user-1",
            session_id="session-1",
            grade=grade,
            message="Thoi tiet Ha Noi hom nay",
        )
    )

    assert result.response_mode == "clarification_needed"
    assert result.session_metadata.response_source == "fallback"
    assert result.assistant_message == build_curriculum_out_of_scope_message(grade)
    assert result.follow_up_suggestions == get_prompt_examples_for_grade(grade)
    assert result.agent_metadata is not None
    assert result.agent_metadata["scope_status"] == "out_of_curriculum"
    service.tutor_agent.chat.assert_not_awaited()


@pytest.mark.asyncio
async def test_learning_core_stream_blocks_out_of_curriculum_requests_before_llm_call() -> None:
    with patch("src.services.learning_core.MemoryRepository") as memory_repository_cls:
        memory_repository_cls.return_value.append_turn = AsyncMock()
        service = _build_service(chat_stream=AsyncMock())

    events = []
    async for event in service.generate_stream(
        LearningCoreRequest(
            user_id="user-1",
            session_id="session-1",
            grade=1,
            message="Thoi tiet Ha Noi hom nay",
        )
    ):
        events.append(event)

    assert events[-1][0] == "done"
    assert events[-1][1].assistant_message == build_curriculum_out_of_scope_message(1)
    assert events[-1][1].agent_metadata["scope_status"] == "out_of_curriculum"
    service.tutor_agent.chat_stream.assert_not_awaited()


@pytest.mark.asyncio
async def test_learning_core_redirects_other_curriculum_topic_for_selected_lesson() -> None:
    with patch("src.services.learning_core.MemoryRepository") as memory_repository_cls:
        memory_repository_cls.return_value.append_turn = AsyncMock()
        service = _build_service(chat=AsyncMock())

    result = await service.generate(
        LearningCoreRequest(
            user_id="user-1",
            session_id="session-1",
            grade=1,
            message="Giai thich 24 + 13 bang que tinh",
            curriculum_topic_id="G1-GEO-02",
        )
    )

    assert result.response_mode == "clarification_needed"
    assert result.assistant_message == build_curriculum_scope_redirect_message("G1-GEO-02")
    assert result.follow_up_suggestions == get_prompt_examples_for_curriculum_topic("G1-GEO-02")
    assert result.agent_metadata is not None
    assert result.agent_metadata.get("scope_status") != "out_of_curriculum"
    service.tutor_agent.chat.assert_not_awaited()


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
