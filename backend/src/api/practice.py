from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.core.deps import get_current_user
from src.models.practice import (
    PracticeAttemptCreateRequest,
    PracticeAttemptCreateResponse,
    PracticeAttemptHistoryResponse,
    PracticeAttemptLookupResponse,
    PracticeAttemptResult,
    PracticeAttemptSubmitRequest,
    PracticeExamDetail,
    PracticeExamListResponse,
    PracticeGradesResponse,
)
from src.models.user import UserInDB
from src.services.practice_service import PracticeService

router = APIRouter(prefix="/practice", tags=["practice"])
practice_service = PracticeService()


@router.get("/grades", response_model=PracticeGradesResponse)
async def list_practice_grades(
    current_user: UserInDB = Depends(get_current_user),
) -> PracticeGradesResponse:
    del current_user
    grades = await practice_service.list_grade_summaries()
    return PracticeGradesResponse(grades=grades)


@router.get("/exams", response_model=PracticeExamListResponse)
async def list_practice_exams(
    grade: int = Query(..., ge=1, le=5),
    current_user: UserInDB = Depends(get_current_user),
) -> PracticeExamListResponse:
    exams = await practice_service.list_exams(grade, user_id=current_user.id)
    return PracticeExamListResponse(exams=exams)


@router.get("/exams/{exam_id}", response_model=PracticeExamDetail)
async def get_practice_exam(
    exam_id: str,
    current_user: UserInDB = Depends(get_current_user),
) -> PracticeExamDetail:
    del current_user
    try:
        return await practice_service.get_exam_detail(exam_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post(
    "/attempts", response_model=PracticeAttemptCreateResponse, status_code=status.HTTP_201_CREATED
)
async def create_practice_attempt(
    request: PracticeAttemptCreateRequest,
    current_user: UserInDB = Depends(get_current_user),
) -> PracticeAttemptCreateResponse:
    try:
        return await practice_service.create_attempt(
            current_user.id, request.exam_id, request.start_mode
        )
    except ValueError as exc:
        detail = str(exc)
        status_code = (
            status.HTTP_404_NOT_FOUND
            if "not found" in detail.lower()
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=detail)


@router.get("/attempts/in-progress", response_model=PracticeAttemptLookupResponse)
async def get_in_progress_practice_attempt(
    exam_id: str = Query(..., min_length=1),
    current_user: UserInDB = Depends(get_current_user),
) -> PracticeAttemptLookupResponse:
    attempt = await practice_service.get_in_progress_attempt(current_user.id, exam_id)
    return PracticeAttemptLookupResponse(attempt=attempt)


@router.patch("/attempts/{attempt_id}/draft", response_model=PracticeAttemptResult)
async def save_practice_attempt_draft(
    attempt_id: str,
    request: PracticeAttemptSubmitRequest,
    current_user: UserInDB = Depends(get_current_user),
) -> PracticeAttemptResult:
    try:
        return await practice_service.save_draft(current_user.id, attempt_id, request.answers)
    except ValueError as exc:
        detail = str(exc)
        status_code = (
            status.HTTP_404_NOT_FOUND
            if "not found" in detail.lower()
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=detail)


@router.post("/attempts/{attempt_id}/submit", response_model=PracticeAttemptResult)
async def submit_practice_attempt(
    attempt_id: str,
    request: PracticeAttemptSubmitRequest,
    current_user: UserInDB = Depends(get_current_user),
) -> PracticeAttemptResult:
    try:
        return await practice_service.submit_attempt(current_user.id, attempt_id, request.answers)
    except ValueError as exc:
        detail = str(exc)
        status_code = (
            status.HTTP_404_NOT_FOUND
            if "not found" in detail.lower()
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=detail)


@router.get("/attempts", response_model=PracticeAttemptHistoryResponse)
async def list_practice_attempts(
    current_user: UserInDB = Depends(get_current_user),
) -> PracticeAttemptHistoryResponse:
    attempts = await practice_service.list_attempts(current_user.id)
    return PracticeAttemptHistoryResponse(attempts=attempts)


@router.get("/attempts/{attempt_id}", response_model=PracticeAttemptResult)
async def get_practice_attempt(
    attempt_id: str,
    current_user: UserInDB = Depends(get_current_user),
) -> PracticeAttemptResult:
    try:
        return await practice_service.get_attempt_detail(current_user.id, attempt_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
