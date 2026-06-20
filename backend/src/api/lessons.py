from fastapi import APIRouter, Depends

from src.core.database import get_db
from src.core.deps import require_quota
from src.models.lesson import LessonGenerateRequest, LessonResponse
from src.models.user import UserInDB
from src.services.learning_core import LearningCoreService
from src.services.learning_core_dependency import get_learning_core_service
from src.services.response_mapper import to_lesson_response
from src.services.types import LearningCoreRequest
from src.services.usage_service import UsageService

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.post("/generate", response_model=LessonResponse)
async def generate_lesson(
    request: LessonGenerateRequest,
    learning_core_service: LearningCoreService = Depends(get_learning_core_service),
    current_user: UserInDB = Depends(require_quota("chat_turns")),
) -> LessonResponse:
    result = await learning_core_service.generate(
        LearningCoreRequest(
            user_id=str(current_user.id),
            grade=request.grade,
            message=request.prompt,
            selected_topic=request.topic,
        )
    )

    usage_service = UsageService(db=get_db())
    await usage_service.record_usage(str(current_user.id), "chat_turns")

    return to_lesson_response(result)
