"""
memory_repository.py – Repository quản lý session memory cho AgentLoop.

Lưu trữ lịch sử hội thoại theo session_id vào MongoDB collection
``agent_memory``. Không chứa business logic của agent.
"""

import re
from dataclasses import dataclass
from datetime import UTC, datetime

from src.core.database import get_db

DEFAULT_HISTORY_LIMIT = 10
MAX_MEMORY_MESSAGES = 20
MAX_ASSISTANT_STORE_LEN = 320

# ---------------------------------------------------------------------------
# Data types
# ---------------------------------------------------------------------------


@dataclass(slots=True)
class MemoryMessage:
    """Một message trong lịch sử hội thoại của session."""

    role: str
    content: str


# ---------------------------------------------------------------------------
# Repository
# ---------------------------------------------------------------------------


class MemoryRepository:
    """Quản lý CRUD session memory trong MongoDB collection ``agent_memory``."""

    def __init__(self) -> None:
        db = get_db()
        self._collection = db.agent_memory

    def _clean_and_shorten_message(self, text: str) -> str:
        """Loại bỏ các ký tự emoji/icon và giới hạn độ dài của văn bản."""
        if not text:
            return ""

        # 1. Loại bỏ các emoji thuộc dải bổ sung (Supplementary Planes - Mặt cười, đồ vật, đồ ăn...)
        text = re.sub(r"[\U00010000-\U0010ffff]", "", text)

        # 2. Loại bỏ các biểu tượng/hình vẽ thuộc dải BMP thông dụng (Miscellaneous Symbols & Dingbats)
        text = re.sub(r"[\u2600-\u27BF]", "", text)

        # 3. Loại bỏ khoảng trắng thừa xuất hiện sau khi xóa emoji
        text = re.sub(r" +", " ", text).strip()

        # 4. Rút ngắn văn bản nếu vượt quá giới hạn cấu hình
        if len(text) > MAX_ASSISTANT_STORE_LEN:
            text = text[:MAX_ASSISTANT_STORE_LEN].strip() + "..."

        return text

    async def load_messages(
        self,
        session_id: str,
        limit: int = DEFAULT_HISTORY_LIMIT,
    ) -> list[MemoryMessage]:
        """Tải tối đa ``limit`` message cuối cùng của session.

        Args:
            session_id: ID của session cần tải.
            limit: Số message tối đa trả về, đếm từ cuối danh sách.

        Returns:
            Danh sách :class:`MemoryMessage` theo thứ tự thời gian,
            hoặc list rỗng nếu session chưa tồn tại.
        """
        document = await self._collection.find_one({"session_id": session_id})
        if document is None:
            return []

        messages: list[dict] = document.get("messages", [])
        recent = messages[-limit:] if len(messages) > limit else messages
        return [MemoryMessage(role=m["role"], content=m["content"]) for m in recent]

    async def append_turn(
        self,
        session_id: str,
        user_message: str,
        assistant_message: str,
    ) -> None:
        """Thêm một lượt hội thoại (user + assistant) vào memory của session.

        Tạo document mới nếu session chưa tồn tại.
        Dùng ``$push`` + ``$each`` để tránh load toàn bộ document.

        Args:
            session_id: ID của session.
            user_message: Nội dung tin nhắn của học sinh.
            assistant_message: Nội dung phản hồi của agent.
        """
        cleaned_assistant_message = self._clean_and_shorten_message(assistant_message)
        now = datetime.now(UTC)
        new_messages = [
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": cleaned_assistant_message},
        ]

        await self._collection.update_one(
            {"session_id": session_id},
            {
                "$push": {"messages": {"$each": new_messages}},
                "$set": {"updated_at": now},
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )

    async def clear(self, session_id: str) -> None:
        """Xóa toàn bộ memory của session.

        Args:
            session_id: ID của session cần xóa.
        """
        await self._collection.delete_one({"session_id": session_id})

    async def trim(
        self,
        session_id: str,
        max_messages: int = MAX_MEMORY_MESSAGES,
    ) -> None:
        """Giữ lại tối đa ``max_messages`` message cuối cùng của session.

        Dùng Mongo update với ``$push`` + ``$slice`` để tránh load
        toàn bộ document vào bộ nhớ.

        Args:
            session_id: ID của session cần trim.
            max_messages: Số message tối đa được giữ lại.
        """
        await self._collection.update_one(
            {"session_id": session_id},
            {
                "$push": {
                    "messages": {
                        "$each": [],
                        "$slice": -max_messages,
                    }
                },
                "$set": {"updated_at": datetime.now(UTC)},
            },
        )
