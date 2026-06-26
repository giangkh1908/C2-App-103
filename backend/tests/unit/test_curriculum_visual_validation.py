from src.services.curriculum_adapter import build_grade1_curriculum_result
from src.services.types import LearningCoreRequest
from src.services.validation import validate_learning_core_result, validate_lesson_response
from src.services.response_mapper import to_lesson_response


def test_validation_accepts_stick_bundles_for_grade1_ops_01() -> None:
    result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=1,
            message="Minh họa 24 + 13 bằng que tính",
            curriculum_topic_id="G1-OPS-01",
        ),
        "session-1",
    )

    assert result is not None

    validate_learning_core_result(result)

    lesson_response = to_lesson_response(result)
    assert lesson_response is not None
    validate_lesson_response(lesson_response, result.curriculum_topic_id)


def test_grade1_num_02_returns_expected_comparison_visual_data() -> None:
    result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=1,
            message="So sánh 37 và 42",
            curriculum_topic_id="G1-NUM-02",
        ),
        "session-1",
    )

    assert result is not None
    assert result.visual_card is not None
    assert result.visual_card.visual_data.type == "comparison_visual"
    assert result.visual_card.visual_data.primary_count == 37
    assert result.visual_card.visual_data.secondary_count == 42
