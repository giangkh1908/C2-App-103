from fastapi import HTTPException, status

from src.agents.tutor_agent import TutorAgent
from src.core.config import settings
from src.llm.model_router import ModelRouter
from src.services.learning_core import LearningCoreService
from src.services.llm_audit import log_llm_call
from src.tools.registry import create_default_tool_registry

_learning_core_service: LearningCoreService | None = None


def get_learning_core_service() -> LearningCoreService:
    global _learning_core_service

    if _learning_core_service is None:
        if not settings.openrouter_api_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="OPENROUTER_API_KEY is not configured",
            )

        llm = ModelRouter(audit_hook=log_llm_call)
        tool_registry = create_default_tool_registry()
        tutor_agent = TutorAgent(llm=llm, tool_registry=tool_registry)
        _learning_core_service = LearningCoreService(
            tutor_agent=tutor_agent,
            tool_registry=tool_registry,
        )

    return _learning_core_service
