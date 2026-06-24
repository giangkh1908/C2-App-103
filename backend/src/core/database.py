from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError, OperationFailure

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger("toan_truc_quan.database")

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def ensure_payment_indexes(target_db: AsyncIOMotorDatabase) -> None:
    """Create indexes for the `payments` collection.

    `payment_code` must be unique — it's the business code we show
    the user in the QR content and is also the lookup key from the
    SePay webhook. `user_id` and `status` are queried for the
    user's payment history and for the background sweeper that
    expires stale `pending` intents.

    Before creating the unique partial index on (user_id, plan_name, billing)
    for pending payments, we clean up any existing duplicate pending payments
    so the index creation does not fail on deploy.
    """
    # 1. Cleanup: expire duplicate pending payments before creating unique index.
    #    Keep only the most recent pending payment per (user_id, plan_name, billing).
    pipeline = [
        {"$match": {"status": "pending"}},
        {"$sort": {"created_at": -1}},
        {
            "$group": {
                "_id": {"user_id": "$user_id", "plan_name": "$plan_name", "billing": "$billing"},
                "keep_id": {"$first": "$_id"},
                "duplicates": {"$push": "$_id"},
            }
        },
        {
            "$project": {
                "duplicate_ids": {
                    "$filter": {
                        "input": "$duplicates",
                        "as": "dup",
                        "cond": {"$ne": ["$$dup", "$keep_id"]},
                    }
                }
            }
        },
    ]
    async for group in target_db.payments.aggregate(pipeline):
        dup_ids = group.get("duplicate_ids", [])
        if dup_ids:
            await target_db.payments.update_many(
                {"_id": {"$in": dup_ids}},
                {"$set": {"status": "expired"}},
            )
            logger.info(
                "expired_duplicate_pending_payments",
                count=len(dup_ids),
            )

    # 2. Create other indexes — try/except for resilience against existing indexes
    #    with different names. MongoDB's create_index raises OperationFailure
    #    (code 85 = IndexOptionsConflict) if an index with the same keys exists
    #    but has a different name. We just skip those — the index is already there.
    other_indexes = [
        ("payment_code", {"unique": True, "name": "unique_payment_code"}),
        ("user_id", {"name": "idx_user_id"}),
        ("status", {"name": "idx_status"}),
    ]
    for keys, options in other_indexes:
        try:
            await target_db.payments.create_index(keys, **options)
        except OperationFailure as e:
            if e.code == 85:  # IndexOptionsConflict
                pass  # Index exists with different name — that's OK
            else:
                raise

    # 3. Unique partial index for race condition prevention (data is clean).
    try:
        await target_db.payments.create_index(
            [("user_id", 1), ("plan_name", 1), ("billing", 1)],
            unique=True,
            partialFilterExpression={"status": "pending"},
            name="unique_pending_user_plan",
        )
    except DuplicateKeyError:
        logger.warning(
            "Could not create unique_pending_user_plan index — "
            "duplicate pending payments may still exist"
        )


async def ensure_indexes(target_db: AsyncIOMotorDatabase) -> None:
    await target_db.users.create_index("email", unique=True)
    await target_db.learning_sessions.create_index("session_id")
    await target_db.learning_sessions.create_index("user_id")
    await target_db.practice_attempts.create_index("attempt_id", unique=True)
    await target_db.practice_attempts.create_index("user_id")
    await target_db.practice_attempts.create_index("exam_id")
    await target_db.practice_attempts.create_index([("user_id", 1), ("exam_id", 1), ("status", 1)])
    await target_db.practice_attempts.create_index("submitted_at")
    await target_db.practice_exam_sets.create_index("exam_id", unique=True)
    await target_db.practice_exam_sets.create_index("grade")
    await target_db.practice_exam_sets.create_index("is_active")
    await target_db.practice_exam_sets.create_index([("grade", 1), ("is_active", 1), ("sort_order", 1)])
    await target_db.plans.create_index("name", unique=True)
    await target_db.plans.create_index("is_active")
    await target_db.usage_logs.create_index("user_id")
    await target_db.usage_logs.create_index("timestamp")
    await target_db.usage_logs.create_index([("user_id", 1), ("action", 1), ("timestamp", 1)])
    await ensure_payment_indexes(target_db)


async def connect_db() -> None:
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_uri, tz_aware=True)
    db = client[settings.mongodb_db_name]
    await ensure_indexes(db)
    logger.info("mongodb_connected", mongodb_db_name=settings.mongodb_db_name)


async def close_db() -> None:
    global client, db
    if client:
        client.close()
        client = None
        db = None
        logger.info("mongodb_disconnected")


def get_db() -> AsyncIOMotorDatabase:
    if db is None:
        raise RuntimeError("Database not initialized")
    return db
