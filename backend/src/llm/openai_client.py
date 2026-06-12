"""
openai_client.py – Concrete LLM client gọi OpenAI Chat Completions API.

Exceptions từ OpenAI SDK được để bubble lên cho agent/API layer xử lý.
"""

import json
from typing import Any

from openai import AsyncOpenAI

from .base import BaseLLMClient, LLMMessage, LLMResponse, LLMToolCall


class OpenAIClient(BaseLLMClient):
    """LLM client sử dụng OpenAI Chat Completions API."""

    def __init__(self, api_key: str, model: str = "gpt-4o-mini") -> None:
        self.model = model
        self.client = AsyncOpenAI(api_key=api_key)

    async def generate(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> LLMResponse:
        """Gọi OpenAI Chat Completions và trả về LLMResponse.

        Args:
            messages: Danh sách message theo role (``system``, ``user``,
                ``assistant``).
            tools: Danh sách schema tool theo định dạng function-calling
                của OpenAI. Truyền ``None`` hoặc list rỗng nếu không dùng tool.

        Returns:
            :class:`LLMResponse` chứa text content hoặc tool call đầu tiên
            mà model yêu cầu thực thi.
        """
        openai_messages: list[dict[str, Any]] = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]

        kwargs: dict[str, Any] = {
            "model": self.model,
            "messages": openai_messages,
        }
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        response = await self.client.chat.completions.create(**kwargs)

        message = response.choices[0].message

        if message.tool_calls:
            raw_tool_call = message.tool_calls[0]
            name: str = raw_tool_call.function.name

            try:
                arguments: dict[str, Any] = json.loads(
                    raw_tool_call.function.arguments
                )
            except (json.JSONDecodeError, TypeError):
                arguments = {}

            return LLMResponse(
                content=message.content,
                tool_call=LLMToolCall(name=name, arguments=arguments),
                raw=response.model_dump(),
            )

        return LLMResponse(
            content=message.content or "",
            raw=response.model_dump(),
        )