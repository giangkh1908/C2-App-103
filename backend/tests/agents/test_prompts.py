"""
test_prompts.py – Unit tests cho agents/prompts.py.
"""

import pytest

from src.agents.prompts import (
    TOOL_USE_INSTRUCTION,
    build_tutor_system_prompt,
)

# ---------------------------------------------------------------------------
# build_tutor_system_prompt – L3 cụ thể
# ---------------------------------------------------------------------------


def test_prompt_l3_contains_app_name() -> None:
    prompt = build_tutor_system_prompt("L3")
    assert "Toán Trực Quan AI" in prompt


def test_prompt_l3_contains_candy_multiplication() -> None:
    prompt = build_tutor_system_prompt("L3")
    assert "candy_multiplication" in prompt


def test_prompt_l3_contains_level_tag() -> None:
    prompt = build_tutor_system_prompt("L3")
    assert "Mức L3" in prompt


# ---------------------------------------------------------------------------
# build_tutor_system_prompt – tất cả levels hợp lệ
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("level", ["L1", "L2", "L3", "L4", "L5"])
def test_prompt_contains_correct_level_tag(level: str) -> None:
    prompt = build_tutor_system_prompt(level)
    assert f"Mức {level}" in prompt


# ---------------------------------------------------------------------------
# build_tutor_system_prompt – fallback level không hợp lệ
# ---------------------------------------------------------------------------


def test_prompt_invalid_level_falls_back_to_l3() -> None:
    prompt = build_tutor_system_prompt("INVALID")
    assert "Mức L3" in prompt


# ---------------------------------------------------------------------------
# TOOL_USE_INSTRUCTION – chứa đủ 4 tên tool
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "tool_name",
    [
        "candy_multiplication",
        "equal_division",
        "fraction_pizza",
        "rectangle_measurement",
    ],
)
def test_tool_use_instruction_contains_tool(tool_name: str) -> None:
    assert tool_name in TOOL_USE_INSTRUCTION