"""
test_prompt_registry.py – Unit tests cho PromptRegistry.

Tests cover:
- Loading prompts from the JSON file on disk.
- Building a system prompt that matches the hardcoded baseline (golden
  test).
- Fallback when a prompt file is missing (PromptNotFoundError).
- List prompts returns correct metadata.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from src.agents.prompts import (
    TOOL_USE_INSTRUCTION,
)
from src.agents.prompts import (
    build_tutor_system_prompt as build_hardcoded,
)
from src.llm.prompt_registry import PromptNotFoundError, PromptRegistry

# Root of the backend package
_BACKEND = Path(__file__).resolve().parents[2]


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def reg() -> PromptRegistry:
    """Return a fresh PromptRegistry (no cache pollution)."""
    return PromptRegistry()


# ---------------------------------------------------------------------------
# Load prompt file
# ---------------------------------------------------------------------------


def test_get_prompt_ok(reg: PromptRegistry) -> None:
    prompt = reg.get_prompt("tutor_system", "v1")
    assert prompt["prompt_id"] == "tutor_system"
    assert prompt["version"] == "v1"
    assert "segments" in prompt
    assert "base" in prompt["segments"]
    assert "tool_use" in prompt["segments"]
    assert "clarification" in prompt["segments"]
    assert "levels" in prompt["segments"]


def test_get_prompt_caches(reg: PromptRegistry) -> None:
    p1 = reg.get_prompt("tutor_system", "v1")
    p2 = reg.get_prompt("tutor_system", "v1")
    assert p1 is p2  # same object from cache


def test_get_prompt_not_found(reg: PromptRegistry) -> None:
    with pytest.raises(PromptNotFoundError):
        reg.get_prompt("tutor_system", "v999")


def test_get_prompt_unknown_id(reg: PromptRegistry) -> None:
    with pytest.raises(PromptNotFoundError):
        reg.get_prompt("nonexistent_prompt", "v1")


# ---------------------------------------------------------------------------
# Build system prompt – golden test: matches hardcoded output
# ---------------------------------------------------------------------------


def test_build_system_prompt_l3_matches_hardcoded(reg: PromptRegistry) -> None:
    """v1 from registry should produce the same L3 output as hardcoded."""
    registry_output = reg.build_system_prompt("tutor_system", "v1", "L3")
    hardcoded_output = build_hardcoded("L3")
    # They should be identical — the v1.json was extracted from the
    # hardcoded constants.
    assert registry_output == hardcoded_output


@pytest.mark.parametrize("level", ["L1", "L2", "L3", "L4", "L5"])
def test_build_system_prompt_all_levels(reg: PromptRegistry, level: str) -> None:
    prompt = reg.build_system_prompt("tutor_system", "v1", level)
    assert f"Mức {level}" in prompt
    assert "Toán Trực Quan AI" in prompt


def test_build_system_prompt_fallback_level(reg: PromptRegistry) -> None:
    prompt = reg.build_system_prompt("tutor_system", "v1", "INVALID")
    assert "Mức L3" in prompt


# ---------------------------------------------------------------------------
# List prompts
# ---------------------------------------------------------------------------


def test_list_prompts(reg: PromptRegistry) -> None:
    prompts = reg.list_prompts()
    assert len(prompts) >= 1
    assert {"prompt_id": "tutor_system", "version": "v1"} in prompts


# ---------------------------------------------------------------------------
# build_tutor_system_prompt with prompt_version param
# ---------------------------------------------------------------------------


def test_build_tutor_with_version_matches_hardcoded() -> None:
    from src.agents.prompts import build_tutor_system_prompt

    with_version = build_tutor_system_prompt("L3", prompt_version="v1")
    hardcoded = build_tutor_system_prompt("L3")
    assert with_version == hardcoded


# ---------------------------------------------------------------------------
# Verify JSON file content matches hardcoded constants
# ---------------------------------------------------------------------------


def test_v1_json_matches_hardcoded_segments() -> None:
    """Verify each segment in v1.json is byte-identical to the matching
    hardcoded constant in prompts.py."""
    json_path = _BACKEND / "prompts" / "tutor_system" / "v1.json"
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)

    segments = data["segments"]

    from src.agents.prompts import (
        BASE_TUTOR_SYSTEM_PROMPT,
        CLARIFICATION_INSTRUCTION,
        LEVEL_INSTRUCTIONS,
    )

    assert segments["base"] == BASE_TUTOR_SYSTEM_PROMPT
    assert segments["tool_use"] == TOOL_USE_INSTRUCTION
    assert segments["clarification"] == CLARIFICATION_INSTRUCTION

    for lvl, expected in LEVEL_INSTRUCTIONS.items():
        assert segments["levels"][lvl] == expected, f"Mismatch for level {lvl}"
