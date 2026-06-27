"""
chat_stream.py – Server-Sent Events endpoint cho streaming chat response.

Gửi các event SSE theo thứ tự:
  status  → thông báo trạng thái xử lý ("Đang gọi AI…", "Đang tính toán…")
  token   → từng chunk text của câu trả lời
  done    → toàn bộ ChatTurnResponse JSON sau khi hoàn chỉnh
  error   → lỗi nếu xảy ra
"""

import asyncio
import json
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from src.agents.chat_orchestrator import TutorChatOrchestrator
from src.api.chat import get_tutor_chat_orchestrator
from src.core.database import get_db
from src.core.deps import get_current_user
from src.core.logging import get_logger
from src.models.chat import ChatTurnRequest
from src.models.user import UserInDB
from src.services.usage_service import UsageService

router = APIRouter(prefix="/chat", tags=["chat"])
logger = get_logger("toan_truc_quan.chat_stream")


def _sse(event: str, data: str) -> str:
    """Format một SSE frame."""
    # Escape newlines trong data để SSE parser không bị lỗi
    safe_data = data.replace("\n", "\\n")
    return f"event: {event}\ndata: {safe_data}\n\n"


async def _stream_chat_turn(
    request: ChatTurnRequest,
    orchestrator: TutorChatOrchestrator,
    user_id: str,
) -> AsyncGenerator[str, None]:
    """Generator sinh các SSE event cho một lượt chat."""

    # ── Bước 1: status – báo hiệu bắt đầu xử lý ──────────────────────────
    yield _sse("status", json.dumps({"message": "Đang phân tích câu hỏi…"}, ensure_ascii=False))
    await asyncio.sleep(0)  # yield control cho event loop

    # ── Bước 2+3: stream token thật từ LLM qua pipeline ──────────────────
    try:
        yield _sse("status", json.dumps({"message": "Đang tạo câu trả lời…"}, ensure_ascii=False))
        await asyncio.sleep(0)

        from src.services.types import LearningCoreRequest
        from src.services.response_mapper import to_chat_response

        chat_response = None
        async for event_type, payload in orchestrator.learning_core_service.generate_stream(
            LearningCoreRequest(
                user_id=user_id,
                session_id=request.session_id,
                grade=request.grade,
                message=request.message,
                selected_topic=request.selected_topic,
                curriculum_topic_id=request.curriculum_topic_id,
                curriculum_visual_template=request.curriculum_visual_template,
            )
        ):
            if event_type == "chunk":
                yield _sse("token", json.dumps({"text": payload}, ensure_ascii=False))
            elif event_type == "done":
                chat_response = to_chat_response(payload)

    except Exception:
        yield _sse(
            "error",
            json.dumps(
                {"message": "Mình gặp lỗi khi xử lý câu hỏi. Bạn thử hỏi lại ngắn hơn nhé."},
                ensure_ascii=False,
            ),
        )
        return

    if chat_response is None:
        yield _sse(
            "error",
            json.dumps(
                {"message": "Mình gặp lỗi khi xử lý câu hỏi. Bạn thử hỏi lại ngắn hơn nhé."},
                ensure_ascii=False,
            ),
        )
        return

    # ── Bước 4: done – gửi toàn bộ payload để frontend render visual/practice
    yield _sse("done", chat_response.model_dump_json())


@router.post("/stream")
async def chat_stream(
    request: ChatTurnRequest,
    orchestrator: TutorChatOrchestrator = Depends(get_tutor_chat_orchestrator),
    current_user: UserInDB = Depends(get_current_user),
) -> StreamingResponse:
    """Streaming SSE endpoint. Pre-deducts quota before calling AI."""
    user_id = str(current_user.id)
    db = get_db()
    usage_service = UsageService(db=db)

    # Pre-deduct quota atomically
    has_quota, remaining, limit = await usage_service.check_and_record_usage(
        user_id, "chat_turns"
    )
    if not has_quota:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error_code": "QUOTA_EXCEEDED",
                "remaining": remaining,
                "limit": limit,
                "message": "Đã hết lượt chat. Vui lòng nâng cấp gói.",
            },
        )

    async def _stream_with_refund():
        try:
            async for chunk in _stream_chat_turn(request, orchestrator, user_id):
                yield chunk
        except Exception as e:
            # Refund usage if AI call failed
            await usage_service.refund_usage(user_id, "chat_turns")
            logger.error("chat_stream_failed_refunded", user_id=user_id, error=str(e))
            raise

    return StreamingResponse(
        _stream_with_refund(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
