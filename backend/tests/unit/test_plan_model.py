"""Unit tests for Plan model."""

from datetime import UTC, datetime

from src.models.plan import (
    PlanCreate,
    PlanFeatures,
    PlanInDB,
    PlanQuota,
    PlanUpdate,
    create_plan_doc,
    plan_to_response,
)


class TestPlanQuota:
    def test_default_values(self):
        quota = PlanQuota()
        assert quota.chat_turns == -1
        assert quota.tts_requests == -1
        assert quota.stt_requests == -1
        assert quota.practice_exams == -1

    def test_custom_values(self):
        quota = PlanQuota(
            chat_turns=10,
            tts_requests=5,
            stt_requests=5,
            practice_exams=2,
        )
        assert quota.chat_turns == 10
        assert quota.tts_requests == 5
        assert quota.stt_requests == 5
        assert quota.practice_exams == 2

    def test_unlimited_represented_by_negative_one(self):
        quota = PlanQuota(chat_turns=-1)
        assert quota.chat_turns == -1


class TestPlanFeatures:
    def test_default_values(self):
        features = PlanFeatures()
        assert features.topics == [
            "multiplication",
            "division",
            "fraction_basic",
            "perimeter_area_basic",
        ]
        assert features.progress_tracking is False
        assert features.parent_dashboard is False
        assert features.multi_accounts is False

    def test_custom_values(self):
        features = PlanFeatures(
            topics=["*"],
            progress_tracking=True,
            parent_dashboard=True,
            multi_accounts=True,
        )
        assert features.topics == ["*"]
        assert features.progress_tracking is True
        assert features.parent_dashboard is True
        assert features.multi_accounts is True


class TestPlanInDB:
    def test_from_mongo(self):
        mongo_data = {
            "_id": "plan_123",
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
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }

        plan = PlanInDB.from_mongo(mongo_data)

        assert plan.id == "plan_123"
        assert plan.name == "plus"
        assert plan.display_name == {"vi": "Plus", "en": "Plus"}
        assert plan.price_monthly == 49000
        assert plan.price_yearly == 399000
        assert plan.quotas.chat_turns == -1
        assert plan.features.progress_tracking is True
        assert plan.is_active is True
        assert plan.sort_order == 1


class TestPlanCreate:
    def test_create_plan(self):
        plan = PlanCreate(
            name="premium",
            display_name={"vi": "Premium", "en": "Premium"},
            price_monthly=99000,
            price_yearly=799000,
            quotas=PlanQuota(
                chat_turns=-1,
                tts_requests=-1,
                stt_requests=-1,
                practice_exams=-1,
            ),
            features=PlanFeatures(
                topics=["*"],
                progress_tracking=True,
                parent_dashboard=True,
                multi_accounts=True,
            ),
            sort_order=2,
        )

        assert plan.name == "premium"
        assert plan.price_monthly == 99000
        assert plan.sort_order == 2


class TestCreatePlanDoc:
    def test_create_plan_doc(self):
        plan = PlanCreate(
            name="plus",
            display_name={"vi": "Plus", "en": "Plus"},
            price_monthly=49000,
            price_yearly=399000,
            quotas=PlanQuota(chat_turns=-1),
            features=PlanFeatures(),
            sort_order=1,
        )

        doc = create_plan_doc(plan)

        assert doc["name"] == "plus"
        assert doc["display_name"] == {"vi": "Plus", "en": "Plus"}
        assert doc["price_monthly"] == 49000
        assert doc["is_active"] is True
        assert "created_at" in doc
        assert "updated_at" in doc


class TestPlanToResponse:
    def test_plan_to_response(self):
        plan = PlanInDB(
            _id="plan_123",
            name="plus",
            display_name={"vi": "Plus", "en": "Plus"},
            price_monthly=49000,
            price_yearly=399000,
            quotas=PlanQuota(
                chat_turns=-1,
                tts_requests=-1,
                stt_requests=-1,
                practice_exams=-1,
            ),
            features=PlanFeatures(
                topics=["*"],
                progress_tracking=True,
                parent_dashboard=False,
                multi_accounts=False,
            ),
            is_active=True,
            sort_order=1,
        )

        response = plan_to_response(plan)

        assert response["id"] == "plan_123"
        assert response["name"] == "plus"
        assert response["displayName"] == {"vi": "Plus", "en": "Plus"}
        assert response["priceMonthly"] == 49000
        assert response["priceYearly"] == 399000
        assert response["quotas"]["chatTurns"] == -1
        assert response["quotas"]["ttsRequests"] == -1
        assert response["features"]["progressTracking"] is True
        assert response["features"]["parentDashboard"] is False
        assert response["sort_order"] == 1


class TestPlanUpdate:
    def test_partial_update(self):
        update = PlanUpdate(
            price_monthly=59000,
            is_active=False,
        )

        assert update.price_monthly == 59000
        assert update.is_active is False
        assert update.display_name is None
        assert update.quotas is None

    def test_full_update(self):
        update = PlanUpdate(
            display_name={"vi": "Plus Pro", "en": "Plus Pro"},
            price_monthly=59000,
            price_yearly=499000,
            quotas=PlanQuota(chat_turns=100),
            features=PlanFeatures(progress_tracking=True),
            is_active=True,
            sort_order=1,
        )

        assert update.display_name == {"vi": "Plus Pro", "en": "Plus Pro"}
        assert update.price_monthly == 59000
        assert update.quotas.chat_turns == 100
