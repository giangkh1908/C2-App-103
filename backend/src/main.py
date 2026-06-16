from contextlib import asynccontextmanager
from time import perf_counter
from uuid import uuid4

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

configure_logging()

logger = get_logger(APP_LOGGER_NAME := "toan_truc_quan")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Re-apply our logging configuration after uvicorn has installed its own
    # default plain-text handlers.
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
    yield
    logger.info("app_stopped")
    await db_module.close_db()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

allowed_origins = {
    settings.frontend_url.rstrip("/"),
}
if settings.app_env == "development":
    allowed_origins.add("http://localhost:3000")
    allowed_origins.add("http://127.0.0.1:3000")



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
        _set_cors_headers(response, request)
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


def _set_cors_headers(response: JSONResponse, request: Request) -> None:
    origin = request.headers.get("origin")
    if origin and origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, DELETE, OPTIONS"
        )
        response.headers["Access-Control-Allow-Headers"] = (
            "Content-Type, Authorization, X-Request-ID"
        )
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"


app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
)

app.include_router(api_router, prefix=settings.api_prefix)


@app.get("/health")
async def health():
    return await check_health()
