from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from core.config import settings

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]
    await db.users.create_index("email", unique=True)
    print(f"Connected to MongoDB: {settings.mongodb_db_name}")


async def close_db() -> None:
    global client, db
    if client:
        client.close()
        client = None
        db = None
        print("Disconnected from MongoDB")


def get_db() -> AsyncIOMotorDatabase:
    if db is None:
        raise RuntimeError("Database not initialized")
    return db
