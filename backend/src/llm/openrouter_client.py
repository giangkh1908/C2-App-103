from collections.abc import AsyncGenerator
from time import perf_counter
from typing import Any

import httpx

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
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.site_url = site_url
        self.app_name = app_name
        self.temperature = temperature
        self.max_tokens = max_tokens

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
            request_body = self._build_request_body(messages, tools, stream=False)
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{self.base_url}/chat/completions",
                    json=request_body,
                    headers=self._headers(),
                    timeout=60.0,
                )
                resp.raise_for_status()
                data = resp.json()
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

        response = self._parse_response(data)

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
        """Stream tokens from OpenRouter via direct HTTP call.

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
        is_tool_call: bool = False
        error: Exception | None = None

        try:
            request_body = self._build_request_body(messages, tools, stream=True)
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    json=request_body,
                    headers=self._headers(),
                    timeout=60.0,
                ) as resp:
                    resp.raise_for_status()
                    async for chunk in self._parse_stream(resp.aiter_lines()):
                        if isinstance(chunk, LLMToolCall):
                            is_tool_call = True
                        elif isinstance(chunk, LLMStreamUsage):
                            prompt_tokens = chunk.prompt_tokens
                            completion_tokens = chunk.completion_tokens
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

                record_llm_request(model=self.model, tokens=prompt_tokens + completion_tokens, latency_ms=latency_ms)
                logger.debug(
                    "openrouter_stream_done",
                    model=self.model,
                    tokens_used=prompt_tokens + completion_tokens,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    latency_ms=latency_ms,
                    is_tool_call=is_tool_call,
                )

    # ── Helpers ──────────────────────────────────────────────────────────────

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": self.site_url,
            "X-Title": self.app_name,
        }

    def _build_request_body(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None,
        *,
        stream: bool,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {
            "model": self.model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "stream": stream,
        }
        if tools:
            body["tools"] = tools
            body["tool_choice"] = "auto"
        if stream:
            body["stream_options"] = {"include_usage": True}
        return body

    def _parse_response(self, data: dict[str, Any]) -> LLMResponse:
        choice = data.get("choices", [{}])[0]
        message = choice.get("message") or {}
        content = message.get("content") or ""

        # Tool call handling
        raw_tool_calls = message.get("tool_calls")
        if raw_tool_calls:
            tool_call = raw_tool_calls[0]
            function = tool_call.get("function") or {}
            arguments_str = function.get("arguments") or "{}"
            try:
                arguments = self._safe_json_loads(arguments_str)
            except Exception:
                arguments = {}
            return LLMResponse(
                tool_call=LLMToolCall(
                    name=function.get("name", ""),
                    arguments=arguments,
                ),
                raw=data,
            )

        return LLMResponse(content=content or None, raw=data)

    async def _parse_stream(
        self,
        line_iterator: AsyncGenerator[str, None],
    ) -> AsyncGenerator[str | LLMToolCall | LLMStreamUsage, None]:
        content_buffer = ""
        tool_calls: dict[int, dict[str, Any]] = {}
        usage: dict[str, int] = {}

        async for line in line_iterator:
            line = line.strip()
            if not line or not line.startswith("data: "):
                continue
            payload = line[len("data: "):].strip()
            if payload == "[DONE]":
                break

            try:
                chunk = self._safe_json_loads(payload)
            except Exception:
                continue

            choices = chunk.get("choices") or []
            if not choices:
                # Usage chunk when stream_options.include_usage is supported
                chunk_usage = chunk.get("usage")
                if chunk_usage:
                    usage = {
                        "prompt_tokens": chunk_usage.get("prompt_tokens", 0) or 0,
                        "completion_tokens": chunk_usage.get("completion_tokens", 0) or 0,
                    }
                continue

            delta = choices[0].get("delta") or {}
            delta_content = delta.get("content")
            if delta_content:
                content_buffer += delta_content
                yield delta_content

            delta_tool_calls = delta.get("tool_calls")
            if delta_tool_calls:
                for raw_tc in delta_tool_calls:
                    index = raw_tc.get("index", 0)
                    existing = tool_calls.setdefault(
                        index,
                        {"id": "", "name": "", "arguments": ""},
                    )
                    tc_id = raw_tc.get("id")
                    if tc_id:
                        existing["id"] = tc_id
                    function = raw_tc.get("function") or {}
                    name = function.get("name")
                    if name:
                        existing["name"] = name
                    arguments = function.get("arguments")
                    if arguments:
                        existing["arguments"] += arguments

            finish_reason = choices[0].get("finish_reason")
            if finish_reason == "tool_calls" and tool_calls:
                first = tool_calls[min(tool_calls.keys())]
                try:
                    arguments = self._safe_json_loads(first["arguments"] or "{}")
                except Exception:
                    arguments = {}
                yield LLMToolCall(name=first["name"], arguments=arguments)

        # Stream ended — emit usage if available
        if usage:
            yield LLMStreamUsage(
                prompt_tokens=usage.get("prompt_tokens", 0),
                completion_tokens=usage.get("completion_tokens", 0),
            )

    def _safe_json_loads(self, value: str) -> Any:
        import json

        return json.loads(value)
