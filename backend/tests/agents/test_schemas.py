"""
test_schemas.py – Unit tests cho các Pydantic schema trong agents/schemas.py.
"""

import pytest

from src.agents.schemas import (
    AgentResponse,
    AgentRunConfig,
    AgentStep,
    ToolCall,
    ToolObservation,
)

# ---------------------------------------------------------------------------
# ToolCall
# ---------------------------------------------------------------------------


def test_tool_call_fields() -> None:
    tc = ToolCall(name="candy_multiplication", arguments={"groups": 3})

    assert tc.name == "candy_multiplication"
    assert tc.arguments == {"groups": 3}


# ---------------------------------------------------------------------------
# ToolObservation
# ---------------------------------------------------------------------------


def test_tool_observation_fields() -> None:
    obs = ToolObservation(
        tool_name="candy_multiplication",
        success=True,
        data={"type": "test"},
    )

    assert obs.tool_name == "candy_multiplication"
    assert obs.success is True
    assert obs.data == {"type": "test"}


# ---------------------------------------------------------------------------
# AgentStep
# ---------------------------------------------------------------------------


def test_agent_step_index() -> None:
    tc = ToolCall(name="some_tool", arguments={})
    obs = ToolObservation(tool_name="some_tool", success=True, data={})
    step = AgentStep(step_index=1, tool_call=tc, observation=obs)

    assert step.step_index == 1


# ---------------------------------------------------------------------------
# AgentResponse
# ---------------------------------------------------------------------------


def test_agent_response_defaults() -> None:
    response = AgentResponse(answer="ok")

    assert response.suggestions == []
    assert response.steps == []
    assert response.tool_used is None
    assert response.visual_data is None


# ---------------------------------------------------------------------------
# AgentRunConfig
# ---------------------------------------------------------------------------


def test_agent_run_config_defaults() -> None:
    config = AgentRunConfig()

    assert config.level == "L3"
    assert config.max_steps == 4
    assert config.use_tools is True


def test_agent_run_config_rejects_invalid_level() -> None:
    with pytest.raises(Exception):
        AgentRunConfig(level="L9")
