import json
from collections.abc import AsyncGenerator
from time import perf_counter
from typing import Any

import httpx

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
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": [
                {"role": message.role, "content": message.content} for message in messages
            ],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": self.site_url,
            "X-Title": self.app_name,
        }

        start = perf_counter()
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
        except Exception as exc:
            logger.exception(
                "openrouter_request_failed",
                model=self.model,
                message_count=len(messages),
            )
            record_llm_failure(type(exc).__name__)
            raise
        finally:
            latency_ms = round((perf_counter() - start) * 1000, 2)

        message = data["choices"][0]["message"]
        tool_calls = message.get("tool_calls") or []
        usage = data.get("usage") or {}
        tokens = usage.get("total_tokens", 0)
        prompt_tokens = usage.get("prompt_tokens", 0)
        completion_tokens = usage.get("completion_tokens", 0)

        record_llm_request(model=self.model, tokens=tokens, latency_ms=latency_ms)

        logger.debug(
            "openrouter_response_received",
            model=self.model,
            tokens_used=tokens,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
            has_tool_call=bool(tool_calls),
        )

        if tool_calls:
            raw_tool_call = tool_calls[0]
            function = raw_tool_call.get("function", {})
            name = str(function.get("name", ""))

            try:
                arguments = json.loads(function.get("arguments", "{}"))
            except (json.JSONDecodeError, TypeError):
                arguments = {}

            if not isinstance(arguments, dict):
                arguments = {}

            return LLMResponse(
                content=message.get("content"),
                tool_call=LLMToolCall(name=name, arguments=arguments),
                raw=data,
            )

        return LLMResponse(
            content=message.get("content", "") or "",
            raw=data,
        )

    async def generate_stream(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncGenerator[str | LLMToolCall | LLMStreamUsage, None]:
        """Stream tokens from OpenRouter using SSE.

        Yields str text chunks as they arrive, or a single LLMToolCall
        object when the model requests a tool (arguments fully accumulated).
        """
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "stream": True,
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": self.site_url,
            "X-Title": self.app_name,
        }

        tool_call_name: str = ""
        tool_call_args: str = ""
        is_tool_call: bool = False
        tokens: int = 0
        prompt_tokens: int = 0
        completion_tokens: int = 0
        start = perf_counter()

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                ) as response:
                    response.raise_for_status()
                    async for line in response.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        data_str = line[6:].strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                        except json.JSONDecodeError:
                            continue

                        if "usage" in data and data["usage"]:
                            tokens = data["usage"].get("total_tokens", 0)
                            prompt_tokens = data["usage"].get("prompt_tokens", 0)
                            completion_tokens = data["usage"].get("completion_tokens", 0)

                        choices = data.get("choices") or []
                        if not choices:
                            continue
                        choice = choices[0]
                        delta = choice.get("delta") or {}
                        finish_reason = choice.get("finish_reason")

                        content = delta.get("content") or ""
                        if content:
                            yield content

                        for tc_delta in delta.get("tool_calls") or []:
                            is_tool_call = True
                            fn = tc_delta.get("function") or {}
                            if fn.get("name"):
                                tool_call_name = fn["name"]
                            if fn.get("arguments"):
                                tool_call_args += fn["arguments"]

                        if finish_reason == "tool_calls" and is_tool_call:
                            try:
                                arguments = json.loads(tool_call_args)
                            except (json.JSONDecodeError, TypeError):
                                arguments = {}
                            if not isinstance(arguments, dict):
                                arguments = {}
                            yield LLMToolCall(name=tool_call_name, arguments=arguments)

            yield LLMStreamUsage(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
            )

        except Exception as exc:
            logger.exception(
                "openrouter_stream_failed",
                model=self.model,
                message_count=len(messages),
            )
            record_llm_failure(type(exc).__name__)
            raise
        finally:
            latency_ms = round((perf_counter() - start) * 1000, 2)
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
