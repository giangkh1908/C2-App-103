from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger("toan_truc_quan.database")

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_uri, tz_aware=True,)
    db = client[settings.mongodb_db_name]
    await db.users.create_index("email", unique=True)
    await db.learning_sessions.create_index("session_id")
    await db.learning_sessions.create_index("user_id")
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
