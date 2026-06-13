"""
gemini_client.py – Concrete LLM client gọi Google Gemini API.

Version này dùng Google Gen AI SDK mới:
    from google import genai
    client = genai.Client(api_key=...)

Tool calling được thực hiện qua JSON-in-prompt, không dùng native
Gemini function calling, để smoke test agent loop đơn giản ở version đầu.

Exceptions từ Gemini SDK được để bubble lên cho agent/API layer xử lý.
"""

import asyncio
import json
from typing import Any

from google import genai

from .base import BaseLLMClient, LLMMessage, LLMResponse, LLMToolCall


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _strip_code_fence(text: str) -> str:
    """Bỏ markdown code fence nếu Gemini bọc JSON trong ``` ... ```."""
    stripped = text.strip()
    if not stripped.startswith("```"):
        return stripped

    lines = stripped.splitlines()
    if len(lines) <= 1:
        return ""

    # Bỏ dòng đầu (``` hoặc ```json) và dòng cuối nếu là ```
    inner_lines = lines[1:-1] if lines[-1].strip() == "```" else lines[1:]
    return "\n".join(inner_lines).strip()


def _build_prompt(
    messages: list[LLMMessage],
    tools: list[dict[str, Any]] | None,
) -> str:
    """Chuyển messages và tool schemas thành một prompt text duy nhất."""
    role_prefix: dict[str, str] = {
        "system": "System",
        "user": "User",
        "assistant": "Assistant",
    }

    parts: list[str] = [
        f"{role_prefix.get(msg.role, msg.role.capitalize())}: {msg.content}"
        for msg in messages
    ]

    if tools:
        tool_lines: list[str] = []
        for schema in tools:
            # Tool schema theo dinh dang function-calling tuong thich.
            fn = schema.get("function", schema)
            name = fn.get("name", "")
            description = fn.get("description", "")
            parameters = fn.get("parameters", {})

            tool_lines.append(
                f"- {name}: {description}\n"
                f"  Parameters JSON schema: {json.dumps(parameters, ensure_ascii=False)}"
            )

        tool_block = "\n".join(tool_lines)
        parts.append(
            "Hướng dẫn dùng tool:\n"
            "Nếu bài toán phù hợp với một tool, hãy CHỈ trả về JSON thuần theo dạng:\n"
            '{"tool_call": {"name": "tool_name", "arguments": {"key": "value"}}}\n'
            "Không bọc JSON trong markdown nếu có thể.\n\n"
            f"Danh sách tool:\n{tool_block}\n\n"
            "Nếu không cần tool, trả lời bình thường bằng tiếng Việt."
        )

    return "\n\n".join(parts)


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------


class GeminiClient(BaseLLMClient):
    """LLM client sử dụng Google Gen AI SDK."""

    def __init__(self, api_key: str, model: str = "gemini-2.0-flash") -> None:
        self.model_name = model
        self.client = genai.Client(api_key=api_key)

    async def generate(
        self,
        messages: list[LLMMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> LLMResponse:
        """Gọi Gemini và trả về LLMResponse.

        Args:
            messages: Danh sách message theo role (``system``, ``user``,
                ``assistant``).
            tools: Danh sach schema tool theo dinh dang function-calling.
                Tool call được xử lý qua JSON-in-prompt, không dùng native
                Gemini function calling.

        Returns:
            LLMResponse chứa text content hoặc tool call được parse từ JSON.
        """
        prompt = _build_prompt(messages, tools)

        response = await asyncio.to_thread(
            self.client.models.generate_content,
            model=self.model_name,
            contents=prompt,
        )

        text = (getattr(response, "text", "") or "").strip()
        if not text:
            return LLMResponse(content="", raw={"text": ""})

        cleaned_text = _strip_code_fence(text)

        try:
            parsed: Any = json.loads(cleaned_text)
            if isinstance(parsed, dict) and "tool_call" in parsed:
                tc = parsed["tool_call"]
                if isinstance(tc, dict):
                    arguments = tc.get("arguments", {})
                    if not isinstance(arguments, dict):
                        arguments = {}

                    return LLMResponse(
                        content=None,
                        tool_call=LLMToolCall(
                            name=str(tc.get("name", "")),
                            arguments=arguments,
                        ),
                        raw={"text": text},
                    )
        except (json.JSONDecodeError, TypeError):
            pass

        return LLMResponse(content=text, raw={"text": text})
