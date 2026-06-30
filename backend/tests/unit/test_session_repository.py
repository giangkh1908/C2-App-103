from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.models.chat import ChatTurnResponse
from src.services.session_repository import SessionRepository
from src.services.types import (
    LearningCoreRequest,
    LearningCoreResult,
    SessionMetadata,
)


@pytest.mark.asyncio
async def test_session_repository_save_handles_missing_visual_and_practice() -> None:
    collection = SimpleNamespace(insert_one=AsyncMock())

    repository = SessionRepository()

    request = LearningCoreRequest(
        user_id="user-1",
        session_id="session-1",
        grade=3,
        message="Cho con mot vi du phep nhan",
    )
    result = LearningCoreResult(
        topic="multiplication",
        grade=3,
        intent="explain_concept",
        assistant_message="Con co the nhin vao phep nhan nhu nhom deu.",
        title="",
        simple_explanation="Con co the nhin vao phep nhan nhu nhom deu.",
        real_life_example="",
        visual_spec=None,
        simulation_spec=None,
        visual_card=None,
        practice_question_spec=None,
        practice_question_chat=None,
        tts_text="Con co the nhin vao phep nhan nhu nhom deu.",
        response_mode="clarification_needed",
        follow_up_suggestions=[],
        session_metadata=SessionMetadata(
            session_id="session-1",
            provider="openrouter",
            response_source="llm",
        ),
        agent_metadata=None,
    )
    chat_snapshot = ChatTurnResponse(
        session_id="session-1",
        assistant_message=result.assistant_message,
        detected_topic=result.topic,
        intent=result.intent,
        response_mode=result.response_mode,
        visual_card=None,
        practice_question=None,
        follow_up_suggestions=[],
    )

    with patch(
        "src.services.session_repository.get_db",
        return_value=SimpleNamespace(learning_sessions=collection),
    ):
        await repository.save(
            payload=SimpleNamespace(
                request=request,
                result=result,
                lesson_snapshot={},
                chat_snapshot=chat_snapshot,
            )
        )

    saved_document = collection.insert_one.await_args.args[0]
    assert saved_document["visual_snapshot"] is None
    assert saved_document["practice_snapshot"] is None
    assert saved_document["chat_snapshot"]["response_mode"] == "clarification_needed"
