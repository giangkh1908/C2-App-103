from datetime import UTC, datetime, timedelta

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from src.core.database import get_db
from src.core.deps import get_current_user
from src.models.plan import plan_to_response
from src.models.user import UserInDB
from src.services import plan_service

router = APIRouter(prefix="/subscription", tags=["subscription"])


@router.post("/upgrade")
async def upgrade_plan(
    body: dict,
    current_user: UserInDB = Depends(get_current_user),
):
    """Upgrade or activate a plan for the current user.

    Free plans are activated immediately via this endpoint.
    Paid plans should be purchased via ``/payment/checkout`` + SePay webhook.
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


@router.post("/change")
async def change_plan_or_billing(
    body: dict,
    current_user: UserInDB = Depends(get_current_user),
):
    """Change billing cycle (monthly<->yearly) for the current plan,
    or switch to a different plan.

    Does NOT require payment — used when:
    1. User is on same plan, wants to switch billing cycle
    2. User is downgrading (after confirmation on frontend)
    """
    plan_name = body.get("plan_name")
    billing = body.get("billing")  # "monthly" or "yearly"

    if plan_name not in ("free", "plus", "premium"):
        raise HTTPException(status_code=400, detail="Invalid plan name")
    if billing not in ("monthly", "yearly"):
        raise HTTPException(status_code=400, detail="Invalid billing cycle")

    db = get_db()
    plan = await plan_service.get_plan_by_name(plan_name)
    if not plan:
        raise HTTPException(status_code=404, detail=f"Plan '{plan_name}' not found")

    # Compute new expiry based on billing cycle
    now = datetime.now(UTC)
    if billing == "monthly":
        expires_at = now + timedelta(days=30)
    else:
        expires_at = now + timedelta(days=365)

    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {
            "plan_id": str(plan.id),
            "subscription_status": "active",
            "subscription_expires_at": expires_at,
            "usage": {},  # reset quota on plan change
            "updated_at": now,
        }}
    )

    return {"status": "ok", "plan": plan_to_response(plan), "expires_at": expires_at.isoformat()}
