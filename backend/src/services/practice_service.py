import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from src.core.database import get_db
from src.models.practice import (
    PracticeAnswerSubmission,
    PracticeAttemptCreateResponse,
    PracticeAttemptHistoryItem,
    PracticeAttemptQuestionResult,
    PracticeAttemptResult,
    PracticeAttemptResultSummary,
    PracticeExamDetail,
    PracticeExamSummary,
    PracticeGradeSummary,
)
from src.services.practice_dataset import (
    ACTIVE_EXAMS_PER_GRADE,
    build_badge,
    build_fallback_explanation,
    get_cached_exam_catalog,
)

logger = logging.getLogger("toan_truc_quan.practice")


class PracticeService:
    def _get_catalog(self):
        return get_cached_exam_catalog()

    async def _get_exam_row(self, exam_id: str, *, active_only: bool) -> dict[str, Any]:
        row = self._get_catalog().get_exam(exam_id, active_only=active_only)
        if not row:
            raise ValueError("Exam not found")
        return row

    async def _find_in_progress_attempt(self, user_id: str, exam_id: str) -> dict[str, Any] | None:
        db = get_db()
        return await db.practice_attempts.find_one(
            {"user_id": user_id, "exam_id": exam_id, "status": "in_progress"},
            {"_id": 0},
        )

    def _build_attempt_result(
        self, row: dict[str, Any], exam: PracticeExamDetail
    ) -> PracticeAttemptResult:
        answer_docs = row.get("answers", [])
        answer_map = {
            answer["question_id"]: answer.get("selected_choice_index") for answer in answer_docs
        }
        result_summary = (
            PracticeAttemptResultSummary(**row["result_summary"])
            if row.get("result_summary")
            else None
        )
        return PracticeAttemptResult(
            attempt_id=row["attempt_id"],
            exam_id=row["exam_id"],
            exam_title=row["exam_title"],
            grade=row["grade"],
            status=row["status"],
            started_at=row["started_at"],
            updated_at=row.get("updated_at", row["started_at"]),
            submitted_at=row.get("submitted_at"),
            result_summary=result_summary,
            answers=[PracticeAnswerSubmission(**answer) for answer in answer_docs],
            questions=[
                PracticeAttemptQuestionResult(
                    question_id=question.question_id,
                    question_text=question.question_text,
                    choices=question.choices,
                    selected_choice_index=answer_map.get(question.question_id),
                    correct_choice_index=question.correct_choice_index,
                    is_correct=answer_map.get(question.question_id)
                    == question.correct_choice_index,
                    explanation=question.explanation
                    or build_fallback_explanation(question.choices[question.correct_choice_index]),
                )
                for question in exam.questions
            ],
        )

    async def list_grade_summaries(self) -> list[PracticeGradeSummary]:
        rows = self._get_catalog().list_grade_summaries()
        return [PracticeGradeSummary(**row) for row in rows]

    async def list_exams(self, grade: int, user_id: str | None = None) -> list[PracticeExamSummary]:
        db = get_db()
        rows = [
            {
                "exam_id": exam["exam_id"],
                "grade": exam["grade"],
                "title": exam["title"],
                "question_count": exam["question_count"],
                "preview_text": exam["preview_text"],
            }
            for exam in self._get_catalog().list_active_exams(grade)
        ][:ACTIVE_EXAMS_PER_GRADE]

        if user_id:
            in_progress = await db.practice_attempts.find(
                {"user_id": user_id, "grade": grade, "status": "in_progress"},
                {"_id": 0, "exam_id": 1},
            ).to_list(length=ACTIVE_EXAMS_PER_GRADE)
            recent_submitted = (
                await db.practice_attempts.find(
                    {"user_id": user_id, "grade": grade, "status": "submitted"},
                    {"_id": 0, "exam_id": 1},
                )
                .sort("submitted_at", -1)
                .to_list(length=ACTIVE_EXAMS_PER_GRADE)
            )
            in_progress_ids = {row["exam_id"] for row in in_progress}
            submitted_ids = {row["exam_id"] for row in recent_submitted}
            for row in rows:
                if row["exam_id"] in in_progress_ids:
                    row["attempt_status"] = "in_progress"
                elif row["exam_id"] in submitted_ids:
                    row["attempt_status"] = "submitted_recently"
                else:
                    row["attempt_status"] = "not_started"

        return [PracticeExamSummary(**row) for row in rows]

    async def get_exam_detail(self, exam_id: str) -> PracticeExamDetail:
        return PracticeExamDetail(**(await self._get_exam_row(exam_id, active_only=True)))

    async def get_exam_detail_for_attempt(self, exam_id: str) -> PracticeExamDetail:
        return PracticeExamDetail(**(await self._get_exam_row(exam_id, active_only=False)))

    async def get_in_progress_attempt(
        self, user_id: str, exam_id: str
    ) -> PracticeAttemptResult | None:
        row = await self._find_in_progress_attempt(user_id, exam_id)
        if not row:
            return None
        exam = await self.get_exam_detail_for_attempt(exam_id)
        return self._build_attempt_result(row, exam)

    async def create_attempt(
        self,
        user_id: str,
        exam_id: str,
        start_mode: str = "create_new",
    ) -> PracticeAttemptCreateResponse:
        exam = await self.get_exam_detail(exam_id)
        db = get_db()
        existing_in_progress = await self._find_in_progress_attempt(user_id, exam_id)

        if start_mode == "resume_existing":
            if existing_in_progress is None:
                raise ValueError("No in-progress attempt found")
            return PracticeAttemptCreateResponse(
                attempt_id=existing_in_progress["attempt_id"],
                started_at=existing_in_progress["started_at"],
                exam=exam,
            )

        if start_mode == "create_new" and existing_in_progress is not None:
            raise ValueError("An in-progress attempt already exists")

        now = datetime.now(timezone.utc)
        if start_mode == "restart" and existing_in_progress is not None:
            await db.practice_attempts.update_one(
                {"attempt_id": existing_in_progress["attempt_id"], "user_id": user_id},
                {"$set": {"status": "abandoned", "updated_at": now}},
            )

        attempt_id = uuid4().hex
        await db.practice_attempts.insert_one(
            {
                "attempt_id": attempt_id,
                "user_id": user_id,
                "exam_id": exam.exam_id,
                "exam_title": exam.title,
                "grade": exam.grade,
                "status": "in_progress",
                "answers": [],
                "result_summary": None,
                "started_at": now,
                "updated_at": now,
                "submitted_at": None,
                "created_at": now,
            }
        )
        logger.info(
            "practice_attempt_created",
            extra={
                "user_id": user_id,
                "exam_id": exam_id,
                "grade": exam.grade,
                "attempt_id": attempt_id,
                "start_mode": start_mode,
            },
        )
        return PracticeAttemptCreateResponse(attempt_id=attempt_id, started_at=now, exam=exam)

    async def save_draft(
        self,
        user_id: str,
        attempt_id: str,
        answers: list[PracticeAnswerSubmission],
    ) -> PracticeAttemptResult:
        db = get_db()
        attempt = await db.practice_attempts.find_one(
            {"attempt_id": attempt_id, "user_id": user_id}
        )
        if not attempt:
            raise ValueError("Attempt not found")
        if attempt["status"] != "in_progress":
            raise ValueError("Only in-progress attempts can be updated")

        exam = await self.get_exam_detail_for_attempt(attempt["exam_id"])
        question_map = {question.question_id: question for question in exam.questions}
        for answer in answers:
            question = question_map.get(answer.question_id)
            if question is None:
                raise ValueError("Submitted question does not belong to this exam")
            if answer.selected_choice_index is not None and answer.selected_choice_index >= len(
                question.choices
            ):
                raise ValueError("Selected choice index is out of range")

        updated_at = datetime.now(timezone.utc)
        answer_docs = [answer.model_dump() for answer in answers]
        await db.practice_attempts.update_one(
            {"attempt_id": attempt_id, "user_id": user_id},
            {"$set": {"answers": answer_docs, "updated_at": updated_at}},
        )
        refreshed = await db.practice_attempts.find_one(
            {"attempt_id": attempt_id, "user_id": user_id}, {"_id": 0}
        )
        if refreshed is None:
            raise ValueError("Attempt not found")
        return self._build_attempt_result(refreshed, exam)

    async def submit_attempt(
        self,
        user_id: str,
        attempt_id: str,
        answers: list[PracticeAnswerSubmission],
    ) -> PracticeAttemptResult:
        db = get_db()
        attempt = await db.practice_attempts.find_one(
            {"attempt_id": attempt_id, "user_id": user_id}
        )
        if not attempt:
            raise ValueError("Attempt not found")
        if attempt["status"] == "submitted":
            return await self.get_attempt_detail(user_id, attempt_id)
        if attempt["status"] != "in_progress":
            raise ValueError("Attempt can no longer be submitted")

        exam = await self.get_exam_detail_for_attempt(attempt["exam_id"])
        question_map = {question.question_id: question for question in exam.questions}
        for answer in answers:
            question = question_map.get(answer.question_id)
            if question is None:
                raise ValueError("Submitted question does not belong to this exam")
            if answer.selected_choice_index is not None and answer.selected_choice_index >= len(
                question.choices
            ):
                raise ValueError("Selected choice index is out of range")

        answer_map = {answer.question_id: answer.selected_choice_index for answer in answers}
        results: list[PracticeAttemptQuestionResult] = []
        correct_count = 0

        for question in exam.questions:
            selected_index = answer_map.get(question.question_id)
            is_correct = selected_index == question.correct_choice_index
            if is_correct:
                correct_count += 1
            explanation = question.explanation or build_fallback_explanation(
                question.choices[question.correct_choice_index]
            )
            results.append(
                PracticeAttemptQuestionResult(
                    question_id=question.question_id,
                    question_text=question.question_text,
                    choices=question.choices,
                    selected_choice_index=selected_index,
                    correct_choice_index=question.correct_choice_index,
                    is_correct=is_correct,
                    explanation=explanation,
                )
            )

        total_count = len(exam.questions)
        score = round((correct_count / total_count) * 100) if total_count else 0
        submitted_at = datetime.now(timezone.utc)
        result_summary = PracticeAttemptResultSummary(
            score=score,
            correct_count=correct_count,
            total_count=total_count,
            badge_label=build_badge(score),
        )
        answer_docs = [answer.model_dump() for answer in answers]
        await db.practice_attempts.update_one(
            {"attempt_id": attempt_id, "user_id": user_id},
            {
                "$set": {
                    "status": "submitted",
                    "answers": answer_docs,
                    "result_summary": result_summary.model_dump(),
                    "submitted_at": submitted_at,
                    "updated_at": submitted_at,
                }
            },
        )
        logger.info(
            "practice_attempt_submitted",
            extra={
                "user_id": user_id,
                "exam_id": exam.exam_id,
                "grade": exam.grade,
                "attempt_id": attempt_id,
                "score": score,
                "submitted_at": submitted_at.isoformat(),
            },
        )
        return PracticeAttemptResult(
            attempt_id=attempt_id,
            exam_id=exam.exam_id,
            exam_title=exam.title,
            grade=exam.grade,
            status="submitted",
            started_at=attempt["started_at"],
            updated_at=submitted_at,
            submitted_at=submitted_at,
            result_summary=result_summary,
            answers=[PracticeAnswerSubmission(**answer) for answer in answer_docs],
            questions=results,
        )

    async def list_attempts(self, user_id: str) -> list[PracticeAttemptHistoryItem]:
        db = get_db()
        rows = (
            await db.practice_attempts.find({"user_id": user_id}, {"_id": 0})
            .sort("updated_at", -1)
            .to_list(length=100)
        )
        history: list[PracticeAttemptHistoryItem] = []
        for row in rows:
            summary = row.get("result_summary") or {}
            history.append(
                PracticeAttemptHistoryItem(
                    attempt_id=row["attempt_id"],
                    exam_id=row["exam_id"],
                    exam_title=row["exam_title"],
                    grade=row["grade"],
                    status=row["status"],
                    score=summary.get("score"),
                    correct_count=summary.get("correct_count"),
                    total_count=summary.get("total_count"),
                    submitted_at=row.get("submitted_at"),
                    started_at=row["started_at"],
                    updated_at=row.get("updated_at", row["started_at"]),
                )
            )
        return history

    async def get_attempt_detail(self, user_id: str, attempt_id: str) -> PracticeAttemptResult:
        db = get_db()
        row = await db.practice_attempts.find_one(
            {"attempt_id": attempt_id, "user_id": user_id}, {"_id": 0}
        )
        if not row:
            raise ValueError("Attempt not found")
        exam = await self.get_exam_detail_for_attempt(row["exam_id"])
        return self._build_attempt_result(row, exam)
