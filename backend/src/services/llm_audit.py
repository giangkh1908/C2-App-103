from datetime import UTC, datetime

from src.core.database import get_db
from src.core.logging import get_logger

logger = get_logger("toan_truc_quan.llm_audit")


async def log_llm_call(
    model: str,
    user_id: str | None,
    prompt_preview: str,
    tokens_in: int,
    tokens_out: int,
    cost_usd: float,
    latency_ms: float,
    status: str,  # "success" | "failure"
    error: str | None = None,
) -> None:
    """Record an LLM API call to the llm_audit_logs collection.

    Stores every LLM interaction for audit, cost tracking, and latency
    monitoring.  The caller is responsible for computing *cost_usd* from
    *tokens_in* / *tokens_out* and the current model pricing.

    Handles None *user_id* gracefully (logged as ``"anonymous"``) and
    catches DB exceptions at the call site so a failing audit log never
    crashes the calling request.
    """
    try:
        db = get_db()

        await db.llm_audit_logs.insert_one(
            {
                "model": model,
                "user_id": user_id if user_id is not None else "anonymous",
                "prompt_preview": prompt_preview,
                "tokens_in": tokens_in,
                "tokens_out": tokens_out,
                "cost_usd": cost_usd,
                "latency_ms": latency_ms,
                "status": status,
                "error": error,
                "created_at": datetime.now(UTC),
            }
        )
    except Exception:
        logger.warning(
            "failed_to_log_llm_call",
            model=model,
            user_id=user_id,
            exc_info=True,
        )
