"""
test_learning_core_topic_guards.py – Unit tests cho các hàm guard chủ đề/tool
trong learning_core.py: allowed_tool_names_for_context và is_visual_data_for_topic.
"""

from src.services.learning_core import (
    allowed_tool_names_for_context,
    is_visual_data_for_topic,
)
from src.services.types import LearningContext


def test_allowed_tool_names_returns_context_tool_when_topic_and_tool_known() -> None:
    context = LearningContext(topic="addition_subtraction", tool_name="addition_subtraction")

    assert allowed_tool_names_for_context(context) == ["addition_subtraction"]


def test_allowed_tool_names_returns_empty_when_topic_unknown() -> None:
    context = LearningContext(topic=None, tool_name=None)

    assert allowed_tool_names_for_context(context) == []


def test_allowed_tool_names_returns_empty_when_topic_has_no_tool() -> None:
    # data_representation không có tool trong registry
    context = LearningContext(topic="data_representation", tool_name=None)

    assert allowed_tool_names_for_context(context) == []


def test_is_visual_data_for_topic_matches_expected_type() -> None:
    visual_data = {"type": "addition_subtraction", "operand_a": 5, "operand_b": 3}

    assert is_visual_data_for_topic(visual_data, "addition_subtraction") is True


def test_is_visual_data_for_topic_rejects_mismatched_type() -> None:
    # dữ liệu tool của chủ đề khác lọt vào — không được chấp nhận
    visual_data = {"type": "number_comparison", "number_a": 41, "number_b": 93}

    assert is_visual_data_for_topic(visual_data, "addition_subtraction") is False


def test_is_visual_data_for_topic_rejects_none_or_empty() -> None:
    assert is_visual_data_for_topic(None, "addition_subtraction") is False
    assert is_visual_data_for_topic({}, "addition_subtraction") is False


def test_is_visual_data_for_topic_rejects_when_topic_none() -> None:
    visual_data = {"type": "addition_subtraction"}

    assert is_visual_data_for_topic(visual_data, None) is False
