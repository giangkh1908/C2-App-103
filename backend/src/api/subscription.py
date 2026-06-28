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
    """Activate the free plan for the current user.

    Paid plans must be purchased via ``/payment/checkout`` + SePay webhook.
    This endpoint ONLY accepts "free" — any attempt to assign a paid plan
    via this endpoint is rejected to prevent privilege escalation.
    """
    plan_name = body.get("plan_name")

    if plan_name != "free":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Self-service upgrade is only available for the free plan. "
            "Paid plans must be purchased via checkout.",
        )

    db = get_db()
    plan = await plan_service.get_plan_by_name("free")
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Free plan not found in catalog.",
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
    """
    Downgrade or maintain tier within paid plans.
    Upgrades must go through payment checkout.

    Rules:
    - sort_order(target) <= sort_order(current) -> allowed (same-tier or downgrade)
    - sort_order(target) > sort_order(current) -> reject (must use checkout)
    - Same-tier (Plus->Plus or Premium->Premium) -> not supported, contact support
    """
    plan_name = body.get("plan_name")
    billing = body.get("billing")  # "monthly" or "yearly"

    if plan_name not in ("free", "plus", "premium"):
        raise HTTPException(status_code=400, detail="Invalid plan name")
    if billing not in ("monthly", "yearly"):
        raise HTTPException(status_code=400, detail="Invalid billing cycle")

    db = get_db()

    # Get target plan
    target_plan = await plan_service.get_plan_by_name(plan_name)
    if not target_plan:
        raise HTTPException(status_code=404, detail=f"Plan '{plan_name}' not found")

    # Get current user's plan to determine sort_order
    current_plan = None
    if current_user.plan_id:
        current_plan = await db.plans.find_one({"_id": ObjectId(current_user.plan_id)})

    current_sort = current_plan.get("sort_order", 0) if current_plan else 0
    target_sort = target_plan.sort_order

    # Upgrade not allowed via this endpoint
    if target_sort > current_sort:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upgrades must be purchased via checkout.",
        )

    # Same-tier billing switch not supported via this endpoint
    if target_sort == current_sort:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Billing cycle changes must be purchased via checkout.",
        )

    # Downgrade: compute new expiry
    now = datetime.now(UTC)
    if billing == "monthly":
        expires_at = now + timedelta(days=30)
    else:
        expires_at = now + timedelta(days=365)

    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {
            "$set": {
                "plan_id": str(target_plan.id),
                "subscription_status": "active",
                "subscription_expires_at": expires_at,
                "usage": {},
                "updated_at": now,
            }
        },
    )

    return {
        "status": "ok",
        "plan": plan_to_response(target_plan),
        "expires_at": expires_at.isoformat(),
    }
