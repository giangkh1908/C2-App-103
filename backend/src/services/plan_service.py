from bson import ObjectId

from src.core.database import get_db
from src.core.logging import get_logger
from src.models.plan import PlanCreate, PlanFeatures, PlanInDB, PlanQuota, create_plan_doc

logger = get_logger("toan_truc_quan.plan_service")

DEFAULT_PLANS = [
    {
        "name": "free",
        "display_name": {"vi": "Miễn phí", "en": "Free"},
        "price_monthly": 0,
        "price_yearly": 0,
        "quotas": PlanQuota(
            chat_turns=10,
            tts_requests=5,
            stt_requests=5,
            practice_exams=2,
        ),
        "features": PlanFeatures(
            topics=["multiplication", "division", "fraction_basic", "perimeter_area_basic"],
            progress_tracking=False,
            parent_dashboard=False,
            multi_accounts=False,
        ),
        "sort_order": 0,
    },
    {
        "name": "plus",
        "display_name": {"vi": "Plus", "en": "Plus"},
        "price_monthly": 49000,
        "price_yearly": 399000,
        "quotas": PlanQuota(
            chat_turns=-1,
            tts_requests=-1,
            stt_requests=-1,
            practice_exams=-1,
        ),
        "features": PlanFeatures(
            topics=["multiplication", "division", "fraction_basic", "perimeter_area_basic"],
            progress_tracking=True,
            parent_dashboard=False,
            multi_accounts=False,
        ),
        "sort_order": 1,
    },
    {
        "name": "premium",
        "display_name": {"vi": "Premium", "en": "Premium"},
        "price_monthly": 99000,
        "price_yearly": 799000,
        "quotas": PlanQuota(
            chat_turns=-1,
            tts_requests=-1,
            stt_requests=-1,
            practice_exams=-1,
        ),
        "features": PlanFeatures(
            topics=["*"],
            progress_tracking=True,
            parent_dashboard=True,
            multi_accounts=True,
        ),
        "sort_order": 2,
    },
]


async def seed_default_plans() -> None:
    db = get_db()

    for plan_data in DEFAULT_PLANS:
        plan_create = PlanCreate(
            name=plan_data["name"],
            display_name=plan_data["display_name"],
            price_monthly=plan_data["price_monthly"],
            price_yearly=plan_data["price_yearly"],
            quotas=plan_data["quotas"],
            features=plan_data["features"],
            sort_order=plan_data["sort_order"],
        )
        doc = create_plan_doc(plan_create)

        # Upsert: insert if not exists, skip if exists
        await db.plans.update_one(
            {"name": plan_data["name"]},
            {"$setOnInsert": doc},
            upsert=True,
        )
        logger.info("plan_seed_upserted", plan_name=plan_data["name"])


async def get_free_plan_id() -> str:
    db = get_db()
    plan = await db.plans.find_one({"name": "free"})
    if plan:
        return str(plan["_id"])
    await seed_default_plans()
    plan = await db.plans.find_one({"name": "free"})
    return str(plan["_id"])


async def get_all_plans() -> list[PlanInDB]:
    db = get_db()
    cursor = db.plans.find({"is_active": True}).sort("sort_order", 1)
    plans = []
    async for doc in cursor:
        plans.append(PlanInDB.from_mongo(doc))
    return plans


async def get_plan_by_id(plan_id: str) -> PlanInDB | None:
    db = get_db()
    try:
        doc = await db.plans.find_one({"_id": ObjectId(plan_id)})
    except Exception:
        return None
    if doc:
        return PlanInDB.from_mongo(doc)
    return None


async def get_plan_by_name(name: str) -> PlanInDB | None:
    db = get_db()
    doc = await db.plans.find_one({"name": name})
    if doc:
        return PlanInDB.from_mongo(doc)
    return None


async def create_plan(plan: PlanCreate) -> PlanInDB:
    db = get_db()
    doc = create_plan_doc(plan)
    result = await db.plans.insert_one(doc)
    doc["_id"] = result.inserted_id
    return PlanInDB.from_mongo(doc)


async def update_plan(plan_id: str, updates: dict) -> PlanInDB | None:
    db = get_db()
    from datetime import UTC, datetime

    updates["updated_at"] = datetime.now(UTC)

    mongo_updates = {}
    for key, value in updates.items():
        if value is not None:
            if hasattr(value, "model_dump"):
                mongo_updates[key] = value.model_dump()
            else:
                mongo_updates[key] = value

    await db.plans.update_one(
        {"_id": ObjectId(plan_id)},
        {"$set": mongo_updates},
    )
    return await get_plan_by_id(plan_id)
