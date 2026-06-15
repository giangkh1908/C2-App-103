import json
from time import perf_counter
from typing import Any

import httpx

from src.core.logging import get_logger
from src.core.metrics import record_llm_failure, record_llm_request

from .base import BaseLLMClient, LLMMessage, LLMResponse, LLMToolCall

logger = get_logger("toan_truc_quan.llm.openrouter")


class OpenRouterClient(BaseLLMClient):
    def __init__(
        self,
        api_key: str,
        model: str = "openai/gpt-4o-mini",
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
                {"role": message.role, "content": message.content}
                for message in messages
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

        record_llm_request(model=self.model, tokens=tokens, latency_ms=latency_ms)

        logger.debug(
            "openrouter_response_received",
            model=self.model,
            tokens_used=tokens,
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
