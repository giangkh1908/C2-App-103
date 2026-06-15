from typing import Literal

from pydantic import BaseModel, Field

from src.models.chat import Topic

VisualType = Literal[
    "equal_groups",
    "sharing",
    "fraction_pizza",
    "perimeter_path",
    "area_grid",
]


class LessonGenerateRequest(BaseModel):
    user_id: str = Field(min_length=1)
    grade: int = Field(ge=1, le=5)
    topic: Topic
    prompt: str = Field(min_length=1)


class LessonVisual(BaseModel):
    visual_type: VisualType
    object: str
    groups: int | None = None
    items_per_group: int | None = None
    total_items: int | None = None
    numerator: int | None = None
    denominator: int | None = None
    length: int | None = None
    width: int | None = None
    unit: str | None = None


class LessonSimulation(BaseModel):
    simulation_type: str
    prompt: str


class LessonPracticeQuestion(BaseModel):
    question: str
    options: list[str]
    correct_answer: str


class LessonResponse(BaseModel):
    topic: Topic
    grade: int
    title: str
    simple_explanation: str
    real_life_example: str
    visual: LessonVisual
    simulation: LessonSimulation
    practice_question: LessonPracticeQuestion
    tts_text: str
