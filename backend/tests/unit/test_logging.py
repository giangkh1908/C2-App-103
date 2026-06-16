import json
import logging

import pytest
from httpx import AsyncClient

from src.core.logging import (
    bind_request_context,
    clear_request_context,
    configure_logging,
    get_logger,
    hash_user_id,
    unbind_request_context,
)


def _capture_json(capsys, logger_name):
    """Return parsed JSON log events captured from stdout for a given logger."""
    captured = capsys.readouterr()
    events = []
    for line in (captured.out + captured.err).strip().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            parsed = json.loads(line)
        except json.JSONDecodeError:
            continue
        if parsed.get("logger") == logger_name:
            events.append(parsed)
    return events


def test_configure_logging_sets_app_and_uvicorn_levels():
    configure_logging("DEBUG")

    assert logging.getLogger().level == logging.DEBUG
    assert logging.getLogger("toan_truc_quan").level == logging.DEBUG
    assert logging.getLogger("toan_truc_quan.request").level == logging.DEBUG
    # Uvicorn is capped at INFO to keep the terminal clean.
    assert logging.getLogger("uvicorn").level == logging.INFO


def test_structlog_json_output(capsys):
    configure_logging("DEBUG")

    logger = get_logger("toan_truc_quan.test")
    logger.info("hello_structlog", foo="bar")

    events = _capture_json(capsys, "toan_truc_quan.test")
    assert len(events) == 1
    event = events[0]
    assert event["event"] == "hello_structlog"
    assert event["level"] == "info"
    assert event["logger"] == "toan_truc_quan.test"
    assert event["foo"] == "bar"
    assert "timestamp" in event


def test_request_id_bound_to_context(capsys):
    configure_logging("DEBUG")
    clear_request_context()

    bind_request_context(request_id="req-test-123")
    try:
        logger = get_logger("toan_truc_quan.test")
        logger.info("with_request_id")
    finally:
        unbind_request_context("request_id")

    events = _capture_json(capsys, "toan_truc_quan.test")
    assert len(events) == 1
    assert events[0]["request_id"] == "req-test-123"


@pytest.mark.asyncio
async def test_request_logging_adds_generated_request_id(client: AsyncClient):
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.headers["X-Request-ID"]


@pytest.mark.asyncio
async def test_request_logging_preserves_client_request_id(client: AsyncClient):
    response = await client.get("/health", headers={"X-Request-ID": "client-req-1"})

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "client-req-1"


@pytest.mark.asyncio
async def test_request_logging_does_not_log_sensitive_headers(
    client: AsyncClient,
    capsys,
):
    configure_logging("INFO")

    response = await client.get(
        "/health",
        headers={
            "Authorization": "Bearer secret-access-token",
            "Cookie": "refresh_token=secret-refresh-token",
            "X-Request-ID": "safe-request-id",
        },
    )

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "safe-request-id"

    events = _capture_json(capsys, "toan_truc_quan.request")
    assert any(event["event"] == "request_completed" for event in events)
    assert any(event.get("request_id") == "safe-request-id" for event in events)
    output = capsys.readouterr().out + capsys.readouterr().err
    assert "secret-access-token" not in output
    assert "secret-refresh-token" not in output
    assert "Authorization" not in output
    assert "Cookie" not in output


@pytest.mark.asyncio
async def test_request_logging_does_not_swallow_error_responses(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.headers["X-Request-ID"]


def test_hash_user_id_is_deterministic():
    assert hash_user_id("user_abc123") == hash_user_id("user_abc123")
    assert hash_user_id("user_abc123") != hash_user_id("user_xyz789")


def test_structlog_scrubs_pii_in_event(capsys):
    configure_logging("DEBUG")

    logger = get_logger("toan_truc_quan.test")
    logger.info("contact me at student@example.com or 0909123456")

    events = _capture_json(capsys, "toan_truc_quan.test")
    assert len(events) == 1
    message = events[0]["event"]
    assert "student@example.com" not in message
    assert "0909123456" not in message
    assert "[EMAIL_REDACTED]" in message
    assert "[PHONE_REDACTED]" in message
