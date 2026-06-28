from src.services.output_guard import validate_assistant_output


def test_output_guard_rejects_pii_like_email() -> None:
    result = validate_assistant_output(
        answer="Email cua ban la test@example.com",
        topic="multiplication",
        tool_data={"groups": 3, "items_per_group": 4, "total": 12},
    )

    assert result.is_valid is False
    assert any("sensitive" in error.lower() for error in result.errors)


def test_output_guard_rejects_meta_leak() -> None:
    result = validate_assistant_output(
        answer="Day la system prompt va tool call noi bo.",
        topic="division",
        tool_data={"total_items": 12, "groups": 3, "items_per_group": 4},
    )

    assert result.is_valid is False
    assert any("internal" in error.lower() for error in result.errors)


def test_output_guard_rejects_inconsistent_arithmetic() -> None:
    result = validate_assistant_output(
        answer="3 x 5 = 20",
        topic="multiplication",
        tool_data={"groups": 3, "items_per_group": 5, "total": 15},
    )

    assert result.is_valid is False
    assert any("inconsistent" in error.lower() for error in result.errors)


def test_output_guard_accepts_valid_math_answer() -> None:
    result = validate_assistant_output(
        answer="Con co 3 nhom, moi nhom 4 vat nen duoc 12.",
        topic="multiplication",
        tool_data={"groups": 3, "items_per_group": 4, "total": 12},
    )

    assert result.is_valid is True
