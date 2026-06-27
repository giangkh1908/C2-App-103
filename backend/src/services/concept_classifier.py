from __future__ import annotations

from src.services.visualization_schema import TOPIC_TO_CONCEPT, ConceptType


def classify_curriculum_concept(
    curriculum_topic_id: str,
    normalized_message: str,
    requested_template: str | None = None,
) -> ConceptType | None:
    concept = TOPIC_TO_CONCEPT.get(curriculum_topic_id)
    if concept is None:
        return None

    if curriculum_topic_id in {"G1-OPS-01", "G2-OPS-01"}:
        if any(token in normalized_message for token in ("bot", "tru", "lay di", "con lai")):
            return "subtraction_with_objects"
        return "addition_with_objects"

    if curriculum_topic_id in {"G1-OPS-02", "G2-OPS-03"}:
        if requested_template == "number_line" or "tia so" in normalized_message:
            return "mental_math_number_line"
        return "mental_math_ten_frame"

    if curriculum_topic_id == "G2-OPS-02":
        if requested_template == "grouping_model" or any(
            token in normalized_message for token in ("chia", "chia deu", "deu nhau")
        ):
            return "division_as_sharing"
        return "multiplication_as_groups"

    if curriculum_topic_id in {"G1-MEAS-01", "G2-MEAS-01"}:
        if requested_template == "money_visual" or "tien" in normalized_message:
            return "money"
        if requested_template == "mass_capacity_visual" or any(
            token in normalized_message for token in ("kg", "lit", "khoi luong", "dung tich")
        ):
            return "mass_capacity"
        if requested_template == "clock_calendar" or any(
            token in normalized_message for token in ("gio", "dong ho", "phut", "lich", "ngay", "thang", "thu")
        ):
            return "time_clock"
        return "measurement_length"

    return concept
