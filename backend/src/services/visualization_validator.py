from __future__ import annotations

from dataclasses import dataclass

from src.services.visualization_schema import TEMPLATE_REQUIRED_CONFIG, ConceptType


@dataclass(frozen=True)
class TemplateValidationResult:
    is_valid: bool
    errors: tuple[str, ...]


def validate_visual_payload(
    *,
    concept_type: ConceptType,
    template: str,
    grade: int,
    primary_count: int,
    secondary_count: int,
    total_count: float,
    config: dict[str, object] | None,
) -> TemplateValidationResult:
    errors: list[str] = []
    payload = config or {}

    if primary_count < 0 or secondary_count < 0 or total_count < 0:
        errors.append("Counts must be non-negative.")

    for key in TEMPLATE_REQUIRED_CONFIG.get(template, ()):
        if key not in payload:
            errors.append(f"Missing required config key '{key}'.")

    if template == "comparison_visual":
        operator = payload.get("compare_operator")
        expected = (
            ">"
            if primary_count > secondary_count
            else "<"
            if primary_count < secondary_count
            else "="
        )
        if operator is not None and operator != expected:
            errors.append("Comparison operator does not match the compared values.")

    if template == "place_value_blocks":
        number = _as_number(payload.get("number"), total_count)
        hundreds = _as_number(payload.get("hundreds"), 0)
        tens = _as_number(payload.get("tens"), primary_count)
        ones = _as_number(payload.get("ones"), secondary_count)
        rebuilt = hundreds * 100 + tens * 10 + ones
        if number != rebuilt:
            errors.append("Place value config does not rebuild the source number.")

    if template in {"operation_story", "stick_bundles", "ten_frame", "number_line"}:
        before = _as_number(payload.get("before"), primary_count)
        change = _as_number(payload.get("change"), secondary_count)
        result = _as_number(payload.get("result"), total_count)
        operation = str(payload.get("operation") or "+")
        expected = before - change if operation == "-" else before + change
        if result != expected:
            errors.append("Operation payload is mathematically inconsistent.")

    if template == "array_model":
        rows = _as_number(payload.get("rows"), primary_count)
        cols = _as_number(payload.get("cols"), secondary_count)
        if rows * cols != int(total_count):
            errors.append("Array model rows and cols do not match total_count.")

    if template == "money_visual":
        denominations = payload.get("denominations")
        total_value = _as_number(payload.get("total_value"), total_count)
        if not isinstance(denominations, list) or not denominations:
            errors.append("Money visual requires at least one denomination.")
        else:
            numeric = [
                int(value) for value in denominations if isinstance(value, (int, float, str))
            ]
            if sum(numeric) != total_value:
                errors.append("Money visual total_value does not equal the denominations sum.")

    if template in {"picture_graph", "data_table"}:
        labels = payload.get("labels")
        values = payload.get("values")
        if (
            not isinstance(labels, list)
            or not isinstance(values, list)
            or len(labels) != len(values)
        ):
            errors.append("Data visuals require labels and values with matching lengths.")

    if template == "probability_experiment":
        outcomes = payload.get("outcomes")
        favorable = _as_number(payload.get("favorable_count"), secondary_count)
        if not isinstance(outcomes, list) or not outcomes:
            errors.append("Probability visual requires outcomes.")
        elif favorable > len(outcomes):
            errors.append("Probability favorable_count exceeds outcomes length.")

    max_value = max(primary_count, secondary_count, int(total_count))
    if (
        grade == 1
        and concept_type in {"mental_math_ten_frame", "mental_math_number_line"}
        and max_value > 20
    ):
        errors.append("Grade 1 mental math templates should stay within 20.")
    if grade == 1 and concept_type == "place_value" and int(total_count) > 100:
        errors.append("Grade 1 place value payload exceeds the expected range.")
    if grade == 2 and concept_type == "place_value" and int(total_count) > 1000:
        errors.append("Grade 2 place value payload exceeds the expected range.")

    return TemplateValidationResult(is_valid=not errors, errors=tuple(errors))


def _as_number(value: object, fallback: int | float) -> int:
    if isinstance(value, bool):
        return int(fallback)
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str):
        try:
            return int(float(value))
        except ValueError:
            return int(fallback)
    return int(fallback)
