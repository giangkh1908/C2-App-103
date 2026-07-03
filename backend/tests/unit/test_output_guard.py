from src.services.output_guard import list_output_guard_contracts, validate_assistant_output


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


def test_output_guard_rejects_empty_answer() -> None:
    result = validate_assistant_output(
        answer="   ",
        topic="multiplication",
        tool_data={"groups": 3, "items_per_group": 4, "total": 12},
    )

    assert result.is_valid is False
    assert "must not be empty" in " ".join(result.errors)


def test_output_guard_rejects_phone_number() -> None:
    result = validate_assistant_output(
        answer="So dien thoai la 0912345678",
        topic="multiplication",
        tool_data={"groups": 3, "items_per_group": 4, "total": 12},
    )

    assert result.is_valid is False
    assert any("sensitive" in error.lower() for error in result.errors)


def test_output_guard_rejects_non_math_scope_answer() -> None:
    result = validate_assistant_output(
        answer="Day la bai van ta mua he.",
        topic="multiplication",
        tool_data={"groups": 3, "items_per_group": 4, "total": 12},
    )

    assert result.is_valid is False
    assert any("outside the supported math scope" in error for error in result.errors)


def test_output_guard_rejects_multiplication_answer_missing_expected_total() -> None:
    result = validate_assistant_output(
        answer="3 x 4 bang",
        topic="multiplication",
        tool_data={"groups": 3, "items_per_group": 4, "total": 12},
    )

    assert result.is_valid is False
    assert any("expected total" in error.lower() for error in result.errors)


def test_output_guard_rejects_division_answer_missing_expected_group_result() -> None:
    result = validate_assistant_output(
        answer="Moi nhom co bang nhau.",
        topic="division",
        tool_data={"groups": 3, "items_per_group": 4, "total_items": 12},
    )

    assert result.is_valid is False
    assert any("per-group result" in error.lower() for error in result.errors)


def test_output_guard_contracts_cover_expected_checks() -> None:
    assert [contract.name for contract in list_output_guard_contracts()] == [
        "non_empty",
        "pii_or_secret",
        "meta_leak",
        "math_scope",
        "arithmetic_consistency",
        "tool_data_consistency",
    ]
