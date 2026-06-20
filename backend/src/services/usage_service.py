from datetime import UTC, datetime

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
        await self.db.usage_logs.insert_one({
            "user_id": user_id,
            "action": action,
            "timestamp": now,
            "plan_id": plan_id,
        })

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
        await self.db.usage_logs.insert_one({
            "user_id": user_id,
            "action": action,
            "timestamp": now,
            "plan_id": plan_id,
        })

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

    async def get_admin_overview(self) -> dict:
        total_users = await self.db.users.count_documents({})

        user_by_plan = []
        async for plan in self.db.plans.find({"is_active": True}).sort("sort_order", 1):
            count = await self.db.users.count_documents({"plan_id": str(plan["_id"])})
            user_by_plan.append({
                "planId": str(plan["_id"]),
                "planName": plan["name"],
                "displayName": plan["display_name"],
                "userCount": count,
            })

        now = datetime.now(UTC)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_usage = await self.db.usage_logs.count_documents({"timestamp": {"$gte": today_start}})

        return {
            "totalUsers": total_users,
            "usersByPlan": user_by_plan,
            "todayUsage": today_usage,
        }
