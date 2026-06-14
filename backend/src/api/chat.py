from fastapi import APIRouter, Depends

from src.agents.chat_orchestrator import TutorChatOrchestrator
from src.models.chat import ChatTurnRequest, ChatTurnResponse
from src.services.learning_core import LearningCoreService
from src.services.learning_core_dependency import get_learning_core_service

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
    orchestrator: TutorChatOrchestrator = Depends(get_tutor_chat_orchestrator),
) -> ChatTurnResponse:
    return await orchestrator.handle_turn(request)
