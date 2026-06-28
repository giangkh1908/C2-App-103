from src.services.concept_classifier import classify_curriculum_concept
from src.services.curriculum_adapter import build_grade1_curriculum_result
from src.services.types import LearningCoreRequest
from src.services.visualization_validator import validate_visual_payload


def test_concept_classifier_maps_core_grade1_and_grade2_prompts() -> None:
    assert classify_curriculum_concept("G1-NUM-02", "so sanh 34 va 7") == "compare_numbers"
    assert classify_curriculum_concept("G1-NUM-01", "24 co may chuc may don vi") == "place_value"
    assert classify_curriculum_concept("G1-OPS-02", "tinh 8 + 5") == "mental_math_ten_frame"
    assert (
        classify_curriculum_concept("G1-OPS-02", "dung tia so de tinh 7 + 2")
        == "mental_math_number_line"
    )
    assert (
        classify_curriculum_concept("G2-OPS-02", "minh hoa 3 x 5 bang mang o vuong")
        == "multiplication_as_groups"
    )
    assert (
        classify_curriculum_concept("G2-OPS-02", "chia deu 20 keo cho 5 ban")
        == "division_as_sharing"
    )


def test_visualization_validator_rejects_invalid_addition_math() -> None:
    result = validate_visual_payload(
        concept_type="addition_with_objects",
        template="operation_story",
        grade=1,
        primary_count=8,
        secondary_count=5,
        total_count=20,
        config={"operation": "+", "before": 8, "change": 5, "result": 20},
    )

    assert result.is_valid is False
    assert any("mathematically inconsistent" in error for error in result.errors)


def test_visualization_validator_rejects_missing_required_config() -> None:
    result = validate_visual_payload(
        concept_type="place_value",
        template="place_value_blocks",
        grade=1,
        primary_count=2,
        secondary_count=4,
        total_count=24,
        config={"tens": 2, "ones": 4},
    )

    assert result.is_valid is False
    assert any("Missing required config key 'number'" in error for error in result.errors)


def test_visualization_validator_rejects_grade1_ten_frame_overflow() -> None:
    result = validate_visual_payload(
        concept_type="mental_math_ten_frame",
        template="ten_frame",
        grade=1,
        primary_count=18,
        secondary_count=9,
        total_count=27,
        config={"operation": "+", "before": 18, "change": 9, "result": 27},
    )

    assert result.is_valid is False
    assert any("within 20" in error for error in result.errors)


def test_curriculum_result_exposes_polypad_metadata_for_supported_concepts() -> None:
    place_value = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=1,
            message="24 có mấy chục mấy đơn vị",
            curriculum_topic_id="G1-NUM-01",
        ),
        "session-1",
    )
    number_line = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=1,
            message="Dùng tia số để tính 7 + 2",
            curriculum_topic_id="G1-OPS-02",
        ),
        "session-1",
    )
    comparison = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=1,
            message="So sánh 34 và 7",
            curriculum_topic_id="G1-NUM-02",
        ),
        "session-1",
    )

    assert place_value is not None and place_value.visual_card is not None
    assert place_value.visual_card.visual_data.concept_type == "place_value"
    assert place_value.visual_card.visual_data.polypad_enabled is True
    assert place_value.visual_card.visual_data.polypad_mode == "base-ten-blocks"

    assert number_line is not None and number_line.visual_card is not None
    assert number_line.visual_card.visual_data.concept_type == "mental_math_number_line"
    assert number_line.visual_card.visual_data.polypad_enabled is True
    assert number_line.visual_card.visual_data.polypad_mode == "number-line"

    assert comparison is not None and comparison.visual_card is not None
    assert comparison.visual_card.visual_data.concept_type == "compare_numbers"
    assert comparison.visual_card.visual_data.polypad_enabled is False
    assert comparison.visual_card.visual_data.polypad_mode is None
