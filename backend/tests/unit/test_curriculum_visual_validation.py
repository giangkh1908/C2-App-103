from src.services.curriculum_adapter import build_grade1_curriculum_result
from src.services.learning_core import detect_curriculum_topic
from src.services.response_mapper import to_lesson_response
from src.services.types import LearningCoreRequest
from src.services.validation import validate_learning_core_result, validate_lesson_response


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


def test_grade1_num_02_supports_greater_than_regression_case() -> None:
    result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=1,
            message="So sánh 34 và 7",
            curriculum_topic_id="G1-NUM-02",
        ),
        "session-1",
    )

    assert result is not None
    assert result.visual_card is not None
    assert result.visual_card.visual_data.type == "comparison_visual"
    assert result.visual_card.visual_data.primary_count == 34
    assert result.visual_card.visual_data.secondary_count == 7
    assert "34 > 7" in result.visual_card.short_explanation


def test_grade1_num_02_supports_equals_case() -> None:
    result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=1,
            message="So sánh 19 và 19",
            curriculum_topic_id="G1-NUM-02",
        ),
        "session-1",
    )

    assert result is not None
    assert result.visual_card is not None
    assert result.visual_card.visual_data.type == "comparison_visual"
    assert result.visual_card.visual_data.primary_count == 19
    assert result.visual_card.visual_data.secondary_count == 19
    assert "19 = 19" in result.visual_card.short_explanation


def test_grade1_meas_01_comparison_visual_uses_exact_lengths() -> None:
    result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=1,
            message="So sánh bút dài 9 và 6",
            curriculum_topic_id="G1-MEAS-01",
        ),
        "session-1",
    )

    assert result is not None
    assert result.visual_card is not None
    assert result.visual_card.visual_data.type == "comparison_visual"
    assert result.visual_card.visual_data.primary_count == 9
    assert result.visual_card.visual_data.secondary_count == 6
    assert result.visual_card.visual_data.config == {"a_label": "Bút A", "b_label": "Bút B"}


def test_grade1_meas_01_clock_visual_uses_hour_payload() -> None:
    result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=1,
            message="Đọc 7 giờ đúng trên đồng hồ",
            curriculum_topic_id="G1-MEAS-01",
        ),
        "session-1",
    )

    assert result is not None
    assert result.visual_card is not None
    assert result.visual_card.visual_data.type == "clock_calendar"
    assert result.visual_card.visual_data.primary_count == 7
    assert result.visual_card.visual_data.secondary_count == 0
    assert result.visual_card.visual_data.config == {"mode": "clock", "hour": 7, "minute": 0}


def test_grade1_meas_01_ruler_visual_uses_measured_length() -> None:
    result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=1,
            message="Đo cây bút 9 cm bằng thước",
            curriculum_topic_id="G1-MEAS-01",
        ),
        "session-1",
    )

    assert result is not None
    assert result.visual_card is not None
    assert result.visual_card.visual_data.type == "ruler_measurement"
    assert result.visual_card.visual_data.primary_count == 9
    assert result.visual_card.visual_data.secondary_count == 0
    assert result.visual_card.visual_data.config == {"object_name": "Cây bút"}


def test_detect_curriculum_topic_supports_grade2_prompts() -> None:
    assert detect_curriculum_topic("Số 234 gồm mấy trăm mấy chục mấy đơn vị?", 2) == "G2-NUM-01"
    assert detect_curriculum_topic("So sánh 342 và 324", 2) == "G2-NUM-02"
    assert detect_curriculum_topic("Đọc biểu đồ tranh: mỗi hình sao bằng 2 bạn", 2) == "G2-STAT-01"


def test_detect_curriculum_topic_supports_grade1_free_text_regressions() -> None:
    assert detect_curriculum_topic("24 có mấy chục mấy đơn vị", 1) == "G1-NUM-01"
    assert detect_curriculum_topic("So sánh 34 và 7", 1) == "G1-NUM-02"
    assert detect_curriculum_topic("So sánh 37 và 7", 1) == "G1-NUM-02"
    assert detect_curriculum_topic("Tính 8 + 5", 1) == "G1-OPS-02"


def test_detect_curriculum_topic_returns_none_for_out_of_scope_messages() -> None:
    assert detect_curriculum_topic("Thoi tiet Ha Noi hom nay", 1) is None
    assert detect_curriculum_topic("Viet email xin nghi hoc", 1) is None
    assert detect_curriculum_topic("Tin tuc bong da hom nay", 2) is None


def test_grade1_ops_02_defaults_to_visual_for_plain_addition_prompt() -> None:
    result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=1,
            message="Tính 8 + 5",
            curriculum_topic_id="G1-OPS-02",
        ),
        "session-1",
    )

    assert result is not None
    assert result.visual_card is not None
    assert result.visual_card.visual_data.type == "ten_frame"
    assert result.visual_card.visual_data.primary_count == 8
    assert result.visual_card.visual_data.secondary_count == 5


def test_grade1_num_01_defaults_to_place_value_blocks_for_tens_and_ones_prompt() -> None:
    result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=1,
            message="24 có mấy chục mấy đơn vị",
            curriculum_topic_id="G1-NUM-01",
        ),
        "session-1",
    )

    assert result is not None
    assert result.visual_card is not None
    assert result.visual_card.visual_data.type == "place_value_blocks"
    assert result.visual_card.visual_data.config == {
        "number": 24,
        "tens": 2,
        "ones": 4,
    }


def test_grade2_num_02_uses_exact_comparison_payload() -> None:
    result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=2,
            message="So sánh 342 và 324",
            curriculum_topic_id="G2-NUM-02",
        ),
        "session-2",
    )

    assert result is not None
    assert result.visual_card is not None
    assert result.visual_card.visual_data.type == "comparison_visual"
    assert result.visual_card.visual_data.primary_count == 342
    assert result.visual_card.visual_data.secondary_count == 324
    assert result.visual_card.visual_data.config == {
        "a_label": "342",
        "b_label": "324",
        "compare_operator": ">",
    }

    validate_learning_core_result(result)
    lesson_response = to_lesson_response(result)
    assert lesson_response is not None
    validate_lesson_response(lesson_response, result.curriculum_topic_id)


def test_grade2_ops_02_routes_array_model_with_config() -> None:
    result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=2,
            message="Minh họa 3 x 5 bằng mảng ô vuông",
            curriculum_topic_id="G2-OPS-02",
        ),
        "session-2",
    )

    assert result is not None
    assert result.visual_card is not None
    assert result.visual_card.visual_data.type == "array_model"
    assert result.visual_card.visual_data.primary_count == 3
    assert result.visual_card.visual_data.secondary_count == 5
    assert result.visual_card.visual_data.total_count == 15
    assert result.visual_card.visual_data.config == {
        "rows": 3,
        "cols": 5,
        "operation": "×",
        "before": 3,
        "change": 5,
        "result": 15,
        "story_context": "kẹo",
    }


def test_grade2_measurement_visuals_include_semantic_config() -> None:
    money_result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=2,
            message="Dùng visual tiền cho 1000 2000 5000",
            curriculum_topic_id="G2-MEAS-01",
            curriculum_visual_template="money_visual",
        ),
        "session-2",
    )
    mass_result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=2,
            message="So sánh 3 kg và 5 kg",
            curriculum_topic_id="G2-MEAS-01",
            curriculum_visual_template="mass_capacity_visual",
        ),
        "session-2",
    )
    stat_result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=2,
            message="Đọc biểu đồ tranh: mỗi hình sao bằng 2 bạn",
            curriculum_topic_id="G2-STAT-01",
            curriculum_visual_template="picture_graph",
        ),
        "session-2",
    )
    prob_result = build_grade1_curriculum_result(
        LearningCoreRequest(
            user_id="user-1",
            grade=2,
            message="Lấy bóng từ hộp có 3 bóng đỏ 2 bóng xanh",
            curriculum_topic_id="G2-PROB-01",
        ),
        "session-2",
    )

    assert money_result is not None and money_result.visual_card is not None
    assert money_result.visual_card.visual_data.config == {
        "denominations": [1000, 2000, 5000],
        "total_value": 8000,
        "currency": "đồng",
    }

    assert mass_result is not None and mass_result.visual_card is not None
    assert mass_result.visual_card.visual_data.config == {
        "left_label": "Vật A",
        "right_label": "Vật B",
        "unit": "kg",
        "left_value": 3,
        "right_value": 5,
    }

    assert stat_result is not None and stat_result.visual_card is not None
    assert stat_result.visual_card.visual_data.config == {
        "labels": ["Táo", "Cam", "Nho"],
        "values": [4, 6, 2],
        "unit_value": 2,
        "icon_emoji": "⭐",
    }

    assert prob_result is not None and prob_result.visual_card is not None
    assert prob_result.visual_card.visual_data.config == {
        "outcomes": ["Bóng đỏ", "Bóng đỏ", "Bóng đỏ", "Bóng xanh", "Bóng xanh"],
        "favorable_count": 3,
        "experiment_label": "Bóng đỏ dễ xuất hiện hơn",
    }
