from datetime import UTC, datetime, timedelta

from bson import ObjectId
from bson.errors import InvalidId

from src.core.database import get_db
from src.core.logging import get_logger
from src.models.plan import PlanInDB

logger = get_logger("toan_truc_quan.usage_service")

ROLLING_WINDOW_HOURS = 24


def _safe_objectid(user_id: str) -> ObjectId | None:
    try:
        return ObjectId(user_id)
    except (InvalidId, TypeError):
        return None


class UsageService:
    def __init__(self, db=None):
        self.db = db if db is not None else get_db()

    async def _get_user_plan(self, user_id: str) -> PlanInDB | None:
        oid = _safe_objectid(user_id)
        if not oid:
            return None
        user = await self.db.users.find_one({"_id": oid})
        if not user or not user.get("plan_id"):
            return None
        plan_oid = _safe_objectid(user["plan_id"])
        if not plan_oid:
            return None
        plan_doc = await self.db.plans.find_one({"_id": plan_oid})
        if plan_doc:
            return PlanInDB.from_mongo(plan_doc)
        return None

    def _reset_if_expired(self, usage: dict, now: datetime) -> dict:
        first_used = usage.get("first_used_at")
        if first_used is None:
            return {"count": 0, "first_used_at": None}

        if isinstance(first_used, str):
            first_used = datetime.fromisoformat(first_used)

        hours_since = (now - first_used).total_seconds() / 3600
        if hours_since >= ROLLING_WINDOW_HOURS:
            return {"count": 0, "first_used_at": None}

        return usage

    async def check_quota(self, user_id: str, action: str) -> tuple[bool, int, int]:
        oid = _safe_objectid(user_id)
        if not oid:
            return (True, -1, -1)

        user = await self.db.users.find_one({"_id": oid})
        if not user:
            return (True, -1, -1)

        plan = await self._get_user_plan(user_id)
        if not plan:
            return (True, -1, -1)

        quota_map = {
            "chat_turns": plan.quotas.chat_turns,
            "tts_requests": plan.quotas.tts_requests,
            "stt_requests": plan.quotas.stt_requests,
            "practice_exams": plan.quotas.practice_exams,
        }

        limit = quota_map.get(action, -1)
        if limit == -1:
            return (True, -1, -1)

        now = datetime.now(UTC)
        usage = user.get("usage", {}).get(action, {"count": 0, "first_used_at": None})
        usage = self._reset_if_expired(usage, now)

        remaining = max(0, limit - usage["count"])
        return (remaining > 0, remaining, limit)

    async def check_and_record_usage(self, user_id: str, action: str) -> tuple[bool, int, int]:
        """Atomic check quota and record usage. Returns (has_quota, remaining, limit)."""
        oid = _safe_objectid(user_id)
        if not oid:
            return (True, -1, -1)

        now = datetime.now(UTC)
        user = await self.db.users.find_one({"_id": oid})
        if not user:
            return (True, -1, -1)

        plan = await self._get_user_plan(user_id)
        if not plan:
            return (True, -1, -1)

        quota_map = {
            "chat_turns": plan.quotas.chat_turns,
            "tts_requests": plan.quotas.tts_requests,
            "stt_requests": plan.quotas.stt_requests,
            "practice_exams": plan.quotas.practice_exams,
        }

        limit = quota_map.get(action, -1)
        if limit == -1:
            return (True, -1, -1)

        usage = user.get("usage", {}).get(action, {"count": 0, "first_used_at": None})
        usage = self._reset_if_expired(usage, now)

        if usage["count"] >= limit:
            return (False, 0, limit)

        # Pre-deduct: increment count atomically
        if usage["first_used_at"] is None:
            usage["first_used_at"] = now
        usage["count"] += 1

        await self.db.users.update_one(
            {"_id": oid},
            {"$set": {f"usage.{action}": usage, "updated_at": now}},
        )

        # Log usage
        plan_id = user.get("plan_id", "")
        await self.db.usage_logs.insert_one(
            {
                "user_id": user_id,
                "action": action,
                "timestamp": now,
                "plan_id": plan_id,
            }
        )

        remaining = max(0, limit - usage["count"])
        return (True, remaining, limit)

    async def refund_usage(self, user_id: str, action: str) -> None:
        """Refund one usage (e.g., if AI call failed after pre-deduction)."""
        oid = _safe_objectid(user_id)
        if not oid:
            return

        now = datetime.now(UTC)
        user = await self.db.users.find_one({"_id": oid})
        if not user:
            return

        usage = user.get("usage", {}).get(action, {"count": 0, "first_used_at": None})
        if usage["count"] > 0:
            usage["count"] -= 1

        await self.db.users.update_one(
            {"_id": oid},
            {"$set": {f"usage.{action}": usage, "updated_at": now}},
        )

    async def record_usage(self, user_id: str, action: str) -> None:
        oid = _safe_objectid(user_id)
        if not oid:
            logger.warning("record_usage_invalid_id", user_id=user_id)
            return

        now = datetime.now(UTC)
        user = await self.db.users.find_one({"_id": oid})
        if not user:
            logger.warning("record_usage_user_not_found", user_id=user_id)
            return

        usage = user.get("usage", {}).get(action, {"count": 0, "first_used_at": None})
        usage = self._reset_if_expired(usage, now)

        if usage["first_used_at"] is None:
            usage["first_used_at"] = now
        usage["count"] += 1

        logger.info(
            "usage_recording",
            user_id=user_id,
            action=action,
            new_count=usage["count"],
            plan_id=user.get("plan_id", ""),
        )

        await self.db.users.update_one(
            {"_id": oid},
            {"$set": {f"usage.{action}": usage, "updated_at": now}},
        )

        plan_id = user.get("plan_id", "")
        await self.db.usage_logs.insert_one(
            {
                "user_id": user_id,
                "action": action,
                "timestamp": now,
                "plan_id": plan_id,
            }
        )

    async def get_user_usage(self, user_id: str) -> dict:
        oid = _safe_objectid(user_id)
        if not oid:
            return {}

        user = await self.db.users.find_one({"_id": oid})
        if not user:
            return {}

        plan = await self._get_user_plan(user_id)
        if not plan:
            return {}

        now = datetime.now(UTC)
        result = {}
        quota_map = {
            "chatTurns": plan.quotas.chat_turns,
            "ttsRequests": plan.quotas.tts_requests,
            "sttRequests": plan.quotas.stt_requests,
            "practiceExams": plan.quotas.practice_exams,
        }
        action_key_map = {
            "chatTurns": "chat_turns",
            "ttsRequests": "tts_requests",
            "sttRequests": "stt_requests",
            "practiceExams": "practice_exams",
        }

        for camel_key, limit in quota_map.items():
            action_key = action_key_map[camel_key]
            usage = user.get("usage", {}).get(action_key, {"count": 0, "first_used_at": None})
            usage = self._reset_if_expired(usage, now)

            result[camel_key] = {
                "remaining": max(0, limit - usage["count"]) if limit != -1 else -1,
                "limit": limit,
                "unlimited": limit == -1,
                "used": usage["count"],
            }

        return result

    async def record_llm_cost(
        self, user_id: str, prompt_tokens: int, completion_tokens: int, model: str
    ) -> None:
        """Record an LLM API call cost to cost_logs collection."""
        oid = _safe_objectid(user_id)
        if not oid:
            logger.warning("record_llm_cost_invalid_id", user_id=user_id)
            return

        from src.core.config import settings

        cost_usd = (
            prompt_tokens * settings.openrouter_prompt_cost_per_1m
            + completion_tokens * settings.openrouter_completion_cost_per_1m
        ) / 1_000_000

        now = datetime.now(UTC)
        await self.db.cost_logs.insert_one(
            {
                "user_id": user_id,
                "model": model,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "cost_usd": cost_usd,
                "timestamp": now,
            }
        )

        logger.info(
            "llm_cost_recorded",
            user_id=user_id,
            model=model,
            cost_usd=round(cost_usd, 6),
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
        )

    async def get_cost_stats(self, month: str) -> dict:
        """Thống kê chi phí LLM theo tháng — cho admin dashboard.

        month: định dạng YYYY-MM, ví dụ "2026-06".
        Trả về::
            {
                "month": str,
                "total_cost_usd": float,
                "total_prompt_tokens": int,
                "total_completion_tokens": int,
                "total_users": int,
                "previous_month": float | None,
                "top_users": [
                    {
                        "user_id": str,
                        "email": str | None,
                        "prompt_tokens": int,
                        "completion_tokens": int,
                        "cost_usd": float,
                    },
                    ...
                ],
            }
        """
        try:
            year, mon = int(month[:4]), int(month[5:7])
            start = datetime(year, mon, 1, tzinfo=UTC)
            if mon == 12:
                end = datetime(year + 1, 1, 1, tzinfo=UTC)
            else:
                end = datetime(year, mon + 1, 1, tzinfo=UTC)
        except (ValueError, IndexError):
            raise ValueError(f"Invalid month format: {month!r}")

        # ── Current month aggregation ──
        pipeline = [
            {"$match": {"timestamp": {"$gte": start, "$lt": end}}},
            {
                "$facet": {
                    "totals": [
                        {
                            "$group": {
                                "_id": None,
                                "total_cost_usd": {"$sum": {"$ifNull": ["$cost_usd", 0]}},
                                "total_prompt_tokens": {"$sum": {"$ifNull": ["$prompt_tokens", 0]}},
                                "total_completion_tokens": {
                                    "$sum": {"$ifNull": ["$completion_tokens", 0]}
                                },
                                "total_users": {"$addToSet": "$user_id"},
                            }
                        },
                    ],
                    "top_users": [
                        {
                            "$group": {
                                "_id": "$user_id",
                                "cost_usd": {"$sum": {"$ifNull": ["$cost_usd", 0]}},
                                "prompt_tokens": {"$sum": {"$ifNull": ["$prompt_tokens", 0]}},
                                "completion_tokens": {
                                    "$sum": {"$ifNull": ["$completion_tokens", 0]}
                                },
                            }
                        },
                        {"$sort": {"cost_usd": -1}},
                        {"$limit": 10},
                        {
                            "$lookup": {
                                "from": "users",
                                "let": {"uid": "$_id"},
                                "pipeline": [
                                    {"$addFields": {"_id_str": {"$toString": "$_id"}}},
                                    {"$match": {"$expr": {"$eq": ["$_id_str", "$$uid"]}}},
                                ],
                                "as": "user",
                            }
                        },
                        {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
                        {
                            "$project": {
                                "_id": 0,
                                "user_id": "$_id",
                                "email": {"$ifNull": ["$user.email", None]},
                                "cost_usd": {"$round": ["$cost_usd", 6]},
                                "prompt_tokens": 1,
                                "completion_tokens": 1,
                            }
                        },
                    ],
                }
            },
        ]

        cursor = self.db.cost_logs.aggregate(pipeline)
        result = await cursor.to_list(length=1)
        if not result or not result[0].get("totals"):
            current = {
                "month": month,
                "total_cost_usd": 0.0,
                "total_prompt_tokens": 0,
                "total_completion_tokens": 0,
                "total_users": 0,
                "top_users": [],
            }
        else:
            doc = result[0]
            totals = doc["totals"][0]
            current = {
                "month": month,
                "total_cost_usd": round(totals.get("total_cost_usd", 0.0), 6),
                "total_prompt_tokens": totals.get("total_prompt_tokens", 0),
                "total_completion_tokens": totals.get("total_completion_tokens", 0),
                "total_users": len(totals.get("total_users", [])),
                "top_users": doc.get("top_users", []),
            }

        # ── Previous month total ──
        prev_start = start - timedelta(days=1)
        prev_start = prev_start.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if prev_start.month == 12:
            prev_end = datetime(prev_start.year + 1, 1, 1, tzinfo=UTC)
        else:
            prev_end = datetime(prev_start.year, prev_start.month + 1, 1, tzinfo=UTC)

        prev_pipeline = [
            {"$match": {"timestamp": {"$gte": prev_start, "$lt": prev_end}}},
            {"$group": {"_id": None, "total": {"$sum": {"$ifNull": ["$cost_usd", 0]}}}},
        ]
        prev_result = await self.db.cost_logs.aggregate(prev_pipeline).to_list(1)
        current["previous_month"] = round(prev_result[0]["total"], 6) if prev_result else None

        return current

    async def get_admin_overview(self) -> dict:
        total_users = await self.db.users.count_documents({})

        user_by_plan = []
        async for plan in self.db.plans.find({"is_active": True}).sort("sort_order", 1):
            count = await self.db.users.count_documents({"plan_id": str(plan["_id"])})
            user_by_plan.append(
                {
                    "planId": str(plan["_id"]),
                    "planName": plan["name"],
                    "displayName": plan["display_name"],
                    "userCount": count,
                }
            )

        now = datetime.now(UTC)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_usage = await self.db.usage_logs.count_documents({"timestamp": {"$gte": today_start}})

        return {
            "totalUsers": total_users,
            "usersByPlan": user_by_plan,
            "todayUsage": today_usage,
        }
