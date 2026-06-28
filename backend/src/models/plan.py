from datetime import UTC, datetime

from pydantic import BaseModel, Field


class PlanQuota(BaseModel):
    chat_turns: int = -1
    tts_requests: int = -1
    stt_requests: int = -1
    practice_exams: int = -1


class PlanFeatures(BaseModel):
    topics: list[str] = Field(
        default_factory=lambda: [
            "multiplication",
            "division",
            "fraction_basic",
            "perimeter_area_basic",
        ]
    )
    progress_tracking: bool = False
    parent_dashboard: bool = False
    multi_accounts: bool = False


class PlanInDB(BaseModel):
    id: str = Field(alias="_id")
    name: str
    display_name: dict[str, str]
    price_monthly: int = 0
    price_yearly: int = 0
    quotas: PlanQuota
    features: PlanFeatures
    is_active: bool = True
    sort_order: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    model_config = {"populate_by_name": True}

    @classmethod
    def from_mongo(cls, data: dict) -> "PlanInDB":
        data["_id"] = str(data["_id"])
        return cls(**data)


class PlanCreate(BaseModel):
    name: str
    display_name: dict[str, str]
    price_monthly: int = 0
    price_yearly: int = 0
    quotas: PlanQuota
    features: PlanFeatures
    sort_order: int = 0


class PlanUpdate(BaseModel):
    display_name: dict[str, str] | None = None
    price_monthly: int | None = None
    price_yearly: int | None = None
    quotas: PlanQuota | None = None
    features: PlanFeatures | None = None
    is_active: bool | None = None
    sort_order: int | None = None


def plan_to_response(plan: PlanInDB) -> dict:
    return {
        "id": plan.id,
        "name": plan.name,
        "displayName": plan.display_name,
        "priceMonthly": plan.price_monthly,
        "priceYearly": plan.price_yearly,
        "quotas": {
            "chatTurns": plan.quotas.chat_turns,
            "ttsRequests": plan.quotas.tts_requests,
            "sttRequests": plan.quotas.stt_requests,
            "practiceExams": plan.quotas.practice_exams,
        },
        "features": {
            "topics": plan.features.topics,
            "progressTracking": plan.features.progress_tracking,
            "parentDashboard": plan.features.parent_dashboard,
            "multiAccounts": plan.features.multi_accounts,
        },
        "sort_order": plan.sort_order,
    }


def create_plan_doc(plan: PlanCreate) -> dict:
    now = datetime.now(UTC)
    return {
        "name": plan.name,
        "display_name": plan.display_name,
        "price_monthly": plan.price_monthly,
        "price_yearly": plan.price_yearly,
        "quotas": plan.quotas.model_dump(),
        "features": plan.features.model_dump(),
        "is_active": True,
        "sort_order": plan.sort_order,
        "created_at": now,
        "updated_at": now,
    }
