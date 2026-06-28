"""Unit tests for Plan service."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId

from src.services.plan_service import (
    DEFAULT_PLANS,
    create_plan,
    get_all_plans,
    get_free_plan_id,
    get_plan_by_id,
    get_plan_by_name,
    seed_default_plans,
    update_plan,
)


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.plans = AsyncMock()
    return db


@pytest.fixture
def mock_plan_doc():
    return {
        "_id": ObjectId(),
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
            "topics": ["*"],
            "progress_tracking": True,
            "parent_dashboard": False,
            "multi_accounts": False,
        },
        "is_active": True,
        "sort_order": 1,
    }


class TestDefaultPlans:
    def test_default_plans_count(self):
        assert len(DEFAULT_PLANS) == 3

    def test_default_plans_names(self):
        names = [p["name"] for p in DEFAULT_PLANS]
        assert "free" in names
        assert "plus" in names
        assert "premium" in names

    def test_free_plan_has_quotas(self):
        free_plan = next(p for p in DEFAULT_PLANS if p["name"] == "free")
        assert free_plan["quotas"].chat_turns == 10
        assert free_plan["quotas"].tts_requests == 5
        assert free_plan["quotas"].stt_requests == 5
        assert free_plan["quotas"].practice_exams == 2

    def test_plus_plan_unlimited(self):
        plus_plan = next(p for p in DEFAULT_PLANS if p["name"] == "plus")
        assert plus_plan["quotas"].chat_turns == -1
        assert plus_plan["quotas"].tts_requests == -1

    def test_premium_plan_unlimited(self):
        premium_plan = next(p for p in DEFAULT_PLANS if p["name"] == "premium")
        assert premium_plan["quotas"].chat_turns == -1

    def test_free_plan_price_zero(self):
        free_plan = next(p for p in DEFAULT_PLANS if p["name"] == "free")
        assert free_plan["price_monthly"] == 0
        assert free_plan["price_yearly"] == 0

    def test_plus_plan_price(self):
        plus_plan = next(p for p in DEFAULT_PLANS if p["name"] == "plus")
        assert plus_plan["price_monthly"] == 49000
        assert plus_plan["price_yearly"] == 399000

    def test_premium_plan_price(self):
        premium_plan = next(p for p in DEFAULT_PLANS if p["name"] == "premium")
        assert premium_plan["price_monthly"] == 99000
        assert premium_plan["price_yearly"] == 799000

    def test_sort_order(self):
        free_plan = next(p for p in DEFAULT_PLANS if p["name"] == "free")
        plus_plan = next(p for p in DEFAULT_PLANS if p["name"] == "plus")
        premium_plan = next(p for p in DEFAULT_PLANS if p["name"] == "premium")

        assert free_plan["sort_order"] == 0
        assert plus_plan["sort_order"] == 1
        assert premium_plan["sort_order"] == 2


class TestSeedDefaultPlans:
    @pytest.mark.asyncio
    async def test_seed_creates_missing_plans(self, mock_db):
        mock_db.plans.find_one = AsyncMock(return_value=None)
        mock_db.plans.insert_one = AsyncMock()

        with patch("src.services.plan_service.get_db", return_value=mock_db):
            await seed_default_plans()

        assert mock_db.plans.insert_one.call_count == 3

    @pytest.mark.asyncio
    async def test_seed_skips_existing_plans(self, mock_db):
        mock_db.plans.find_one = AsyncMock(return_value={"_id": ObjectId(), "name": "free"})
        mock_db.plans.insert_one = AsyncMock()

        with patch("src.services.plan_service.get_db", return_value=mock_db):
            await seed_default_plans()

        mock_db.plans.insert_one.assert_not_called()


class TestGetFreePlanId:
    @pytest.mark.asyncio
    async def test_get_free_plan_id(self, mock_db):
        plan_id = ObjectId()
        mock_db.plans.find_one = AsyncMock(return_value={"_id": plan_id, "name": "free"})

        with patch("src.services.plan_service.get_db", return_value=mock_db):
            result = await get_free_plan_id()

        assert result == str(plan_id)

    @pytest.mark.asyncio
    async def test_get_free_plan_id_seeds_if_missing(self, mock_db):
        mock_db.plans.find_one = AsyncMock(side_effect=[None, {"_id": ObjectId(), "name": "free"}])
        mock_db.plans.insert_one = AsyncMock()

        with patch("src.services.plan_service.get_db", return_value=mock_db):
            result = await get_free_plan_id()

        assert result is not None


class TestGetAllPlans:
    @pytest.mark.asyncio
    async def test_get_all_plans(self, mock_db, mock_plan_doc):
        mock_db.plans.find = MagicMock()
        mock_db.plans.find.return_value.sort = MagicMock()

        async def mock_to_list(_):
            return [mock_plan_doc]

        mock_db.plans.find.return_value.sort.return_value.to_list = mock_to_list

        with patch("src.services.plan_service.get_db", return_value=mock_db):
            plans = await get_all_plans()

        assert len(plans) == 1
        assert plans[0].name == "plus"


class TestGetPlanById:
    @pytest.mark.asyncio
    async def test_get_plan_by_id(self, mock_db, mock_plan_doc):
        mock_db.plans.find_one = AsyncMock(return_value=mock_plan_doc)

        with patch("src.services.plan_service.get_db", return_value=mock_db):
            plan = await get_plan_by_id(str(mock_plan_doc["_id"]))

        assert plan is not None
        assert plan.name == "plus"

    @pytest.mark.asyncio
    async def test_get_plan_by_id_not_found(self, mock_db):
        mock_db.plans.find_one = AsyncMock(return_value=None)

        with patch("src.services.plan_service.get_db", return_value=mock_db):
            plan = await get_plan_by_id("nonexistent")

        assert plan is None

    @pytest.mark.asyncio
    async def test_get_plan_by_id_invalid_oid(self, mock_db):
        with patch("src.services.plan_service.get_db", return_value=mock_db):
            plan = await get_plan_by_id("invalid")

        assert plan is None


class TestGetPlanByName:
    @pytest.mark.asyncio
    async def test_get_plan_by_name(self, mock_db, mock_plan_doc):
        mock_db.plans.find_one = AsyncMock(return_value=mock_plan_doc)

        with patch("src.services.plan_service.get_db", return_value=mock_db):
            plan = await get_plan_by_name("plus")

        assert plan is not None
        assert plan.name == "plus"

    @pytest.mark.asyncio
    async def test_get_plan_by_name_not_found(self, mock_db):
        mock_db.plans.find_one = AsyncMock(return_value=None)

        with patch("src.services.plan_service.get_db", return_value=mock_db):
            plan = await get_plan_by_name("nonexistent")

        assert plan is None


class TestCreatePlan:
    @pytest.mark.asyncio
    async def test_create_plan(self, mock_db):
        from src.models.plan import PlanCreate, PlanFeatures, PlanQuota

        mock_db.plans.insert_one = AsyncMock()
        mock_db.plans.insert_one.return_value.inserted_id = ObjectId()
        mock_db.plans.find_one = AsyncMock(
            return_value={
                "_id": mock_db.plans.insert_one.return_value.inserted_id,
                "name": "test",
                "display_name": {"vi": "Test", "en": "Test"},
                "price_monthly": 0,
                "price_yearly": 0,
                "quotas": {"chat_turns": 10},
                "features": {"topics": ["*"]},
                "is_active": True,
                "sort_order": 0,
            }
        )

        plan_create = PlanCreate(
            name="test",
            display_name={"vi": "Test", "en": "Test"},
            quotas=PlanQuota(chat_turns=10),
            features=PlanFeatures(),
        )

        with patch("src.services.plan_service.get_db", return_value=mock_db):
            plan = await create_plan(plan_create)

        assert plan.name == "test"


class TestUpdatePlan:
    @pytest.mark.asyncio
    async def test_update_plan(self, mock_db, mock_plan_doc):
        mock_db.plans.update_one = AsyncMock()
        mock_db.plans.find_one = AsyncMock(return_value=mock_plan_doc)

        with patch("src.services.plan_service.get_db", return_value=mock_db):
            plan = await update_plan(str(mock_plan_doc["_id"]), {"price_monthly": 59000})

        assert plan is not None
        mock_db.plans.update_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_plan_not_found(self, mock_db):
        mock_db.plans.update_one = AsyncMock()
        mock_db.plans.find_one = AsyncMock(return_value=None)

        with patch("src.services.plan_service.get_db", return_value=mock_db):
            plan = await update_plan("nonexistent", {"price_monthly": 59000})

        assert plan is None
