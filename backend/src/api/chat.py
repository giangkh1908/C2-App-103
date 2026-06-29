from fastapi import APIRouter, Depends

from src.agents.chat_orchestrator import TutorChatOrchestrator
from src.core.database import get_db
from src.core.deps import get_current_user
from src.models.chat import ChatTurnRequest, ChatTurnResponse
from src.models.user import UserInDB
from src.services.learning_core import LearningCoreService
from src.services.learning_core_dependency import get_learning_core_service
from src.services.usage_service import UsageService

router = APIRouter(prefix="/chat", tags=["chat"])

_orchestrator: TutorChatOrchestrator | None = None


def get_tutor_chat_orchestrator(
    learning_core_service: LearningCoreService = Depends(get_learning_core_service),
) -> TutorChatOrchestrator:
    global _orchestrator

    if _orchestrator is None or _orchestrator.learning_core_service is not learning_core_service:
        _orchestrator = TutorChatOrchestrator(
            learning_core_service=learning_core_service,
        )

    return _orchestrator


@router.post("/turn", response_model=ChatTurnResponse)
async def chat_turn(
    request: ChatTurnRequest,
    current_user: UserInDB = Depends(get_current_user),
    orchestrator: TutorChatOrchestrator = Depends(get_tutor_chat_orchestrator),
) -> ChatTurnResponse:
    user_id = str(current_user.id)
    db = get_db()
    usage_service = UsageService(db=db)

    # Pre-deduct quota atomically
    has_quota, remaining, limit = await usage_service.check_and_record_usage(user_id, "chat_turns")
    if not has_quota:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error_code": "QUOTA_EXCEEDED",
                "remaining": remaining,
                "limit": limit,
                "message": "Đã hết lượt chat. Vui lòng nâng cấp gói.",
            },
        )

    try:
        response = await orchestrator.handle_turn(request, user_id)
        return response
    except Exception:
        # Refund usage if AI call failed
        await usage_service.refund_usage(user_id, "chat_turns")
        raise
