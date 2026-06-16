"""
chat_history.py – REST API cho tính năng Chat History Sidebar.

Cung cấp 4 endpoints để frontend quản lý lịch sử hội thoại.
"""

from fastapi import APIRouter, Depends, HTTPException

from src.core.deps import get_current_user
from src.models.chat_history import (
    ChatSessionDetail,
    ChatSessionSummary,
    CreateSessionResponse,
    DeleteSessionResponse,
)
from src.models.user import UserInDB
from src.services.chat_history_service import ChatHistoryService

router = APIRouter(
    prefix="/chat/history",
    tags=["chat-history"],
)

chat_history_service = ChatHistoryService()


@router.get(
    "",
    response_model=list[ChatSessionSummary],
)
async def list_sessions(
    current_user: UserInDB = Depends(get_current_user),
) -> list[ChatSessionSummary]:
    """Trả về danh sách tất cả session của người dùng, sắp xếp theo thời gian mới nhất."""
    return await chat_history_service.list_sessions(str(current_user.id))


@router.post(
    "/new",
    response_model=CreateSessionResponse,
)
async def create_session(
    current_user: UserInDB = Depends(get_current_user),
) -> CreateSessionResponse:
    """Tạo session_id mới cho hội thoại. Session được persist khi user gửi tin đầu tiên."""
    return await chat_history_service.create_session()


@router.get(
    "/{session_id}",
    response_model=ChatSessionDetail,
)
async def get_session(
    session_id: str,
    current_user: UserInDB = Depends(get_current_user),
) -> ChatSessionDetail:
    """Lấy chi tiết một session bao gồm toàn bộ lịch sử tin nhắn.

    Args:
        session_id: ID của session cần lấy.

    Raises:
        HTTPException: 404 nếu session không tồn tại.
    """
    session = await chat_history_service.get_session(session_id, str(current_user.id))
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete(
    "/{session_id}",
    response_model=DeleteSessionResponse,
)
async def delete_session(
    session_id: str,
    current_user: UserInDB = Depends(get_current_user),
) -> DeleteSessionResponse:
    """Xóa một session và toàn bộ dữ liệu liên quan.

    Args:
        session_id: ID của session cần xóa.

    Raises:
        HTTPException: 404 nếu session không tồn tại.
    """
    user_id = str(current_user.id)
    exists = await chat_history_service.session_exists(session_id, user_id)
    if not exists:
        raise HTTPException(status_code=404, detail="Session not found")
    return await chat_history_service.delete_session(session_id, user_id)
