"""
model_router.py — LLM client with automatic model fallback.

Wraps an ``OpenRouterClient`` internally and provides
``generate_with_fallback()`` that tries models in order, with
exponential backoff between attempts.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from typing import Any

from src.core.config import settings
from src.core.logging import get_logger
from src.core.metrics import record_fallback

from .base import BaseLLMClient, LLMMessage, LLMResponse, LLMStreamUsage, LLMToolCall
from .openrouter_client import OpenRouterClient

logger = get_logger("toan_truc_quan.llm.router")

# ── Constants ────────────────────────────────────────────────────────────

_INITIAL_BACKOFF: float = 1.0
_MAX_BACKOFF: float = 4.0
_BACKOFF_FACTOR: int = 2


class ModelRouter(BaseLLMClient):
    """LLM client with automatic model fallback.

    Wraps :class:`OpenRouterClient` and provides
    :meth:`generate_with_fallback` that tries models in order, with
    exponential backoff (1s, 2s, 4s) between each attempt.

    If ``settings.llm_fallback_models`` is empty, behaves as a
    single-model client (no fallback).
    """

    def __init__(self) -> None:
        self._client = OpenRouterClient(
            api_key=settings.openrouter_api_key,
            model=settings.openrouter_model,
            base_url=settings.openrouter_base_url,
            site_url=settings.openrouter_site_url,
            app_name=settings.openrouter_app_name,
            temperature=settings.openrouter_temperature,
            max_tokens=settings.openrouter_max_tokens,
            _backend=True,  # prevent infinite recursion
        )

    # ── BaseLLMClient interface ──────────────────────────────────────────

    async def generate(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> LLMResponse:
        """Single-model convenience wrapper.

        Delegates to :meth:`generate_with_fallback` with the
        default preferred model from settings.
        """
        return await self.generate_with_fallback(
            messages=messages,
            tools=tools,
            preferred_model=None,
        )

    async def generate_stream(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncGenerator[str | LLMToolCall | LLMStreamUsage, None]:
        """Stream with model fallback.

        Tries each model's ``generate_stream()`` in order.  If a model
        fails **before** the first chunk is yielded, the next model is
        attempted with exponential backoff.  Once streaming starts,
        errors propagate directly to the caller.
        """
        models_to_try = _build_model_list()
        delay = _INITIAL_BACKOFF
        last_error: Exception | None = None

        for i, model in enumerate(models_to_try):
            try:
                self._client.model = model
                async for chunk in self._client.generate_stream(
                    messages=messages,
                    tools=tools,
                ):
                    yield chunk
                return  # stream completed successfully
            except Exception as exc:
                last_error = exc
                if i < len(models_to_try) - 1:
                    logger.warning(
                        "model_fallback",
                        from_model=model,
                        to_model=models_to_try[i + 1],
                        reason=str(exc),
                    )
                    record_fallback(model)
                    await asyncio.sleep(delay)
                    delay = min(delay * _BACKOFF_FACTOR, _MAX_BACKOFF)
                continue

        if last_error is not None:
            raise last_error

    # ── Public fallback method ───────────────────────────────────────────

    async def generate_with_fallback(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
        preferred_model: str | None = None,
    ) -> LLMResponse:
        """Try models in order with exponential backoff.

        Args:
            messages: Conversation history.
            tools: Optional tool schemas for function calling.
            preferred_model: Model to try first.  Defaults to
                ``settings.openrouter_model`` when ``None``.

        Returns:
            The first successful :class:`LLMResponse`.

        Raises:
            The last exception if every model fails.
        """
        models_to_try = _build_model_list(preferred_model)
        delay = _INITIAL_BACKOFF
        last_error: Exception | None = None

        for i, model in enumerate(models_to_try):
            try:
                self._client.model = model
                return await self._client.generate(
                    messages=messages,
                    tools=tools,
                )
            except Exception as exc:
                last_error = exc
                if i < len(models_to_try) - 1:
                    logger.warning(
                        "model_fallback",
                        from_model=model,
                        to_model=models_to_try[i + 1],
                        reason=str(exc),
                    )
                    record_fallback(model)
                    await asyncio.sleep(delay)
                    delay = min(delay * _BACKOFF_FACTOR, _MAX_BACKOFF)
                continue

        # Every model failed — surface the last error
        if last_error is not None:
            raise last_error

        # Defensive: should never reach here when settings are valid
        msg = "No models configured and no error recorded"
        raise RuntimeError(msg)


# ── Helpers ──────────────────────────────────────────────────────────────


def _build_model_list(preferred_model: str | None = None) -> list[str]:
    """Build the ordered list of models to try.

    The first entry is *preferred_model* (or
    ``settings.openrouter_model`` if that is ``None``).  Followed by
    the comma-separated fallback models from
    ``settings.llm_fallback_models``.

    Returns a single-element list when no fallback models are
    configured.
    """
    primary = preferred_model if preferred_model is not None else settings.openrouter_model
    fallback_raw = settings.llm_fallback_models
    if fallback_raw:
        fallback = [m.strip() for m in fallback_raw.split(",") if m.strip()]
        return [primary, *fallback]
    return [primary]
