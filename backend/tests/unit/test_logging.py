import json
import logging

import pytest
from httpx import AsyncClient

from core.logging import JsonLogFormatter, configure_logging, request_id_ctx


def test_configure_logging_sets_app_and_uvicorn_levels():
    configure_logging("DEBUG")

    assert logging.getLogger().level == logging.DEBUG
    assert logging.getLogger("toan_truc_quan").level == logging.DEBUG
    assert logging.getLogger("toan_truc_quan.request").level == logging.DEBUG
    assert logging.getLogger("uvicorn").level == logging.DEBUG


def test_json_formatter_includes_request_id_from_context():
    token = request_id_ctx.set("req-test-123")
    try:
        record = logging.LogRecord(
            name="toan_truc_quan.test",
            level=logging.INFO,
            pathname=__file__,
            lineno=1,
            msg="hello",
            args=(),
            exc_info=None,
        )
        payload = json.loads(JsonLogFormatter().format(record))
    finally:
        request_id_ctx.reset(token)

    assert payload["level"] == "INFO"
    assert payload["logger"] == "toan_truc_quan.test"
    assert payload["message"] == "hello"
    assert payload["request_id"] == "req-test-123"


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
    caplog: pytest.LogCaptureFixture,
):
    caplog.set_level(logging.INFO, logger="toan_truc_quan.request")

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
    request_records = [
        record for record in caplog.records if record.name == "toan_truc_quan.request"
    ]
    assert any(record.getMessage() == "request_completed" for record in request_records)
    assert any(
        getattr(record, "request_id", None) == "safe-request-id"
        for record in request_records
    )
    assert "secret-access-token" not in caplog.text
    assert "secret-refresh-token" not in caplog.text
    assert "Authorization" not in caplog.text
    assert "Cookie" not in caplog.text


@pytest.mark.asyncio
async def test_request_logging_does_not_swallow_error_responses(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 403
    assert response.headers["X-Request-ID"]
