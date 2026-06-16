from src.models.chat import ChatTurnRequest, ChatTurnResponse
from src.services.learning_core import LearningCoreService
from src.services.response_mapper import to_chat_response
from src.services.types import LearningCoreRequest


class TutorChatOrchestrator:
    def __init__(self, learning_core_service: LearningCoreService) -> None:
        self.learning_core_service = learning_core_service

    async def handle_turn(self, request: ChatTurnRequest, user_id: str) -> ChatTurnResponse:
        result = await self.learning_core_service.generate(
            LearningCoreRequest(
                user_id=user_id,
                session_id=request.session_id,
                grade=request.grade,
                message=request.message,
                selected_topic=request.selected_topic,
            )
        )
        return to_chat_response(result)
