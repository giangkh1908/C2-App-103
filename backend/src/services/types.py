from typing import Literal

from pydantic import BaseModel, Field

from src.models.chat import (
    ChatTurnResponse,
    Intent,
    PracticeQuestion,
    ResponseMode,
    Topic,
    VisualCard,
)
from src.models.lesson import LessonPracticeQuestion, LessonSimulation, LessonVisual

ResponseSource = Literal["llm", "fallback", "agent"]


class LearningCoreRequest(BaseModel):
    user_id: str = Field(min_length=1)
    grade: int = Field(ge=1, le=5)
    message: str = Field(min_length=1)
    session_id: str | None = None
    selected_topic: Topic | None = None
    curriculum_topic_id: str | None = None
    curriculum_visual_template: str | None = None


class LearningContext(BaseModel):
    topic: Topic | None = None
    intent: Intent = "explain_concept"
    tool_name: str | None = None
    tool_args: dict[str, int | str] = Field(default_factory=dict)
    visual_type: str | None = None


class SessionMetadata(BaseModel):
    session_id: str
    provider: str
    response_source: ResponseSource


class LearningCoreResult(BaseModel):
    topic: Topic
    curriculum_topic_id: str | None = None
    grade: int
    intent: Intent
    assistant_message: str
    title: str
    simple_explanation: str
    real_life_example: str
    visual_spec: LessonVisual | None = None
    simulation_spec: LessonSimulation | None = None
    visual_card: VisualCard | None = None
    practice_question_spec: LessonPracticeQuestion | None = None
    practice_question_chat: PracticeQuestion | None = None
    tts_text: str
    response_mode: ResponseMode
    follow_up_suggestions: list[str] = Field(default_factory=list)
    session_metadata: SessionMetadata
    agent_metadata: dict | None = None

class LearningPersistencePayload(BaseModel):
    request: LearningCoreRequest
    result: LearningCoreResult
    lesson_snapshot: dict
    chat_snapshot: ChatTurnResponse
