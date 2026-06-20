from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.core.database import get_db
from src.core.security import decode_token
from src.models.user import UserInDB

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserInDB:
    token = credentials.credentials
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )

    user_id = payload.get("sub")
    db = get_db()

    try:
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user_doc = None

    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return UserInDB.from_mongo(user_doc)


async def get_current_admin(
    current_user: UserInDB = Depends(get_current_user),
) -> UserInDB:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


def require_quota(action: str):
    async def _check_quota(
        current_user: UserInDB = Depends(get_current_user),
    ) -> UserInDB:
        from src.services.usage_service import UsageService

        db = get_db()
        usage_service = UsageService(db=db)

        try:
            has_quota, remaining, limit = await usage_service.check_quota(
                str(current_user.id), action
            )
        except Exception:
            # Fail closed: deny request if quota check fails
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error_code": "QUOTA_CHECK_FAILED",
                    "message": "Cannot verify quota. Please try again later.",
                },
            )

        if not has_quota:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error_code": "QUOTA_EXCEEDED",
                    "action": action,
                    "remaining": remaining,
                    "limit": limit,
                    "message": "Đã hết lượt sử dụng. Vui lòng nâng cấp gói.",
                },
            )

        return current_user

    return _check_quota
