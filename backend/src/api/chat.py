from fastapi import APIRouter, Depends, HTTPException, status

from src.agents.chat_orchestrator import TutorChatOrchestrator
from src.agents.tutor_agent import TutorAgent
from src.core.config import settings
from src.llm.openai_client import OpenAIClient
from src.models.chat import ChatTurnRequest, ChatTurnResponse
from src.tools.registry import create_default_tool_registry

router = APIRouter(prefix="/chat", tags=["chat"])

_orchestrator: TutorChatOrchestrator | None = None


def get_tutor_chat_orchestrator() -> TutorChatOrchestrator:
    global _orchestrator

    if _orchestrator is None:
        if not settings.openai_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OPENAI_API_KEY is not configured",
            )

        llm = OpenAIClient(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
        )
        tool_registry = create_default_tool_registry()
        tutor_agent = TutorAgent(llm=llm, tool_registry=tool_registry)
        _orchestrator = TutorChatOrchestrator(
            tutor_agent=tutor_agent,
            tool_registry=tool_registry,
        )

    return _orchestrator


@router.post("/turn", response_model=ChatTurnResponse)
async def chat_turn(
    request: ChatTurnRequest,
    orchestrator: TutorChatOrchestrator = Depends(get_tutor_chat_orchestrator),
) -> ChatTurnResponse:
    return await orchestrator.handle_turn(request)
