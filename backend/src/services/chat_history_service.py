"""
chat_history_service.py – Service layer cho tính năng Chat History Sidebar.

Nằm giữa API layer và SessionRepository; không truy cập MongoDB trực tiếp.
"""

from uuid import uuid4

from src.models.chat_history import (
    ChatMessage,
    ChatSessionDetail,
    ChatSessionSummary,
    CreateSessionResponse,
    DeleteSessionResponse,
)
from src.services.session_repository import SessionRepository


class ChatHistoryService:
    """Xử lý business logic cho tính năng lịch sử hội thoại."""

    def __init__(
        self,
        session_repository: SessionRepository | None = None,
    ) -> None:
        # Không tạo SessionRepository() ở đây để tránh gọi get_db() lúc import.
        # Repository sẽ được khởi tạo lần đầu khi method được gọi.
        self._session_repository = session_repository

    @property
    def session_repository(self) -> SessionRepository:
        """Lazy accessor — tạo SessionRepository khi method đầu tiên được gọi."""
        if self._session_repository is None:
            self._session_repository = SessionRepository()
        return self._session_repository

    async def list_sessions(self, user_id: str) -> list[ChatSessionSummary]:
        """Trả về danh sách session sắp xếp theo thời gian cập nhật giảm dần.

        Returns:
            List :class:`ChatSessionSummary`, rỗng nếu chưa có session nào.
        """
        documents = await self.session_repository.list_sessions(user_id)

        summaries = [
            ChatSessionSummary(
                session_id=doc["session_id"],
                title=doc.get("title") or doc.get("message", "")[:60] or "Hội thoại mới",
                grade=doc.get("grade", 0),
                message_count=doc.get("message_count", 0),
                updated_at=doc["updated_at"],
            )
            for doc in documents
        ]

        summaries.sort(key=lambda s: s.updated_at, reverse=True)
        return summaries

    async def get_session(
        self,
        session_id: str,
        user_id: str,
    ) -> ChatSessionDetail | None:
        """Lấy chi tiết một session theo session_id.

        Args:
            session_id: ID của session cần lấy.

        Returns:
            :class:`ChatSessionDetail` nếu tồn tại, ``None`` nếu không tìm thấy.
        """
        document = await self.session_repository.get_session(session_id, user_id)
        if document is None:
            return None

        messages = [
            ChatMessage(
                role=msg["role"],
                content=msg["content"],
                created_at=msg.get("created_at"),
            )
            for msg in document.get("messages", [])
        ]

        return ChatSessionDetail(
            session_id=document["session_id"],
            title=document.get("title") or document.get("message", "")[:60] or "Hội thoại mới",
            messages=messages,
        )

    async def create_session(self) -> CreateSessionResponse:
        """Sinh session_id mới. Session sẽ được tạo trong DB khi user gửi tin đầu tiên.

        Returns:
            :class:`CreateSessionResponse` chứa session_id vừa được sinh.
        """
        session_id = uuid4().hex
        return CreateSessionResponse(session_id=session_id)

    async def delete_session(
        self,
        session_id: str,
        user_id: str,
    ) -> DeleteSessionResponse:
        """Xóa session và toàn bộ dữ liệu liên quan.

        Args:
            session_id: ID của session cần xóa.

        Returns:
            :class:`DeleteSessionResponse` với ``success=True``.
        """
        await self.session_repository.delete_session(session_id, user_id)
        return DeleteSessionResponse(success=True)

    async def session_exists(
        self,
        session_id: str,
        user_id: str,
    ) -> bool:
        """Kiểm tra xem session có tồn tại hay không.

        Args:
            session_id: ID của session cần kiểm tra.

        Returns:
            ``True`` nếu session tồn tại, ``False`` nếu không.
        """
        return await self.session_repository.session_exists(session_id, user_id)
