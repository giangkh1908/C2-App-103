"""Langfuse client wrapper with None-safe graceful degradation.

The module always exposes helper functions; if Langfuse is disabled or
misconfigured every helper returns ``None`` so callers never crash.
"""

from __future__ import annotations

from typing import Any

from src.core.config import settings

_langfuse_client: Any | None = None
_client_initialized: bool = False


def get_langfuse_client() -> Any | None:
    """Return a Langfuse client or None if disabled/unavailable."""
    global _langfuse_client, _client_initialized

    if _client_initialized:
        return _langfuse_client

    if not settings.langfuse_enabled:
        _client_initialized = True
        return None

    if not all(
        [
            settings.langfuse_secret_key,
            settings.langfuse_public_key,
            settings.langfuse_host,
        ]
    ):
        _client_initialized = True
        return None

    try:
        from langfuse import Langfuse

        _langfuse_client = Langfuse(
            secret_key=settings.langfuse_secret_key,
            public_key=settings.langfuse_public_key,
            host=settings.langfuse_host,
        )
    except Exception:
        _langfuse_client = None

    _client_initialized = True
    return _langfuse_client


def trace_observation(
    name: str,
    *,
    request_id: str | None = None,
    user_id: str | None = None,
    session_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> Any | None:
    """Create a Langfuse trace or return None."""
    langfuse = get_langfuse_client()
    if langfuse is None:
        return None

    kwargs: dict[str, Any] = {"name": name}
    if request_id:
        kwargs["id"] = request_id
    if user_id:
        kwargs["user_id"] = user_id
    if session_id:
        kwargs["session_id"] = session_id
    if metadata:
        kwargs["metadata"] = metadata

    try:
        return langfuse.trace(**kwargs)
    except Exception:
        return None


def span_observation(
    trace: Any | None,
    name: str,
    *,
    metadata: dict[str, Any] | None = None,
) -> Any | None:
    """Create a span under a trace or return None."""
    if trace is None:
        return None

    kwargs: dict[str, Any] = {"name": name}
    if metadata:
        kwargs["metadata"] = metadata

    try:
        return trace.span(**kwargs)
    except Exception:
        return None


def generation_observation(
    trace_or_span: Any | None,
    *,
    name: str,
    model: str | None = None,
    input_messages: list[dict[str, Any]] | None = None,
    output: Any | None = None,
    metadata: dict[str, Any] | None = None,
    usage: dict[str, Any] | None = None,
) -> Any | None:
    """Create a generation observation or return None."""
    if trace_or_span is None:
        return None

    kwargs: dict[str, Any] = {"name": name}
    if model:
        kwargs["model"] = model
    if input_messages:
        kwargs["input"] = input_messages
    if output is not None:
        kwargs["output"] = output
    if metadata:
        kwargs["metadata"] = metadata
    if usage:
        kwargs["usage"] = usage

    try:
        return trace_or_span.generation(**kwargs)
    except Exception:
        return None
