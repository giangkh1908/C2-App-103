from contextlib import asynccontextmanager
from time import perf_counter
from uuid import uuid4

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api import api_router
from src.api.health import check_health
from src.core import database as db_module
from src.core.config import settings
from src.core.logging import (
    bind_request_context,
    clear_request_context,
    configure_logging,
    get_logger,
    unbind_request_context,
)
from src.core.metrics import record_request_duration, reset_metrics
from src.services.payment_service import (
    expire_overdue_payments,
    reconcile_paid_payments,
)
from src.services.plan_service import seed_default_plans
from src.services.practice_dataset import load_exam_catalog_from_db
from src.services.subscription_service import (
    expire_overdue_subscriptions,
    send_expiry_reminder_emails,
)

configure_logging()

logger = get_logger(APP_LOGGER_NAME := "toan_truc_quan")

# Timezone used by every cron job below. We keep it in a single
# constant so it can be promoted to ``settings`` later without
# touching the scheduler wiring.
_SCHEDULER_TIMEZONE = "Asia/Ho_Chi_Minh"


def _run_async_job(coro) -> None:
    """Bridge a coroutine to a BackgroundScheduler thread.

    ``BackgroundScheduler`` runs jobs in a thread pool, so async
    coroutines must be driven through a fresh event loop in that
    thread. ``asyncio.run`` is the canonical helper for that.
    """
    import asyncio

    asyncio.run(coro())


def _build_scheduler() -> BackgroundScheduler:
    """Create the BackgroundScheduler with the subscription cron jobs.

    Two daily jobs:

    - ``expire_overdue_subscriptions`` at 00:00 local time — sweeps
      active users whose expiry is in the past and downgrades them.
    - ``send_expiry_reminder_emails`` at 09:00 local time — emails
      users whose subscription expires in 3 days.
    """
    scheduler = BackgroundScheduler(timezone=_SCHEDULER_TIMEZONE)

    scheduler.add_job(
        lambda: _run_async_job(expire_overdue_subscriptions),
        CronTrigger(hour=0, minute=0, timezone=_SCHEDULER_TIMEZONE),
        id="expire_overdue_subscriptions",
        name="Expire overdue subscriptions",
        replace_existing=True,
    )

    scheduler.add_job(
        lambda: _run_async_job(send_expiry_reminder_emails),
        CronTrigger(hour=9, minute=0, timezone=_SCHEDULER_TIMEZONE),
        id="send_expiry_reminder_emails",
        name="Send subscription expiry reminder emails",
        replace_existing=True,
    )

    # Payment reconciliation: every 5 minutes, activate any paid
    # payments whose user was not upgraded (catches failed activations).
    scheduler.add_job(
        lambda: _run_async_job(reconcile_paid_payments),
        CronTrigger(minute="*/5", timezone=_SCHEDULER_TIMEZONE),
        id="reconcile_paid_payments",
        name="Reconcile paid but unactivated payments",
        replace_existing=True,
    )

    # Payment expiry: every hour, expire pending payment intents older
    # than 24 hours.
    scheduler.add_job(
        lambda: _run_async_job(expire_overdue_payments),
        CronTrigger(minute=0, timezone=_SCHEDULER_TIMEZONE),
        id="expire_overdue_payments",
        name="Expire overdue payment intents",
        replace_existing=True,
    )

    return scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    clear_request_context()
    reset_metrics()
    logger.info(
        "app_started",
        app_name=settings.app_name,
        version=app.version,
        env=settings.app_env,
        log_level=settings.log_level,
    )
    await db_module.connect_db()
    await seed_default_plans()
    logger.info("plans_seeded")
    catalog = await load_exam_catalog_from_db(db_module.db)
    logger.info("practice_catalog_loaded", exam_count=len(catalog.exams_by_id))

    scheduler = _build_scheduler()
    scheduler.start()
    logger.info(
        "subscription_scheduler_started",
        timezone=_SCHEDULER_TIMEZONE,
        job_count=len(scheduler.get_jobs()),
    )

    try:
        yield
    finally:
        scheduler.shutdown(wait=False)
        logger.info("subscription_scheduler_stopped")
        logger.info("app_stopped")
        await db_module.close_db()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

allowed_origins = list(settings.cors_origins)
if settings.app_env == "development":
    allowed_origins.append("http://localhost:3000")
    allowed_origins.append("http://127.0.0.1:3000")


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or str(uuid4())
    bind_request_context(request_id=request_id)
    start = perf_counter()
    request_logger = get_logger("toan_truc_quan.request")

    try:
        response = await call_next(request)
    except Exception as exc:
        duration_ms = round((perf_counter() - start) * 1000, 2)
        record_request_duration(duration_ms)
        request_logger.exception(
            "request_failed",
            method=request.method,
            path=request.url.path,
            duration_ms=duration_ms,
            client_ip=request.client.host if request.client else None,
            error_type=type(exc).__name__,
        )
        response = JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "error_code": "INTERNAL_ERROR",
                "request_id": request_id,
            },
        )
        # Belt+suspenders: add CORS header in case CORSMiddleware
        # doesn't wrap this error path (ASGI edge case).
        origin = request.headers.get("origin")
        if origin and origin in allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = (
                "GET, POST, PUT, DELETE, OPTIONS"
            )
            response.headers["Access-Control-Allow-Headers"] = (
                "Content-Type, Authorization, X-Request-ID"
            )
            response.headers["Vary"] = "Origin"
        response.headers["X-Request-ID"] = request_id
        return response
    else:
        duration_ms = round((perf_counter() - start) * 1000, 2)
        record_request_duration(duration_ms)
        response.headers["X-Request-ID"] = request_id
        request_logger.info(
            "request_completed",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
            client_ip=request.client.host if request.client else None,
        )
        return response
    finally:
        unbind_request_context("request_id")


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/health")
async def health():
    return await check_health()
