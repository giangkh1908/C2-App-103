from collections.abc import AsyncGenerator
from time import perf_counter
from typing import Any

from src.core.config import settings
from src.core.logging import get_logger
from src.core.metrics import record_llm_failure, record_llm_request

from .base import BaseLLMClient, LLMMessage, LLMResponse, LLMStreamUsage, LLMToolCall

logger = get_logger("toan_truc_quan.llm.openrouter")


class OpenRouterClient(BaseLLMClient):
    def __init__(
        self,
        api_key: str,
        model: str = "deepseek/deepseek-v4-flash",
        base_url: str = "https://openrouter.ai/api/v1",
        site_url: str = "http://localhost:3000",
        app_name: str = "mathbuddy-ai-backend",
        temperature: float = 0.7,
        max_tokens: int = 2048,
        _backend: bool = False,
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.site_url = site_url
        self.app_name = app_name
        self.temperature = temperature
        self.max_tokens = max_tokens

        if not _backend:
            from src.llm.model_router import ModelRouter

            self._router: ModelRouter = ModelRouter()

    async def generate(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> LLMResponse:
        # Build prompt preview from first user message
        prompt_preview = ""
        for msg in messages:
            if msg.role == "user":
                prompt_preview = msg.content[:200]
                break

        start = perf_counter()
        try:
            response = await self._router.generate(messages=messages, tools=tools)
        except Exception as exc:
            latency_ms = round((perf_counter() - start) * 1000, 2)
            from src.services.llm_audit import log_llm_call

            await log_llm_call(
                model=self.model,
                user_id=None,
                prompt_preview=prompt_preview,
                tokens_in=0,
                tokens_out=0,
                cost_usd=0.0,
                latency_ms=latency_ms,
                status="failure",
                error=str(exc),
            )
            record_llm_failure(type(exc).__name__)
            logger.exception(
                "openrouter_request_failed",
                model=self.model,
                message_count=len(messages),
            )
            raise

        latency_ms = round((perf_counter() - start) * 1000, 2)

        # Extract usage from raw response
        raw = response.raw or {}
        usage = raw.get("usage") or {}
        prompt_tokens = usage.get("prompt_tokens", 0) or 0
        completion_tokens = usage.get("completion_tokens", 0) or 0
        tokens = usage.get("total_tokens", 0) or 0

        # Compute cost
        cost_usd = (
            prompt_tokens * settings.openrouter_prompt_cost_per_1m
            + completion_tokens * settings.openrouter_completion_cost_per_1m
        ) / 1_000_000

        from src.services.llm_audit import log_llm_call

        await log_llm_call(
            model=self.model,
            user_id=None,
            prompt_preview=prompt_preview,
            tokens_in=prompt_tokens,
            tokens_out=completion_tokens,
            cost_usd=cost_usd,
            latency_ms=latency_ms,
            status="success",
            error=None,
        )

        record_llm_request(model=self.model, tokens=tokens, latency_ms=latency_ms)

        logger.debug(
            "openrouter_response_received",
            model=self.model,
            tokens_used=tokens,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
            has_tool_call=bool(response.tool_call),
        )

        return response

    async def generate_stream(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncGenerator[str | LLMToolCall | LLMStreamUsage, None]:
        """Stream tokens from OpenRouter via ModelRouter (with fallback).

        Yields str text chunks as they arrive, or a single LLMToolCall
        object when the model requests a tool (arguments fully accumulated).
        """
        # Build prompt preview from first user message
        prompt_preview = ""
        for msg in messages:
            if msg.role == "user":
                prompt_preview = msg.content[:200]
                break

        start = perf_counter()
        prompt_tokens: int = 0
        completion_tokens: int = 0
        tokens: int = 0
        is_tool_call: bool = False
        error: Exception | None = None

        try:
            async for chunk in self._router.generate_stream(messages=messages, tools=tools):
                if isinstance(chunk, LLMToolCall):
                    is_tool_call = True
                elif isinstance(chunk, LLMStreamUsage):
                    prompt_tokens = chunk.prompt_tokens
                    completion_tokens = chunk.completion_tokens
                    tokens = prompt_tokens + completion_tokens
                yield chunk
        except Exception as exc:
            error = exc
            logger.exception(
                "openrouter_stream_failed",
                model=self.model,
                message_count=len(messages),
            )
            record_llm_failure(type(exc).__name__)
            raise
        finally:
            latency_ms = round((perf_counter() - start) * 1000, 2)

            if error is not None:
                from src.services.llm_audit import log_llm_call

                await log_llm_call(
                    model=self.model,
                    user_id=None,
                    prompt_preview=prompt_preview,
                    tokens_in=0,
                    tokens_out=0,
                    cost_usd=0.0,
                    latency_ms=latency_ms,
                    status="failure",
                    error=str(error),
                )
            else:
                cost_usd = (
                    prompt_tokens * settings.openrouter_prompt_cost_per_1m
                    + completion_tokens * settings.openrouter_completion_cost_per_1m
                ) / 1_000_000

                from src.services.llm_audit import log_llm_call

                await log_llm_call(
                    model=self.model,
                    user_id=None,
                    prompt_preview=prompt_preview,
                    tokens_in=prompt_tokens,
                    tokens_out=completion_tokens,
                    cost_usd=cost_usd,
                    latency_ms=latency_ms,
                    status="success",
                    error=None,
                )

                record_llm_request(model=self.model, tokens=tokens, latency_ms=latency_ms)
                logger.debug(
                    "openrouter_stream_done",
                    model=self.model,
                    tokens_used=tokens,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    latency_ms=latency_ms,
                    is_tool_call=is_tool_call,
                )
