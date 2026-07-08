from collections.abc import Awaitable, Callable
from contextvars import ContextVar
from datetime import UTC, datetime
from typing import Any

from src.core.database import get_db
from src.core.logging import get_logger

logger = get_logger("toan_truc_quan.llm_audit")

# Context variable to pass user_id from service layer down to audit hook.
# Set by LearningCoreService before calling LLM, read by log_llm_call.
current_user_id: ContextVar[str | None] = ContextVar("current_user_id", default=None)

# Signature: (model, user_id, prompt_preview, tokens_in, tokens_out, cost_usd, latency_ms, status, error, prompt_id, prompt_version) -> None
AuditHook = Callable[..., Awaitable[None]]


async def _noop_audit(**kwargs: Any) -> None:
    """No-op audit hook — used when audit logging is not needed (eval, tests)."""
    pass


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
    prompt_id: str | None = None,
    prompt_version: str | None = None,
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

        # Resolve user_id: explicit param > context var > "anonymous"
        resolved_user_id = user_id or current_user_id.get() or "anonymous"

        await db.llm_audit_logs.insert_one(
            {
                "model": model,
                "user_id": resolved_user_id,
                "prompt_preview": prompt_preview,
                "tokens_in": tokens_in,
                "tokens_out": tokens_out,
                "cost_usd": cost_usd,
                "latency_ms": latency_ms,
                "status": status,
                "error": error,
                "prompt_id": prompt_id,
                "prompt_version": prompt_version,
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
