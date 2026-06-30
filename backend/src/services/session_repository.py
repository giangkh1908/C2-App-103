from datetime import UTC, datetime

from src.core.database import get_db
from src.services.types import LearningPersistencePayload


class SessionRepository:
    @property
    def _collection(self):  # type: ignore[return]
        return get_db().learning_sessions

    async def save(self, payload: LearningPersistencePayload) -> None:
        visual_snapshot = payload.result.visual_card.model_dump() if payload.result.visual_card else None
        practice_snapshot = (
            payload.result.practice_question_chat.model_dump()
            if payload.result.practice_question_chat
            else None
        )
        await self._collection.insert_one(
            {
                "session_id": payload.result.session_metadata.session_id,
                "user_id": payload.request.user_id,
                "grade": payload.request.grade,
                "message": payload.request.message,
                "selected_topic": payload.request.selected_topic,
                "curriculum_topic_id": payload.request.curriculum_topic_id,
                "curriculum_visual_template": payload.request.curriculum_visual_template,
                "detected_topic": payload.result.topic,
                "intent": payload.result.intent,
                "response_mode": payload.result.response_mode,
                "provider": payload.result.session_metadata.provider,
                "response_source": payload.result.session_metadata.response_source,
                "assistant_message": payload.result.assistant_message,
                "lesson_snapshot": payload.lesson_snapshot,
                "chat_snapshot": payload.chat_snapshot.model_dump(),
                "visual_snapshot": visual_snapshot,
                "practice_snapshot": practice_snapshot,
                "created_at": datetime.now(UTC),
            }
        )

    async def get_latest_turn(self, session_id: str, user_id: str) -> dict | None:
        return await self._collection.find_one(
            {"session_id": session_id, "user_id": user_id},
            sort=[("created_at", -1)],
        )

    async def get_recent_turns(
        self,
        session_id: str,
        user_id: str,
        limit: int = 5,
    ) -> list[dict]:
        cursor = self._collection.find(
            {"session_id": session_id, "user_id": user_id},
            sort=[("created_at", -1)],
            limit=limit,
        )
        return await cursor.to_list(length=limit)

    async def list_sessions(self, user_id: str) -> list[dict]:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$sort": {"created_at": 1}},
            {
                "$group": {
                    "_id": "$session_id",
                    "title": {"$first": "$message"},
                    "grade": {"$first": "$grade"},
                    "message_count": {"$sum": 1},
                    "updated_at": {"$last": "$created_at"},
                },
            },
            {
                "$project": {
                    "_id": 0,
                    "session_id": "$_id",
                    "title": 1,
                    "grade": 1,
                    "message_count": 1,
                    "updated_at": 1,
                },
            },
            {"$sort": {"updated_at": -1}},
        ]

        cursor = self._collection.aggregate(pipeline)
        return await cursor.to_list(length=None)

    async def get_session(self, session_id: str, user_id: str) -> dict | None:
        cursor = self._collection.find(
            {"session_id": session_id, "user_id": user_id},
            sort=[("created_at", 1)],
        )
        documents = await cursor.to_list(length=None)

        if not documents:
            return None

        title: str = documents[0].get("message", "")[:60] or "Hoi thoai moi"

        messages: list[dict] = []
        for doc in documents:
            user_content: str = doc.get("message", "")
            assistant_content: str = doc.get("assistant_message", "")
            created_at: datetime | None = doc.get("created_at")
            chat_snapshot: dict = doc.get("chat_snapshot") or {}

            if user_content:
                messages.append(
                    {
                        "role": "user",
                        "content": user_content,
                        "created_at": created_at,
                    }
                )
            if assistant_content:
                messages.append(
                    {
                        "role": "assistant",
                        "content": assistant_content,
                        "created_at": created_at,
                        "detected_topic": doc.get("detected_topic"),
                        "response_mode": chat_snapshot.get("response_mode"),
                        "follow_up_suggestions": chat_snapshot.get("follow_up_suggestions") or [],
                        "visual_card": chat_snapshot.get("visual_card"),
                        "practice_question": chat_snapshot.get("practice_question"),
                    }
                )

        return {
            "session_id": session_id,
            "title": title,
            "messages": messages,
        }

    async def delete_session(self, session_id: str, user_id: str) -> None:
        await self._collection.delete_many({"session_id": session_id, "user_id": user_id})

    async def session_exists(self, session_id: str, user_id: str) -> bool:
        doc = await self._collection.find_one(
            {"session_id": session_id, "user_id": user_id},
            projection={"_id": 1},
        )
        return doc is not None
