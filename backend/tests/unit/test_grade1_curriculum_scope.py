from types import SimpleNamespace
from unittest.mock import AsyncMock
from unittest.mock import patch

import pytest

from src.services.curriculum_adapter import (
    build_curriculum_scope_redirect_message,
    build_grade1_curriculum_result,
    get_prompt_examples_for_curriculum_topic,
    is_curriculum_topic_message_in_scope,
)
from src.services.learning_core import LearningCoreService
from src.services.types import LearningCoreRequest


def test_curriculum_scope_detector_rejects_other_grade1_topic() -> None:
    assert is_curriculum_topic_message_in_scope("G1-GEO-02", "Giải thích 24 + 13 bằng que tính") is False
    assert is_curriculum_topic_message_in_scope("G1-GEO-02", "Nhận biết hình vuông và hình tròn") is True


def test_build_grade1_curriculum_result_keeps_expected_visual() -> None:
    result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=1,
            message="Minh họa 24 + 13 bằng que tính",
            curriculum_topic_id="G1-OPS-01",
        ),
        "session-1",
    )

    assert result is not None
    assert result.visual_card is not None
    assert result.visual_card.visual_data.type == "stick_bundles"
    assert result.visual_spec is not None
    assert result.visual_spec.visual_type == "stick_bundles"
    assert result.practice_question_chat is not None
    assert result.follow_up_suggestions == get_prompt_examples_for_curriculum_topic("G1-OPS-01")


def test_build_grade1_curriculum_result_uses_stick_bundles_for_subtraction() -> None:
    result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=1,
            message="Bớt 15 từ 48 bằng que tính",
            curriculum_topic_id="G1-OPS-01",
        ),
        "session-1",
    )

    assert result is not None
    assert result.visual_card is not None
    assert result.visual_card.visual_data.type == "stick_bundles"
    assert result.visual_spec is not None
    assert result.visual_spec.visual_type == "stick_bundles"


@pytest.mark.asyncio
async def test_learning_core_redirects_when_question_out_of_selected_grade1_lesson() -> None:
    with patch("src.services.learning_core.MemoryRepository") as memory_repository_cls:
        memory_repository_cls.return_value.append_turn = AsyncMock()
        service = LearningCoreService(
            tutor_agent=SimpleNamespace(),
            tool_registry=SimpleNamespace(),
        )

    service.memory_repository.append_turn = AsyncMock()
    service.session_repository.get_latest_turn = AsyncMock(return_value=None)
    service.session_repository.save = AsyncMock()

    request = LearningCoreRequest(
        user_id="user-1",
        session_id="session-1",
        grade=1,
        message="Giải thích 24 + 13 bằng que tính",
        curriculum_topic_id="G1-GEO-02",
    )

    result = await service.generate(request)

    assert result.response_mode == "clarification_needed"
    assert result.visual_card is None
    assert result.practice_question_chat is None
    assert result.assistant_message == build_curriculum_scope_redirect_message("G1-GEO-02")
    assert result.follow_up_suggestions == get_prompt_examples_for_curriculum_topic("G1-GEO-02")


@pytest.mark.asyncio
async def test_learning_core_stream_uses_curriculum_path_for_grade1_comparison() -> None:
    with patch("src.services.learning_core.MemoryRepository") as memory_repository_cls:
        memory_repository_cls.return_value.append_turn = AsyncMock()
        service = LearningCoreService(
            tutor_agent=SimpleNamespace(chat_stream=AsyncMock()),
            tool_registry=SimpleNamespace(),
        )

    service.memory_repository.append_turn = AsyncMock()
    service.session_repository.get_latest_turn = AsyncMock(return_value=None)
    service.session_repository.save = AsyncMock()

    request = LearningCoreRequest(
        user_id="user-1",
        session_id="session-1",
        grade=1,
        message="So sánh 37 và 42",
    )

    events = []
    async for event in service.generate_stream(request):
        events.append(event)

    assert len(events) == 1
    event_type, result = events[0]
    assert event_type == "done"
    assert result.curriculum_topic_id == "G1-NUM-02"
    assert result.visual_card is not None
    assert result.visual_card.visual_data.type == "comparison_visual"
    assert result.visual_card.visual_data.primary_count == 37
    assert result.visual_card.visual_data.secondary_count == 42
