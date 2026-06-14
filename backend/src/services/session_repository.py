from datetime import datetime, timezone

from src.core.database import get_db
from src.services.types import LearningPersistencePayload


class SessionRepository:
    async def save(self, payload: LearningPersistencePayload) -> None:
        db = get_db()
        await db.learning_sessions.insert_one(
            {
                "session_id": payload.result.session_metadata.session_id,
                "user_id": payload.request.user_id,
                "grade": payload.request.grade,
                "message": payload.request.message,
                "selected_topic": payload.request.selected_topic,
                "detected_topic": payload.result.topic,
                "intent": payload.result.intent,
                "response_mode": payload.result.response_mode,
                "provider": payload.result.session_metadata.provider,
                "response_source": payload.result.session_metadata.response_source,
                "assistant_message": payload.result.assistant_message,
                "lesson_snapshot": payload.lesson_snapshot,
                "chat_snapshot": payload.chat_snapshot.model_dump(),
                "visual_snapshot": payload.result.visual_card.model_dump(),
                "practice_snapshot": payload.result.practice_question_chat.model_dump(),
                "created_at": datetime.now(timezone.utc),
            }
        )
