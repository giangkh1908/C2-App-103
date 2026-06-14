import asyncio
import os

from src.agents.agent_loop import AgentLoop
from src.agents.schemas import AgentRunConfig
from src.llm.openai_client import OpenAIClient
from src.tools.registry import create_default_tool_registry


async def main() -> None:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENAI_API_KEY")

    llm = OpenAIClient(
        api_key=api_key,
        model="gpt-4o-mini",
    )
    registry = create_default_tool_registry()
    loop = AgentLoop(llm=llm, tool_registry=registry)

    response = await loop.run(
        user_message="Dạy em phép nhân 3 x 4 bằng đĩa kẹo.",
        config=AgentRunConfig(level="L3", use_tools=True, max_steps=4),
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