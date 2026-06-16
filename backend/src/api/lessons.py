from fastapi import APIRouter, Depends

from src.core.deps import get_current_user
from src.models.lesson import LessonGenerateRequest, LessonResponse
from src.models.user import UserInDB
from src.services.learning_core import LearningCoreService
from src.services.learning_core_dependency import get_learning_core_service
from src.services.response_mapper import to_lesson_response
from src.services.types import LearningCoreRequest

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.post("/generate", response_model=LessonResponse)
async def generate_lesson(
    request: LessonGenerateRequest,
    learning_core_service: LearningCoreService = Depends(get_learning_core_service),
    current_user: UserInDB = Depends(get_current_user),
) -> LessonResponse:
    result = await learning_core_service.generate(
        LearningCoreRequest(
            user_id=str(current_user.id),
            grade=request.grade,
            message=request.prompt,
            selected_topic=request.topic,
        )
    )
    return to_lesson_response(result)
