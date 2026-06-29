"""Admin API endpoints.

All endpoints are protected by ``Depends(get_current_admin)``.
Only users with ``role == "admin"`` can access these endpoints.
All UI text is in Vietnamese (admin interface is Vietnamese-only).
"""

import re
from datetime import UTC, datetime, timedelta

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from pymongo import ReturnDocument

from src.core.config import settings
from src.core.database import get_db
from src.core.deps import get_current_admin
from src.models.payment import PaymentInDB
from src.models.user import UserInDB
from src.services.plan_service import get_all_plans, get_plan_by_name


class _ChangePlanRequest(BaseModel):
    plan_name: str


def _safe_objectid(user_id: str) -> ObjectId | None:
    """Coerce a string user id to a bson ObjectId, returning None on
    malformed input instead of raising."""
    try:
        return ObjectId(user_id)
    except (InvalidId, TypeError):
        return None


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/payments")
async def list_payments(
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin=Depends(get_current_admin),
):
    """Danh sách thanh toán với bộ lọc và tìm kiếm.

    Hỗ trợ lọc theo trạng thái, tìm kiếm theo mã thanh toán hoặc email
    người dùng, phân trang.
    """
    db = get_db()
    filter_dict: dict = {}

    if status_filter:
        filter_dict["status"] = status_filter

    if search:
        user_ids: list[str] = []
        async for u in db.users.find(
            {"email": {"$regex": search, "$options": "i"}},
            {"_id": 1},
        ):
            user_ids.append(str(u["_id"]))

        filter_dict["$or"] = [
            {"payment_code": {"$regex": search, "$options": "i"}},
            {"user_id": {"$in": user_ids}},
        ]

    total = await db.payments.count_documents(filter_dict)
    cursor = (
        db.payments.find(filter_dict)
        .sort("created_at", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    items: list[dict] = []
    user_ids: set[str] = set()
    async for doc in cursor:
        payment = PaymentInDB.from_mongo(doc).model_dump(mode="json")
        if payment.get("user_id"):
            user_ids.add(payment["user_id"])
        items.append(payment)

    # Look up user emails
    user_email_map: dict[str, str] = {}
    if user_ids:
        oids = [oid for uid in user_ids if (oid := _safe_objectid(uid))]
        if oids:
            async for u in db.users.find({"_id": {"$in": oids}}, {"email": 1}):
                user_email_map[str(u["_id"])] = u.get("email", "")

    for item in items:
        item["user_email"] = user_email_map.get(item.get("user_id", ""), "")

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/payments/{id}")
async def get_payment(
    id: str,
    admin=Depends(get_current_admin),
):
    """Chi tiết thanh toán bao gồm raw_webhook_payload."""
    db = get_db()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thanh toán",
        )

    doc = await db.payments.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thanh toán",
        )

    return PaymentInDB.from_mongo(doc).model_dump(mode="json")


@router.post("/payments/{id}/activate")
async def activate_payment(
    id: str,
    admin=Depends(get_current_admin),
):
    """Kích hoạt thủ công thanh toán đang chờ xử lý.

    Chuyển trạng thái thanh toán thành ``paid`` và kích hoạt gói
    đăng ký cho người dùng (30 ngày).
    """
    db = get_db()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thanh toán",
        )

    doc = await db.payments.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thanh toán",
        )

    payment = PaymentInDB.from_mongo(doc)
    if payment.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ có thể kích hoạt thanh toán đang chờ xử lý",
        )

    now = datetime.now(UTC)
    gateway_txn_id = f"manual_{int(now.timestamp())}"

    await db.payments.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "status": "paid",
                "gateway_transaction_id": gateway_txn_id,
                "paid_at": now,
                "raw_webhook_payload": {},
            }
        },
    )

    await db.users.update_one(
        {"_id": ObjectId(payment.user_id)},
        {
            "$set": {
                "plan_id": payment.plan_id,
                "subscription_status": "active",
                "subscription_expires_at": payment.expires_at or (now + timedelta(days=30)),
                "usage": {},
                "updated_at": now,
            }
        },
    )

    # Look up the user's email for the frontend confirmation display
    user_doc = await db.users.find_one(
        {"_id": ObjectId(payment.user_id)},
        {"email": 1},
    )
    activated_user_email = user_doc.get("email", "") if user_doc else ""

    updated_doc = await db.payments.find_one({"_id": obj_id})
    result = PaymentInDB.from_mongo(updated_doc).model_dump(mode="json")
    result["activated_user_email"] = activated_user_email
    return result


@router.post("/payments/reprocess/{payment_code}")
async def reprocess_payment(
    payment_code: str,
    admin=Depends(get_current_admin),
):
    """Xử lý lại thanh toán đang chờ bằng payment_code.

    Dùng khi webhook SePay bị miss — endpoint này tìm payment theo
    ``payment_code`` (nội dung chuyển khoản), kích hoạt thủ công
    với thời hạn đúng theo gói của payment.
    """
    db = get_db()
    doc = await db.payments.find_one({"payment_code": payment_code})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thanh toán với mã này",
        )

    payment = PaymentInDB.from_mongo(doc)
    if payment.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ có thể xử lý lại thanh toán đang chờ",
        )

    now = datetime.now(UTC)
    gateway_txn_id = f"reprocess_{int(now.timestamp())}"

    result = await db.payments.find_one_and_update(
        {"payment_code": payment_code, "status": "pending"},
        {
            "$set": {
                "status": "paid",
                "gateway_transaction_id": gateway_txn_id,
                "paid_at": now,
                "raw_webhook_payload": {},
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Có xung đột khi xử lý — vui lòng thử lại",
        )

    user_oid = _safe_objectid(payment.user_id)
    if user_oid is not None:
        await db.users.update_one(
            {"_id": user_oid},
            {
                "$set": {
                    "plan_id": payment.plan_id,
                    "subscription_status": "active",
                    "subscription_expires_at": payment.expires_at or (now + timedelta(days=30)),
                    "usage": {},
                    "updated_at": now,
                }
            },
        )

    result["activated_user_email"] = ""
    return PaymentInDB.from_mongo(result).model_dump(mode="json")


@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin=Depends(get_current_admin),
):
    """Danh sách người dùng kèm thông tin đăng ký."""
    db = get_db()
    total = await db.users.count_documents({})
    cursor = db.users.find({}).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size)
    items: list[dict] = []
    async for doc in cursor:
        items.append(UserInDB.from_mongo(doc).model_dump(mode="json", exclude={"password_hash"}))

    # Enrich each user with the plan's display name
    plan_ids: set[str] = {item["plan_id"] for item in items if item.get("plan_id")}
    plan_map: dict[str, str] = {}
    if plan_ids:
        oids = [oid for pid in plan_ids if (oid := _safe_objectid(pid))]
        if oids:
            async for p in db.plans.find({"_id": {"$in": oids}}, {"name": 1}):
                plan_map[str(p["_id"])] = p.get("name", "")

    for item in items:
        item["plan_name"] = plan_map.get(item.get("plan_id", ""), "")

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/plans")
async def list_plans(
    admin=Depends(get_current_admin),
):
    """Danh sách gói dịch vụ."""
    plans = await get_all_plans()
    return [
        {
            "name": plan.name,
            "display_name": plan.display_name,
            "price_monthly": plan.price_monthly,
            "price_yearly": plan.price_yearly,
        }
        for plan in plans
    ]


@router.post("/users/{id}/change-plan")
async def change_user_plan(
    id: str,
    body: _ChangePlanRequest,
    admin=Depends(get_current_admin),
):
    """Đổi gói dịch vụ cho người dùng.

    Đặt lại subscription_expires_at về null để người dùng
    bắt đầu mới với gói mới.
    """
    db = get_db()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng",
        )

    doc = await db.users.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng",
        )

    plan = await get_plan_by_name(body.plan_name)
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy gói",
        )

    now = datetime.now(UTC)
    await db.users.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "plan_id": plan.id,
                "subscription_status": "active",
                "subscription_expires_at": None,
                "updated_at": now,
            }
        },
    )

    updated_doc = await db.users.find_one({"_id": obj_id})
    user = UserInDB.from_mongo(updated_doc).model_dump(mode="json", exclude={"password_hash"})
    user["plan_name"] = plan.name
    return user


@router.post("/users/{id}/extend")
async def extend_subscription(
    id: str,
    admin=Depends(get_current_admin),
):
    """Gia hạn đăng ký người dùng thêm 30 ngày."""
    db = get_db()
    try:
        obj_id = ObjectId(id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng",
        )

    doc = await db.users.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy người dùng",
        )

    user = UserInDB.from_mongo(doc)
    now = datetime.now(UTC)

    if user.subscription_expires_at is None:
        new_expires = now + timedelta(days=30)
    else:
        new_expires = user.subscription_expires_at + timedelta(days=30)

    await db.users.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "subscription_status": "active",
                "subscription_expires_at": new_expires,
                "updated_at": now,
            }
        },
    )

    updated_doc = await db.users.find_one({"_id": obj_id})
    return UserInDB.from_mongo(updated_doc).model_dump(mode="json", exclude={"password_hash"})


@router.get("/stats")
async def get_stats(
    admin=Depends(get_current_admin),
):
    """Thống kê tổng quan cho dashboard admin."""
    db = get_db()

    revenue_cursor = db.payments.aggregate(
        [
            {"$match": {"status": "paid"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount_vnd"}}},
        ]
    )
    revenue_result = await revenue_cursor.to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0

    total_subscriptions = await db.payments.count_documents({"status": "paid"})
    pending_payments = await db.payments.count_documents({"status": "pending"})
    active_users = await db.users.count_documents({"subscription_status": "active"})

    return {
        "total_revenue": total_revenue,
        "total_subscriptions": total_subscriptions,
        "pending_payments": pending_payments,
        "active_users": active_users,
        "daily_budget_usd": settings.llm_daily_budget_usd,
    }


@router.get("/llm-logs")
async def list_llm_logs(
    model: str | None = Query(None),
    user_id: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),
    date: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin=Depends(get_current_admin),
):
    """Lịch sử gọi LLM với bộ lọc và phân trang.

    Hỗ trợ lọc theo model, user_id, trạng thái (success/failure),
    ngày (YYYY-MM-DD), phân trang.
    """
    db = get_db()
    filter_dict: dict = {}

    if model:
        filter_dict["model"] = model
    if user_id:
        filter_dict["user_id"] = user_id
    if status_filter:
        filter_dict["status"] = status_filter
    if date:
        try:
            parsed = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=UTC)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Date phải đúng định dạng YYYY-MM-DD, nhận: {date!r}",
            )
        filter_dict["created_at"] = {
            "$gte": parsed,
            "$lt": parsed + timedelta(days=1),
        }

    total = await db.llm_audit_logs.count_documents(filter_dict)
    cursor = (
        db.llm_audit_logs.find(filter_dict)
        .sort("created_at", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    items: list[dict] = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        doc["prompt_tokens"] = doc.get("prompt_tokens", doc.get("tokens_in", 0))
        doc["completion_tokens"] = doc.get("completion_tokens", doc.get("tokens_out", 0))
        if doc.get("created_at"):
            doc["created_at"] = doc["created_at"].isoformat()
        items.append(doc)

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/costs")
async def get_cost_stats(
    month: str = Query(..., description="Định dạng YYYY-MM, ví dụ 2026-06"),
    admin=Depends(get_current_admin),
):
    """Chi phí LLM theo tháng — cho admin dashboard.

    - ``month``: bắt buộc, định dạng ``YYYY-MM``.
    - Trả về tổng chi phí, so sánh tháng trước, top 10 user theo cost.
    """
    if not re.match(r"^\d{4}-\d{2}$", month):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Month phải đúng định dạng YYYY-MM, nhận: {month!r}",
        )

    from src.services.usage_service import UsageService

    service = UsageService()
    result = await service.get_cost_stats(month)

    return result


@router.get("/llm-stats")
async def get_llm_stats(
    days: int = Query(7, ge=1, le=90, description="Số ngày gần nhất để thống kê"),
    admin=Depends(get_current_admin),
):
    """Thống kê real-time chi phí LLM cho admin dashboard.

    Aggregate từ ``llm_audit_logs`` trong N ngày gần nhất.
    Trả về daily cost, cost by model, tokens by user, overall stats.
    """
    db = get_db()
    now = datetime.now(UTC)
    since = now - timedelta(days=days)

    pipeline = [
        {"$match": {"created_at": {"$gte": since}}},
        {
            "$facet": {
                "daily_costs": [
                    {
                        "$group": {
                            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                            "cost_usd": {"$sum": {"$ifNull": ["$cost_usd", 0]}},
                            "requests": {"$sum": 1},
                            "tokens": {"$sum": {"$add": [
                                {"$ifNull": ["$tokens_in", 0]},
                                {"$ifNull": ["$tokens_out", 0]},
                            ]}},
                        },
                    },
                    {"$sort": {"_id": 1}},
                    {
                        "$project": {
                            "_id": 0,
                            "date": "$_id",
                            "cost_usd": {"$round": ["$cost_usd", 6]},
                            "requests": 1,
                            "tokens": 1,
                        },
                    },
                ],
                "cost_by_model": [
                    {
                        "$group": {
                            "_id": "$model",
                            "cost_usd": {"$sum": {"$ifNull": ["$cost_usd", 0]}},
                        },
                    },
                    {"$sort": {"cost_usd": -1}},
                    {
                        "$project": {
                            "_id": 0,
                            "model": "$_id",
                            "cost_usd": {"$round": ["$cost_usd", 6]},
                        },
                    },
                ],
                "tokens_by_user": [
                    {
                        "$group": {
                            "_id": "$user_id",
                            "tokens": {"$sum": {"$add": [
                                {"$ifNull": ["$tokens_in", 0]},
                                {"$ifNull": ["$tokens_out", 0]},
                            ]}},
                            "cost_usd": {"$sum": {"$ifNull": ["$cost_usd", 0]}},
                        },
                    },
                    {"$sort": {"tokens": -1}},
                    {"$limit": 10},
                    {
                        "$project": {
                            "_id": 0,
                            "user_id": "$_id",
                            "tokens": 1,
                            "cost_usd": {"$round": ["$cost_usd", 6]},
                        },
                    },
                ],
                "overall": [
                    {
                        "$group": {
                            "_id": None,
                            "total_cost_usd": {"$sum": {"$ifNull": ["$cost_usd", 0]}},
                            "total_requests": {"$sum": 1},
                            "total_errors": {
                                "$sum": {"$cond": [{"$eq": ["$status", "failure"]}, 1, 0]},
                            },
                            "latencies": {"$push": {"$ifNull": ["$latency_ms", 0]}},
                        },
                    },
                ],
            },
        },
    ]

    cursor = db.llm_audit_logs.aggregate(pipeline)
    result = await cursor.to_list(length=1)
    doc = result[0] if result else {}

    # Compute p50/p95 from latencies
    overall = doc.get("overall", [])
    if overall:
        o = overall[0]
        latencies = sorted(o.get("latencies", []))
        n = len(latencies)
        total_requests = o.get("total_requests", 0)
        total_errors = o.get("total_errors", 0)
        overall_stats = {
            "total_cost_usd": round(o.get("total_cost_usd", 0), 6),
            "total_requests": total_requests,
            "error_rate": round(total_errors / total_requests, 4) if total_requests else 0,
            "latency_p50_ms": round(latencies[int(n * 0.5)] if n else 0, 2),
            "latency_p95_ms": round(latencies[int(n * 0.95)] if n else 0, 2),
        }
    else:
        overall_stats = {
            "total_cost_usd": 0,
            "total_requests": 0,
            "error_rate": 0,
            "latency_p50_ms": 0,
            "latency_p95_ms": 0,
        }

    return {
        "daily_costs": doc.get("daily_costs", []),
        "cost_by_model": doc.get("cost_by_model", []),
        "tokens_by_user": doc.get("tokens_by_user", []),
        "overall": overall_stats,
    }