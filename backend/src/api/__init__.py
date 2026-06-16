from fastapi import APIRouter
from src.api.auth import router as auth_router
from src.api.chat import router as chat_router
from src.api.health import router as health_router
from src.api.lessons import router as lessons_router
from src.api.topics import router as topics_router
from src.api.chat_history import router as chat_history_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(chat_router)
api_router.include_router(health_router)
api_router.include_router(lessons_router)
api_router.include_router(topics_router)
api_router.include_router(chat_history_router)
