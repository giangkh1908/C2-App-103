"""
manual_test_gemini_agent.py

Smoke test thủ công cho AgentLoop dùng GeminiClient.
Chạy từ thư mục backend:

PowerShell:
    $env:GEMINI_API_KEY="your-key"
    python manual_test_gemini_agent.py

File này chỉ để test local, không nên commit nếu nhóm không muốn giữ scripts thủ công.
"""

import asyncio
import os

from src.agents.agent_loop import AgentLoop
from src.agents.schemas import AgentRunConfig
from src.llm.gemini_client import GeminiClient
from src.tools.registry import create_default_tool_registry


async def main() -> None:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Missing GEMINI_API_KEY. Set it first, for example: "
            '$env:GEMINI_API_KEY="your-key"'
        )

    llm = GeminiClient(
        api_key=api_key,
        model=os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"),
    )
    registry = create_default_tool_registry()
    loop = AgentLoop(llm=llm, tool_registry=registry)

    response = await loop.run(
        user_message=(
            "Dạy em phép nhân 3 x 4 bằng đĩa kẹo"
        ),
        config=AgentRunConfig(level="L3", use_tools=True, max_steps=10),
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
    asyncio.run(main())
