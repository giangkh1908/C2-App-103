from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.agents.schemas import AgentResponse
from src.services.curriculum_adapter import (
    build_curriculum_out_of_scope_message,
    build_curriculum_scope_redirect_message,
    build_grade1_curriculum_result,
    get_prompt_examples_for_grade,
    get_prompt_examples_for_curriculum_topic,
    is_curriculum_topic_message_in_scope,
    resolve_curriculum_topic_scope,
)
from src.services.learning_core import LearningCoreService
from src.services.types import LearningCoreRequest
from src.tools.registry import create_default_tool_registry


def test_curriculum_scope_detector_rejects_other_grade1_topic() -> None:
    assert (
        is_curriculum_topic_message_in_scope("G1-GEO-02", "Giải thích 24 + 13 bằng que tính")
        is False
    )
    assert (
        is_curriculum_topic_message_in_scope("G1-GEO-02", "Nhận biết hình vuông và hình tròn")
        is True
    )


def test_curriculum_scope_resolves_other_topic_and_out_of_curriculum() -> None:
    assert (
        resolve_curriculum_topic_scope(
            "G1-GEO-02",
            "Giáº£i thÃ­ch 24 + 13 báº±ng que tÃ­nh",
            "G1-OPS-01",
        )
        == "other_curriculum_topic"
    )
    assert (
        resolve_curriculum_topic_scope("G1-GEO-02", "Thá»i tiáº¿t HÃ  Ná»™i hÃ´m nay", None)
        == "out_of_curriculum"
    )


def test_curriculum_scope_out_of_curriculum_message_and_examples() -> None:
    assert build_curriculum_out_of_scope_message(1) == (
        "Cô đang hỗ trợ kiến thức toán lớp 1 thôi nhé. "
        "Con hãy hỏi lại một nội dung đúng trong chương trình toán lớp 1."
    )
    assert get_prompt_examples_for_grade(1) == [
        get_prompt_examples_for_curriculum_topic("G1-NUM-01")[0],
        get_prompt_examples_for_curriculum_topic("G1-NUM-02")[0],
        get_prompt_examples_for_curriculum_topic("G1-OPS-01")[0],
        get_prompt_examples_for_curriculum_topic("G1-OPS-02")[0],
    ]


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
    assert result.visual_card.visual_data.type == "operation_story"
    assert result.visual_spec is not None
    assert result.visual_spec.visual_type == "operation_story"
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
    assert result.visual_card.visual_data.type == "operation_story"
    assert result.visual_spec is not None
    assert result.visual_spec.visual_type == "operation_story"


@pytest.mark.asyncio
async def test_learning_core_redirects_when_question_out_of_selected_grade1_lesson() -> None:
    with patch("src.services.learning_core.MemoryRepository") as memory_repository_cls:
        memory_repository_cls.return_value.append_turn = AsyncMock()
        service = LearningCoreService(
            tutor_agent=SimpleNamespace(),
            tool_registry=SimpleNamespace(),
        )

    service.memory_repository.append_turn = AsyncMock()
    service.session_repository.get_recent_turns = AsyncMock(return_value=[])
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
    service.session_repository.get_recent_turns = AsyncMock(return_value=[])
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


@pytest.mark.asyncio
async def test_learning_core_blocks_out_of_curriculum_grade1_question_before_llm() -> None:
    with patch("src.services.learning_core.MemoryRepository") as memory_repository_cls:
        memory_repository_cls.return_value.append_turn = AsyncMock()
        service = LearningCoreService(
            tutor_agent=SimpleNamespace(chat=AsyncMock()),
            tool_registry=SimpleNamespace(),
        )

    service.memory_repository.append_turn = AsyncMock()
    service.session_repository.get_recent_turns = AsyncMock(return_value=[])
    service.session_repository.get_latest_turn = AsyncMock(return_value=None)
    service.session_repository.save = AsyncMock()

    result = await service.generate(
        LearningCoreRequest(
            user_id="user-1",
            session_id="session-1",
            grade=1,
            message="Thá»i tiáº¿t HÃ  Ná»™i hÃ´m nay",
        )
    )

    assert result.response_mode == "clarification_needed"
    assert result.assistant_message == build_curriculum_out_of_scope_message(1)
    assert result.follow_up_suggestions == get_prompt_examples_for_grade(1)
    assert result.agent_metadata is not None
    assert result.agent_metadata["scope_status"] == "out_of_curriculum"
    service.tutor_agent.chat.assert_not_awaited()


@pytest.mark.asyncio
async def test_learning_core_keeps_addition_topic_after_mental_math_follow_up() -> None:
    """Regression: "3 + 6 bằng mấy" is routed via G1-OPS-02 (tính nhẩm cộng trừ).

    The persisted `topic` for that turn used to be the generic "multiplication"
    bucket, so a follow-up "cho con ví dụ khác" inherited the wrong topic and
    produced a multiplication example instead of another addition example.
    """
    with patch("src.services.learning_core.MemoryRepository") as memory_repository_cls:
        memory_repository_cls.return_value.append_turn = AsyncMock()
        service = LearningCoreService(
            tutor_agent=SimpleNamespace(
                chat=AsyncMock(
                    return_value=AgentResponse(answer="Đây là một ví dụ cộng khác cho con.")
                )
            ),
            tool_registry=create_default_tool_registry(),
        )

    service.memory_repository.append_turn = AsyncMock()
    service.memory_repository.load_messages = AsyncMock(return_value=[])
    service.session_repository.get_recent_turns = AsyncMock(return_value=[])
    service.session_repository.get_latest_turn = AsyncMock(return_value=None)
    service.session_repository.save = AsyncMock()

    first_request = LearningCoreRequest(
        user_id="user-1",
        session_id="session-1",
        grade=1,
        message="3 + 6 bằng mấy",
    )
    first_result = await service.generate(first_request)

    assert first_result.curriculum_topic_id == "G1-OPS-02"
    assert first_result.topic == "addition_subtraction"

    service.session_repository.get_recent_turns = AsyncMock(
        return_value=[
            {
                "detected_topic": first_result.topic,
                "curriculum_topic_id": first_result.curriculum_topic_id,
                "selected_topic": None,
                "visual_snapshot": {
                    "visual_data": first_result.visual_card.visual_data.model_dump()
                },
            }
        ]
    )

    follow_up_request = LearningCoreRequest(
        user_id="user-1",
        session_id="session-1",
        grade=1,
        message="cho con ví dụ khác",
    )
    follow_up_result = await service.generate(follow_up_request)

    assert follow_up_result.topic == "addition_subtraction"
    assert follow_up_result.visual_card is not None
    assert follow_up_result.visual_card.visual_data.type == "operation_story"
