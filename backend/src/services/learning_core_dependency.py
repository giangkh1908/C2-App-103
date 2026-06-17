from fastapi import HTTPException, status

from src.agents.tutor_agent import TutorAgent
from src.core.config import settings
from src.llm.openrouter_client import OpenRouterClient
from src.services.learning_core import LearningCoreService
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

        llm = OpenRouterClient(
            api_key=settings.openrouter_api_key,
            model=settings.openrouter_model,
            base_url=settings.openrouter_base_url,
            site_url=settings.openrouter_site_url,
            app_name=settings.openrouter_app_name,
            temperature=settings.openrouter_temperature,
            max_tokens=settings.openrouter_max_tokens,
        )
        tool_registry = create_default_tool_registry()
        tutor_agent = TutorAgent(llm=llm, tool_registry=tool_registry)
        _learning_core_service = LearningCoreService(
            tutor_agent=tutor_agent,
            tool_registry=tool_registry,
        )

    return _learning_core_service
