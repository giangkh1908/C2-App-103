from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from src.core.database import get_db
from src.core.deps import get_current_admin
from src.models.plan import plan_to_response
from src.models.user import UserInDB
from src.services import plan_service

router = APIRouter(prefix="/subscription", tags=["subscription"])


@router.post("/upgrade")
async def upgrade_plan(
    body: dict,
    current_user: UserInDB = Depends(get_current_admin),
):
    """Admin-only plan upgrade.

    End users purchase via ``/payment/checkout`` + SePay webhook;
    this endpoint is reserved for ops / customer-success staff
    to grant a paid plan manually (refund flow, promo code,
    bug repro, etc.). Non-admin callers receive ``403 Forbidden``
    from the ``get_current_admin`` dependency.
    """
    plan_name = body.get("plan_name")
    if plan_name not in ("plus", "premium", "free"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan name. Must be 'free', 'plus', or 'premium'.",
        )

    db = get_db()
    plan = await plan_service.get_plan_by_name(plan_name)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan '{plan_name}' not found.",
        )

    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"plan_id": str(plan.id), "subscription_status": "active", "usage": {}}},
    )

    return {"status": "ok", "plan": plan_to_response(plan)}
