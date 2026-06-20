from bson import ObjectId
from fastapi import APIRouter, Depends

from src.core.database import get_db
from src.core.deps import get_current_user
from src.models.plan import plan_to_response
from src.models.user import UserInDB
from src.services import plan_service
from src.services.usage_service import UsageService

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/usage")
async def get_my_usage(current_user: UserInDB = Depends(get_current_user)):
    db = get_db()

    # Auto-assign free plan if user has no plan_id (existing users)
    if not current_user.plan_id:
        free_plan_id = await plan_service.get_free_plan_id()
        await db.users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": {"plan_id": free_plan_id}},
        )
        current_user.plan_id = free_plan_id

    # BOLA protection: only return current user's usage
    usage_service = UsageService(db=db)
    usage = await usage_service.get_user_usage(str(current_user.id))

    plan = await plan_service.get_plan_by_id(current_user.plan_id)
    plan_data = plan_to_response(plan) if plan else None

    return {
        "plan": plan_data,
        "usage": usage,
    }
