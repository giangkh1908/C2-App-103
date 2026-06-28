from fastapi import APIRouter, Depends, HTTPException, Response, status

from src.core.database import get_db
from src.core.deps import get_current_user
from src.models.speech import TextToSpeechRequest
from src.models.user import UserInDB
from src.services.speech_service import SpeechService, SpeechServiceError
from src.services.usage_service import UsageService

router = APIRouter(prefix="/speech", tags=["speech"])


@router.post("/tts")
async def text_to_speech(
    request: TextToSpeechRequest,
    current_user: UserInDB = Depends(get_current_user),
) -> Response:
    user_id = str(current_user.id)
    usage_service = UsageService(db=get_db())
    speech_service = SpeechService()

    has_quota, remaining, limit = await usage_service.check_and_record_usage(user_id, "tts_requests")
    if not has_quota:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error_code": "QUOTA_EXCEEDED",
                "remaining": remaining,
                "limit": limit,
                "message": "Da het luot nghe doc. Vui long nang cap goi.",
            },
        )

    try:
        audio_bytes = await speech_service.synthesize(request.text, slow=request.slow)
    except SpeechServiceError as exc:
        await usage_service.refund_usage(user_id, "tts_requests")
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception as exc:
        await usage_service.refund_usage(user_id, "tts_requests")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="He thong chua tao duoc giong doc tu dich vu am thanh luc nay.",
        ) from exc

    return Response(
        content=audio_bytes,
        media_type=speech_service.media_type,
        headers={"Cache-Control": "no-store"},
    )
