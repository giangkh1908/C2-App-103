from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

import pytest
from bson import ObjectId

from src.services.usage_service import ROLLING_WINDOW_HOURS, UsageService


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.users = AsyncMock()
    db.plans = AsyncMock()
    db.usage_logs = AsyncMock()
    return db


@pytest.fixture
def usage_service(mock_db):
    return UsageService(db=mock_db)


@pytest.fixture
def user_oid():
    return str(ObjectId())


@pytest.fixture
def plan_oid():
    return str(ObjectId())


@pytest.fixture
def free_plan_doc(plan_oid):
    return {
        "_id": plan_oid,
        "name": "free",
        "display_name": {"vi": "Miễn phí", "en": "Free"},
        "price_monthly": 0,
        "price_yearly": 0,
        "quotas": {
            "chat_turns": 10,
            "tts_requests": 5,
            "stt_requests": 5,
            "practice_exams": 2,
        },
        "features": {
            "topics": ["multiplication"],
            "progress_tracking": False,
            "parent_dashboard": False,
            "multi_accounts": False,
        },
        "is_active": True,
        "sort_order": 0,
    }


@pytest.fixture
def plus_plan_doc(plan_oid):
    return {
        "_id": plan_oid,
        "name": "plus",
        "display_name": {"vi": "Plus", "en": "Plus"},
        "price_monthly": 49000,
        "price_yearly": 399000,
        "quotas": {
            "chat_turns": -1,
            "tts_requests": -1,
            "stt_requests": -1,
            "practice_exams": -1,
        },
        "features": {
            "topics": ["multiplication"],
            "progress_tracking": True,
            "parent_dashboard": False,
            "multi_accounts": False,
        },
        "is_active": True,
        "sort_order": 1,
    }


class TestCheckQuota:
    @pytest.mark.asyncio
    async def test_user_not_found_returns_unlimited(self, usage_service, mock_db):
        mock_db.users.find_one = AsyncMock(return_value=None)
        has_quota, remaining, limit = await usage_service.check_quota(str(ObjectId()), "chat_turns")
        assert has_quota is True
        assert remaining == -1
        assert limit == -1

    @pytest.mark.asyncio
    async def test_invalid_user_id_returns_unlimited(self, usage_service, mock_db):
        has_quota, remaining, limit = await usage_service.check_quota("invalid_id", "chat_turns")
        assert has_quota is True
        assert remaining == -1

    @pytest.mark.asyncio
    async def test_no_plan_returns_unlimited(self, usage_service, mock_db, user_oid):
        mock_db.users.find_one = AsyncMock(return_value={"_id": user_oid, "plan_id": ""})
        mock_db.plans.find_one = AsyncMock(return_value=None)
        has_quota, remaining, limit = await usage_service.check_quota(user_oid, "chat_turns")
        assert has_quota is True

    @pytest.mark.asyncio
    async def test_unlimited_plan_always_has_quota(self, usage_service, mock_db, plus_plan_doc, user_oid):
        mock_db.users.find_one = AsyncMock(return_value={
            "_id": user_oid,
            "plan_id": plus_plan_doc["_id"],
            "usage": {"chat_turns": {"count": 9999, "first_used_at": datetime.now(UTC)}},
        })
        mock_db.plans.find_one = AsyncMock(return_value=plus_plan_doc)

        has_quota, remaining, limit = await usage_service.check_quota(user_oid, "chat_turns")
        assert has_quota is True
        assert remaining == -1
        assert limit == -1

    @pytest.mark.asyncio
    async def test_free_plan_has_quota_when_under_limit(self, usage_service, mock_db, free_plan_doc, user_oid):
        mock_db.users.find_one = AsyncMock(return_value={
            "_id": user_oid,
            "plan_id": free_plan_doc["_id"],
            "usage": {"chat_turns": {"count": 5, "first_used_at": datetime.now(UTC)}},
        })
        mock_db.plans.find_one = AsyncMock(return_value=free_plan_doc)

        has_quota, remaining, limit = await usage_service.check_quota(user_oid, "chat_turns")
        assert has_quota is True
        assert remaining == 5
        assert limit == 10

    @pytest.mark.asyncio
    async def test_free_plan_blocked_when_at_limit(self, usage_service, mock_db, free_plan_doc, user_oid):
        mock_db.users.find_one = AsyncMock(return_value={
            "_id": user_oid,
            "plan_id": free_plan_doc["_id"],
            "usage": {"chat_turns": {"count": 10, "first_used_at": datetime.now(UTC)}},
        })
        mock_db.plans.find_one = AsyncMock(return_value=free_plan_doc)

        has_quota, remaining, limit = await usage_service.check_quota(user_oid, "chat_turns")
        assert has_quota is False
        assert remaining == 0
        assert limit == 10

    @pytest.mark.asyncio
    async def test_rolling_24h_reset(self, usage_service, mock_db, free_plan_doc, user_oid):
        expired_time = datetime.now(UTC) - timedelta(hours=25)
        mock_db.users.find_one = AsyncMock(return_value={
            "_id": user_oid,
            "plan_id": free_plan_doc["_id"],
            "usage": {"chat_turns": {"count": 10, "first_used_at": expired_time}},
        })
        mock_db.plans.find_one = AsyncMock(return_value=free_plan_doc)

        has_quota, remaining, limit = await usage_service.check_quota(user_oid, "chat_turns")
        assert has_quota is True
        assert remaining == 10
        assert limit == 10

    @pytest.mark.asyncio
    async def test_no_usage_yet_returns_full_quota(self, usage_service, mock_db, free_plan_doc, user_oid):
        mock_db.users.find_one = AsyncMock(return_value={
            "_id": user_oid,
            "plan_id": free_plan_doc["_id"],
            "usage": {},
        })
        mock_db.plans.find_one = AsyncMock(return_value=free_plan_doc)

        has_quota, remaining, limit = await usage_service.check_quota(user_oid, "chat_turns")
        assert has_quota is True
        assert remaining == 10
        assert limit == 10

    @pytest.mark.asyncio
    async def test_unknown_action_returns_unlimited(self, usage_service, mock_db, free_plan_doc, user_oid):
        mock_db.users.find_one = AsyncMock(return_value={
            "_id": user_oid,
            "plan_id": free_plan_doc["_id"],
            "usage": {},
        })
        mock_db.plans.find_one = AsyncMock(return_value=free_plan_doc)

        has_quota, remaining, limit = await usage_service.check_quota(user_oid, "unknown_action")
        assert has_quota is True
        assert remaining == -1
        assert limit == -1


class TestRecordUsage:
    @pytest.mark.asyncio
    async def test_first_usage_sets_timestamp_and_count(self, usage_service, mock_db, user_oid):
        mock_db.users.find_one = AsyncMock(return_value={
            "_id": user_oid,
            "plan_id": "plan_free_id",
            "usage": {},
        })
        mock_db.users.update_one = AsyncMock()
        mock_db.usage_logs.insert_one = AsyncMock()

        await usage_service.record_usage(user_oid, "chat_turns")

        mock_db.users.update_one.assert_called_once()
        call_args = mock_db.users.update_one.call_args
        set_data = call_args[0][1]["$set"]
        assert set_data["usage.chat_turns"]["count"] == 1
        assert set_data["usage.chat_turns"]["first_used_at"] is not None

    @pytest.mark.asyncio
    async def test_subsequent_usage_increments_count(self, usage_service, mock_db, user_oid):
        now = datetime.now(UTC)
        mock_db.users.find_one = AsyncMock(return_value={
            "_id": user_oid,
            "plan_id": "plan_free_id",
            "usage": {"chat_turns": {"count": 5, "first_used_at": now}},
        })
        mock_db.users.update_one = AsyncMock()
        mock_db.usage_logs.insert_one = AsyncMock()

        await usage_service.record_usage(user_oid, "chat_turns")

        call_args = mock_db.users.update_one.call_args
        set_data = call_args[0][1]["$set"]
        assert set_data["usage.chat_turns"]["count"] == 6

    @pytest.mark.asyncio
    async def test_expired_usage_resets_before_increment(self, usage_service, mock_db, user_oid):
        expired_time = datetime.now(UTC) - timedelta(hours=25)
        mock_db.users.find_one = AsyncMock(return_value={
            "_id": user_oid,
            "plan_id": "plan_free_id",
            "usage": {"chat_turns": {"count": 10, "first_used_at": expired_time}},
        })
        mock_db.users.update_one = AsyncMock()
        mock_db.usage_logs.insert_one = AsyncMock()

        await usage_service.record_usage(user_oid, "chat_turns")

        call_args = mock_db.users.update_one.call_args
        set_data = call_args[0][1]["$set"]
        assert set_data["usage.chat_turns"]["count"] == 1

    @pytest.mark.asyncio
    async def test_records_audit_log(self, usage_service, mock_db, user_oid):
        mock_db.users.find_one = AsyncMock(return_value={
            "_id": user_oid,
            "plan_id": "plan_free_id",
            "usage": {},
        })
        mock_db.users.update_one = AsyncMock()
        mock_db.usage_logs.insert_one = AsyncMock()

        await usage_service.record_usage(user_oid, "chat_turns")

        mock_db.usage_logs.insert_one.assert_called_once()
        log_entry = mock_db.usage_logs.insert_one.call_args[0][0]
        assert log_entry["user_id"] == user_oid
        assert log_entry["action"] == "chat_turns"
        assert log_entry["plan_id"] == "plan_free_id"

    @pytest.mark.asyncio
    async def test_user_not_found_does_nothing(self, usage_service, mock_db):
        mock_db.users.find_one = AsyncMock(return_value=None)

        await usage_service.record_usage(str(ObjectId()), "chat_turns")

        mock_db.users.update_one.assert_not_called()
        mock_db.usage_logs.insert_one.assert_not_called()

    @pytest.mark.asyncio
    async def test_invalid_user_id_does_nothing(self, usage_service, mock_db):
        await usage_service.record_usage("invalid_id", "chat_turns")

        mock_db.users.update_one.assert_not_called()
        mock_db.usage_logs.insert_one.assert_not_called()


class TestGetUserUsage:
    @pytest.mark.asyncio
    async def test_returns_usage_for_all_actions(self, usage_service, mock_db, free_plan_doc, user_oid):
        now = datetime.now(UTC)
        mock_db.users.find_one = AsyncMock(return_value={
            "_id": user_oid,
            "plan_id": free_plan_doc["_id"],
            "usage": {
                "chat_turns": {"count": 3, "first_used_at": now},
                "tts_requests": {"count": 1, "first_used_at": now},
            },
        })
        mock_db.plans.find_one = AsyncMock(return_value=free_plan_doc)

        result = await usage_service.get_user_usage(user_oid)

        assert "chatTurns" in result
        assert "ttsRequests" in result
        assert "sttRequests" in result
        assert "practiceExams" in result
        assert result["chatTurns"]["used"] == 3
        assert result["chatTurns"]["remaining"] == 7
        assert result["chatTurns"]["limit"] == 10
        assert result["chatTurns"]["unlimited"] is False

    @pytest.mark.asyncio
    async def test_unlimited_plan_shows_minus_one(self, usage_service, mock_db, plus_plan_doc, user_oid):
        mock_db.users.find_one = AsyncMock(return_value={
            "_id": user_oid,
            "plan_id": plus_plan_doc["_id"],
            "usage": {},
        })
        mock_db.plans.find_one = AsyncMock(return_value=plus_plan_doc)

        result = await usage_service.get_user_usage(user_oid)

        assert result["chatTurns"]["remaining"] == -1
        assert result["chatTurns"]["limit"] == -1
        assert result["chatTurns"]["unlimited"] is True

    @pytest.mark.asyncio
    async def test_invalid_user_id_returns_empty(self, usage_service, mock_db):
        result = await usage_service.get_user_usage("invalid_id")
        assert result == {}
