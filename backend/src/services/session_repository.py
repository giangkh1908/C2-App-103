"""
session_repository.py – Repository layer cho learning_sessions collection.

KHÔNG sửa schema Mongo hiện tại, KHÔNG sửa method save().
Chỉ bổ sung các method phục vụ Chat History Sidebar.
"""

from datetime import datetime, timezone

from src.core.database import get_db
from src.services.types import LearningPersistencePayload


class SessionRepository:
    @property
    def _collection(self):  # type: ignore[return]
        """Lazy accessor — get_db() chỉ được gọi khi app đã khởi động xong."""
        return get_db().learning_sessions

    async def save(self, payload: LearningPersistencePayload) -> None:
        """Lưu một lượt chat vào collection learning_sessions."""
        await self._collection.insert_one(
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

    # -------------------------------------------------------------------------
    # Chat History Sidebar methods
    # -------------------------------------------------------------------------

    async def get_latest_turn(self, session_id: str) -> dict | None:
            """Lấy lượt hội thoại gần nhất của session_id để kế thừa ngữ cảnh chủ đề và hình ảnh."""
            return await self._collection.find_one(
                {"session_id": session_id},
                sort=[("created_at", -1)],
            )

    async def list_sessions(self) -> list[dict]:
        """Lấy danh sách session duy nhất, group theo session_id.

        Mỗi item chứa session_id, title (message đầu tiên), grade,
        message_count và updated_at (created_at mới nhất).
        Kết quả sắp xếp theo updated_at giảm dần.

        Returns:
            List of dicts với các key:
            session_id, title, grade, message_count, updated_at.
        """
        pipeline = [
            {
                "$sort": {"created_at": 1},
            },
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
            {
                "$sort": {"updated_at": -1},
            },
        ]

        cursor = self._collection.aggregate(pipeline)
        return await cursor.to_list(length=None)

    async def get_session(self, session_id: str) -> dict | None:
        """Lấy toàn bộ lịch sử hội thoại của một session.

        Mỗi document Mongo tương ứng với một lượt (user message + assistant
        message), nên được expand thành 2 ChatMessage entries.

        Args:
            session_id: ID của session cần lấy.

        Returns:
            Dict với keys session_id, title, messages;
            hoặc ``None`` nếu session không tồn tại.
        """
        cursor = self._collection.find(
            {"session_id": session_id},
            sort=[("created_at", 1)],
        )
        documents = await cursor.to_list(length=None)

        if not documents:
            return None

        title: str = documents[0].get("message", "")[:60] or "Hội thoại mới"

        messages: list[dict] = []
        for doc in documents:
            user_content: str = doc.get("message", "")
            assistant_content: str = doc.get("assistant_message", "")
            created_at: datetime | None = doc.get("created_at")

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
                    }
                )

        return {
            "session_id": session_id,
            "title": title,
            "messages": messages,
        }

    async def delete_session(self, session_id: str) -> None:
        """Xóa toàn bộ documents thuộc session khỏi collection.

        Args:
            session_id: ID của session cần xóa.
        """
        await self._collection.delete_many({"session_id": session_id})

    async def session_exists(self, session_id: str) -> bool:
        """Kiểm tra xem session có ít nhất một document trong collection.

        Args:
            session_id: ID của session cần kiểm tra.

        Returns:
            ``True`` nếu tồn tại, ``False`` nếu không.
        """
        doc = await self._collection.find_one(
            {"session_id": session_id},
            projection={"_id": 1},
        )
        return doc is not None