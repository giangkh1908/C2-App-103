"""
manual_test_openrouter_agent.py – Smoke test thủ công agent loop với OpenRouter.

Chạy từ thư mục backend:
    OPENROUTER_API_KEY=<key> python manual_test_openrouter_agent.py
    OPENROUTER_API_KEY=<key> OPENROUTER_MODEL=deepseek/deepseek-v4-flash python manual_test_openrouter_agent.py

Không phải pytest; không commit API key vào source code.
"""

import asyncio
import os

from src.agents.agent_loop import AgentLoop
from src.agents.schemas import AgentRunConfig
from src.llm.openrouter_client import OpenRouterClient
from src.tools.registry import create_default_tool_registry

_DEFAULT_MODEL = "deepseek/deepseek-v4-flash"


async def main(message: str) -> None:
    api_key: str | None = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Thiếu biến môi trường OPENROUTER_API_KEY. "
            "Hãy set trước khi chạy script này."
        )

    model: str = os.environ.get("OPENROUTER_MODEL") or _DEFAULT_MODEL

    llm = OpenRouterClient(
        api_key=api_key,
        model=model,
    )

    registry = create_default_tool_registry()

    agent = AgentLoop(
        llm=llm,
        tool_registry=registry,
    )

    response = await agent.run(
        user_message=message,
        config=AgentRunConfig(
            level="L3",
            use_tools=True,
            max_steps=4,
        ),
    )

    print("ANSWER:")
    print(response.answer)

    print("\nTOOL USED:")
    print(response.tool_used)

    print("\nVISUAL DATA:")
    print(response.visual_data)

    print("\nSTEPS:")
    for step in response.steps:
        print(step.model_dump())


if __name__ == "__main__":
    user_message = "Giải thích cho em về chu vi hình chữ nhật với ạ"
    asyncio.run(main(user_message))