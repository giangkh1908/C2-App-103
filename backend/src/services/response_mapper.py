from src.models.chat import ChatTurnResponse
from src.models.lesson import LessonResponse
from src.services.types import LearningCoreResult


def to_chat_response(result: LearningCoreResult) -> ChatTurnResponse:
    return ChatTurnResponse(
        session_id=result.session_metadata.session_id,
        assistant_message=result.assistant_message,
        detected_topic=result.topic,
        intent=result.intent,
        response_mode=result.response_mode,
        visual_card=result.visual_card,
        practice_question=result.practice_question_chat,
        follow_up_suggestions=result.follow_up_suggestions,
    )


def to_lesson_response(result: LearningCoreResult) -> LessonResponse | None:
    # Clarification responses không có visual/practice data — skip lesson response
    if result.response_mode == "clarification_needed":
        return None
    if (
        result.visual_spec is None
        or result.simulation_spec is None
        or result.practice_question_spec is None
    ):
        return None
    return LessonResponse(
        topic=result.topic,
        grade=result.grade,
        title=result.title,
        simple_explanation=result.simple_explanation,
        real_life_example=result.real_life_example,
        visual=result.visual_spec,
        simulation=result.simulation_spec,
        practice_question=result.practice_question_spec,
        tts_text=result.tts_text,
    )
