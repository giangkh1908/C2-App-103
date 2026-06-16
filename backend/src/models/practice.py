from datetime import datetime

from pydantic import BaseModel, Field


class PracticeGradeSummary(BaseModel):
    grade: int = Field(ge=1, le=5)
    exam_count: int = Field(ge=0)


class PracticeExamQuestion(BaseModel):
    question_id: str
    question_text: str
    choices: list[str]
    correct_choice_index: int = Field(ge=0)
    explanation: str


class PracticeExamSummary(BaseModel):
    exam_id: str
    grade: int = Field(ge=1, le=5)
    title: str
    question_count: int = Field(ge=1)
    preview_text: str
    attempt_status: str = "not_started"


class PracticeExamDetail(PracticeExamSummary):
    source: str
    source_row_id: str
    source_split: str
    tags: list[str] = Field(default_factory=list)
    is_active: bool = True
    sort_order: int | None = None
    curation_status: str = "active_curated"
    questions: list[PracticeExamQuestion]


class PracticeAnswerSubmission(BaseModel):
    question_id: str
    selected_choice_index: int | None = Field(default=None, ge=0)


class PracticeAttemptCreateRequest(BaseModel):
    exam_id: str = Field(min_length=1)
    start_mode: str = Field(default="create_new")


class PracticeAttemptCreateResponse(BaseModel):
    attempt_id: str
    started_at: datetime
    exam: PracticeExamDetail


class PracticeAttemptSubmitRequest(BaseModel):
    answers: list[PracticeAnswerSubmission] = Field(default_factory=list)


class PracticeAttemptQuestionResult(BaseModel):
    question_id: str
    question_text: str
    choices: list[str]
    selected_choice_index: int | None = None
    correct_choice_index: int = Field(ge=0)
    is_correct: bool
    explanation: str


class PracticeAttemptResultSummary(BaseModel):
    score: int = Field(ge=0, le=100)
    correct_count: int = Field(ge=0)
    total_count: int = Field(ge=0)
    badge_label: str


class PracticeAttemptResult(BaseModel):
    attempt_id: str
    exam_id: str
    exam_title: str
    grade: int = Field(ge=1, le=5)
    status: str
    started_at: datetime
    updated_at: datetime
    submitted_at: datetime | None = None
    result_summary: PracticeAttemptResultSummary | None = None
    answers: list[PracticeAnswerSubmission] = Field(default_factory=list)
    questions: list[PracticeAttemptQuestionResult] = Field(default_factory=list)


class PracticeAttemptHistoryItem(BaseModel):
    attempt_id: str
    exam_id: str
    exam_title: str
    grade: int = Field(ge=1, le=5)
    status: str
    score: int | None = None
    correct_count: int | None = None
    total_count: int | None = None
    submitted_at: datetime | None = None
    started_at: datetime
    updated_at: datetime


class PracticeAttemptLookupResponse(BaseModel):
    attempt: PracticeAttemptResult | None = None


class PracticeGradesResponse(BaseModel):
    grades: list[PracticeGradeSummary]


class PracticeExamListResponse(BaseModel):
    exams: list[PracticeExamSummary]


class PracticeAttemptHistoryResponse(BaseModel):
    attempts: list[PracticeAttemptHistoryItem]
