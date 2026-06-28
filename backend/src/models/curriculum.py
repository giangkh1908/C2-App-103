from pydantic import BaseModel, Field


class CurriculumTopic(BaseModel):
    """A single topic from the Vietnamese elementary math curriculum (GDPT 2018)."""

    topic_id: str = Field(..., description="Unique ID e.g. G3-FRAC-01")
    grade: int = Field(ge=1, le=5)
    strand: str = Field(..., description="Mạch kiến thức e.g. Số và phép tính")
    topic_name: str = Field(..., description="Tên chủ đề")
    content: str = Field(default="", description="Nội dung bài học")
    learning_outcomes: list[str] = Field(default_factory=list)
    visual_templates: list[str] = Field(
        default_factory=list,
        description="Template IDs from the 16 shared visual templates",
    )
    visual_intent: str = Field(default="")
    data_params: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(
        default_factory=list,
        description="Auto-generated Vietnamese keywords for topic detection",
    )
    difficulty: int = Field(ge=1, le=5, default=3)


class CurriculumGradeSummary(BaseModel):
    """Summary of a grade's curriculum topics."""

    grade: int
    topic_count: int
    strands: list[str]


class CurriculumTopicListItem(BaseModel):
    """Lightweight topic info for listing."""

    topic_id: str
    topic_name: str
    strand: str
    visual_templates: list[str]
    difficulty: int
