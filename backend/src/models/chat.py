from typing import Any, Literal

from pydantic import BaseModel, Field

Topic = Literal[
    "multiplication",
    "division",
    "fraction_basic",
    "perimeter_area_basic",
    "data_representation",
    "addition_subtraction",
    "comparison_numbers",
    "time_clock",
    "measurement_length",
]
Intent = Literal[
    "explain_concept",
    "give_example",
    "compare_or_why",
    "show_visual",
    "change_difficulty",
    "generate_quick_practice",
]
ResponseMode = Literal[
    "explain_only",
    "explain_with_visual",
    "explain_with_visual_and_practice",
    "clarification_needed",
]


class ChatTurnRequest(BaseModel):
    user_id: str | None = None
    session_id: str | None = None
    grade: int = Field(ge=1, le=5)
    message: str = Field(min_length=1)
    selected_topic: Topic | None = None
    curriculum_topic_id: str | None = None
    curriculum_visual_template: str | None = None


class VisualData(BaseModel):
    type: str = "candy"
    primary_count: int = Field(ge=0)
    secondary_count: int = Field(ge=0)
    total_count: float = Field(ge=0)
    groups_label: str
    items_label: str
    config: dict[str, Any] | None = None
    concept_type: str | None = None
    polypad_enabled: bool | None = None
    polypad_mode: str | None = None


class SimulationConfig(BaseModel):
    type: str
    min_x: int
    max_x: int
    min_y: int
    max_y: int
    default_x: int
    default_y: int
    label_x: str
    label_y: str


class PracticeQuestion(BaseModel):
    id: str
    question_text: str
    options: list[str]
    correct_answer_index: int
    success_message: str
    fail_message: str
    hint: str


class VisualCard(BaseModel):
    topic: Topic
    title: str
    short_explanation: str
    life_example: str
    visual_data: VisualData
    simulation_config: SimulationConfig


class ChatTurnResponse(BaseModel):
    session_id: str
    assistant_message: str
    detected_topic: Topic | None = None
    intent: Intent
    response_mode: ResponseMode
    visual_card: VisualCard | None = None
    practice_question: PracticeQuestion | None = None
    follow_up_suggestions: list[str] = Field(default_factory=list)
