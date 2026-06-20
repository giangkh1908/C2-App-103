from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger("toan_truc_quan.database")

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


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
