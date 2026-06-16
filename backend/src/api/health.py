from fastapi import APIRouter

from src.core import database as db_module
from src.core import langfuse as lf_module
from src.core.logging import get_logger

router = APIRouter(prefix="/health", tags=["health"])

logger = get_logger("toan_truc_quan.health")


async def check_health() -> dict:
    """Return application health status."""
    langfuse = lf_module.get_langfuse_client()
    db_ok = db_module.db is not None
    if db_ok:
        try:
            await db_module.db.command("ping")
        except Exception:
            db_ok = False
    return {
        "status": "ok",
        "langfuse_connected": langfuse is not None,
        "mongodb_connected": db_ok,
    }


@router.get("")
async def health() -> dict:
    return await check_health()
