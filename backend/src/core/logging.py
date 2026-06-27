"""Structured logging configuration using structlog.

Exports:
    configure_logging: one-time setup called at application startup.
    get_logger: typed helper to obtain a structlog logger by name.
    bind_request_context: bind request-scoped context (request_id, etc.).
    clear_request_context: remove request-scoped bindings.
"""

from __future__ import annotations

import hashlib
import json
import logging as stdlib_logging
import re
import sys
from datetime import UTC, datetime
from typing import Any

import structlog
from structlog.contextvars import (
    bind_contextvars as _bind_contextvars,
)
from structlog.contextvars import (
    clear_contextvars as _clear_contextvars,
)
from structlog.contextvars import (
    merge_contextvars,
)
from structlog.contextvars import (
    unbind_contextvars as _unbind_contextvars,
)
from structlog.typing import EventDict, WrappedLogger

from src.core.config import settings

APP_LOGGER_NAME = "toan_truc_quan"
REQUEST_LOGGER_NAME = f"{APP_LOGGER_NAME}.request"

# ---------------------------------------------------------------------------
# PII scrubbing helpers
# ---------------------------------------------------------------------------

_EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
_PHONE_RE = re.compile(r"(?:\+?84|0)(?:\d{9}|\d{10})\b")
_JWT_RE = re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}")
_PASSWORD_JSON_RE = re.compile(
    r'"password"\s*:\s*"[^"]*"',
    flags=re.IGNORECASE,
)
_USER_ID_LIKE_RE = re.compile(r"\buser_[a-f0-9]{24,}\b")
# API keys / tokens (common prefixes)
_API_KEY_RE = re.compile(r"\b(?:sk|pk|rk|ghp|gho|ghu|ghs|ghr|AKIA|eyJ)[A-Za-z0-9_-]{8,63}\b")
# Bearer tokens in headers
_BEARER_RE = re.compile(r"(?:bearer|Bearer)\s+[A-Za-z0-9._-]{8,512}")
# Opaque looks-like-secret: long hex or base64-like strings (32+ chars)
_LONG_OPAQUE_RE = re.compile(r"\b[A-Fa-f0-9]{32,}\b")


def hash_user_id(user_id: str) -> str:
    """Return a deterministic short hash for a raw user id.

    NEVER log raw user_id. Use this helper instead.
    """
    return hashlib.sha256(user_id.encode("utf-8")).hexdigest()[:8]


def _scrub_string(value: str) -> str:
    """Redact sensitive tokens inside a string value."""
    value = _PASSWORD_JSON_RE.sub('"password": "[REDACTED]"', value)
    value = _BEARER_RE.sub("[TOKEN_REDACTED]", value)
    value = _EMAIL_RE.sub("[EMAIL_REDACTED]", value)
    value = _PHONE_RE.sub("[PHONE_REDACTED]", value)
    value = _JWT_RE.sub("[TOKEN_REDACTED]", value)
    value = _API_KEY_RE.sub("[TOKEN_REDACTED]", value)
    value = _LONG_OPAQUE_RE.sub("[TOKEN_REDACTED]", value)
    value = _USER_ID_LIKE_RE.sub(lambda match: hash_user_id(match.group(0)), value)
    return value


# Keys whose values should always be redacted.
# Uses suffix matching for compound keys and exact matching for simple keys
# to avoid over-redacting observability fields like tokens_used, tool_arg_keys.
_SENSITIVE_KEY_SUFFIXES = frozenset({"_key", "_token", "_secret"})
_SENSITIVE_EXACT_KEYS = frozenset(
    {
        "password",
        "secret",
        "authorization",
        "cookie",
        "jwt",
        "credential",
    }
)


def _scrub_value(value: Any) -> Any:
    """Recursively scrub PII from a log value."""
    if isinstance(value, str):
        return _scrub_string(value)
    if isinstance(value, dict):
        return {
            key: "[REDACTED]"
            if isinstance(key, str) and _is_sensitive_key(key)
            else _scrub_value(val)
            for key, val in value.items()
        }
    if isinstance(value, list):
        return [_scrub_value(item) for item in value]
    return value


def _is_sensitive_key(key: str) -> bool:
    """Check if a dict key should be redacted."""
    key_lower = key.lower()
    if key_lower in _SENSITIVE_EXACT_KEYS:
        return True
    if any(key_lower.endswith(s) for s in _SENSITIVE_KEY_SUFFIXES):
        return True
    return False


# ---------------------------------------------------------------------------
# Custom structlog processors
# ---------------------------------------------------------------------------


def add_timestamp(
    logger: WrappedLogger,
    method_name: str,
    event_dict: EventDict,
) -> EventDict:
    """Add an ISO 8601 UTC timestamp to every log event."""
    event_dict["timestamp"] = datetime.now(UTC).isoformat()
    return event_dict


def scrub_pii(
    logger: WrappedLogger,
    method_name: str,
    event_dict: EventDict,
) -> EventDict:
    """Scrub PII from event and bound fields before JSON serialization."""
    event_dict["event"] = _scrub_value(event_dict.get("event"))
    for key in list(event_dict.keys()):
        if key in {"timestamp", "level", "logger", "event"}:
            continue
        event_dict[key] = _scrub_value(event_dict[key])
    return event_dict


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def configure_logging(log_level: str | None = None) -> None:
    """Configure structlog for JSONL stdout and rotating file output.

    Console (stdout): INFO and above for a clean terminal.
    File (LOG_FILE_PATH): DEBUG and above for detailed debugging.
    """
    from logging.handlers import RotatingFileHandler
    from pathlib import Path

    level_name = (log_level or settings.log_level).upper()
    level = getattr(stdlib_logging, level_name, stdlib_logging.INFO)
    file_level = getattr(stdlib_logging, settings.log_file_level.upper(), stdlib_logging.DEBUG)
    console_level = stdlib_logging.INFO

    # Processors applied to structlog events. The final processor hands the
    # event dict off to ProcessorFormatter for rendering.
    structlog_processors: list[Any] = [
        merge_contextvars,
        structlog.stdlib.ExtraAdder(),
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        add_timestamp,
        scrub_pii,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
    ]

    structlog.configure(
        processors=structlog_processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Processors applied to stdlib log records before handing them to the JSON renderer.
    foreign_pre_chain: list[Any] = [
        structlog.stdlib.ExtraAdder(),
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        add_timestamp,
        scrub_pii,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    formatter = structlog.stdlib.ProcessorFormatter(
        processor=structlog.processors.JSONRenderer(serializer=_json_dump, sort_keys=False),
        foreign_pre_chain=foreign_pre_chain,
    )

    # Console handler: concise, INFO+
    console_handler = stdlib_logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(console_level)

    # File handler: detailed, DEBUG+, rotating
    log_path = Path(settings.log_file_path)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    file_handler = RotatingFileHandler(
        log_path,
        maxBytes=settings.log_file_max_bytes,
        backupCount=settings.log_file_backup_count,
        encoding="utf-8",
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(file_level)

    root_logger = stdlib_logging.getLogger()
    # Close previous handlers (file descriptors, etc.) before replacing them.
    for h in root_logger.handlers[:]:
        root_logger.removeHandler(h)
        h.close()
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    root_logger.setLevel(min(console_level, file_level))

    for logger_name in (
        APP_LOGGER_NAME,
        REQUEST_LOGGER_NAME,
    ):
        logger = stdlib_logging.getLogger(logger_name)
        logger.setLevel(level)
        logger.propagate = True

    # Uvicorn installs its own plain-text handlers at startup. Replace them
    # with our JSON handlers so logs are emitted once and in JSONL format.
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        logger = stdlib_logging.getLogger(logger_name)
        logger.handlers.clear()
        logger.addHandler(console_handler)
        logger.addHandler(file_handler)
        logger.setLevel(console_level)
        logger.propagate = False

    # pymongo, httpcore, httpx, urllib3 are very noisy at DEBUG/INFO; cap at INFO.
    for logger_name in (
        "pymongo",
        "pymongo.topology",
        "pymongo.connection",
        "pymongo.command",
        "pymongo.serverSelection",
        "httpx",
        "httpcore",
        "httpcore.http11",
        "httpcore.connection",
        "urllib3",
        "urllib3.connectionpool",
    ):
        logger = stdlib_logging.getLogger(logger_name)
        logger.setLevel(stdlib_logging.INFO)


def _json_dump(obj: Any, **kwargs: Any) -> str:
    """Compact JSON serialization matching the original JSONL format."""
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"), **kwargs)


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """Return a structlog logger."""
    if name is None:
        return structlog.get_logger()
    return structlog.get_logger(name)


def bind_request_context(**kwargs: Any) -> None:
    """Bind request-scoped fields into structlog context."""
    _bind_contextvars(**kwargs)


def clear_request_context() -> None:
    """Clear all structlog context bindings."""
    _clear_contextvars()


def unbind_request_context(*keys: str) -> None:
    """Remove specific structlog context bindings."""
    _unbind_contextvars(*keys)
