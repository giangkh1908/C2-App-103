from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

from src.core.config import settings
from src.models.chat import PracticeQuestion, SimulationConfig, VisualCard, VisualData
from src.models.lesson import LessonPracticeQuestion, LessonSimulation, LessonVisual
from src.services.types import LearningCoreRequest, LearningCoreResult, SessionMetadata

RUNTIME_TOPIC_BY_CURRICULUM_TOPIC = {
    "G1-NUM-01": "multiplication",
    "G1-NUM-02": "multiplication",
    "G1-OPS-01": "multiplication",
    "G1-OPS-02": "multiplication",
    "G1-WORD-01": "multiplication",
    "G1-GEO-01": "perimeter_area_basic",
    "G1-GEO-02": "perimeter_area_basic",
    "G1-GEO-03": "perimeter_area_basic",
    "G1-MEAS-01": "perimeter_area_basic",
    "G1-MEAS-02": "perimeter_area_basic",
}

DEFAULT_VISUAL_BY_CURRICULUM_TOPIC = {
    "G1-NUM-01": "place_value_blocks",
    "G1-NUM-02": "comparison_visual",
    "G1-OPS-01": "operation_story",
    "G1-OPS-02": "ten_frame",
    "G1-WORD-01": "bar_model",
    "G1-GEO-01": "spatial_position_scene",
    "G1-GEO-02": "geometry_shape",
    "G1-GEO-03": "shape_composition",
    "G1-MEAS-01": "comparison_visual",
    "G1-MEAS-02": "ruler_measurement",
}

ALLOWED_VISUALS_BY_CURRICULUM_TOPIC = {
    "G1-NUM-01": ("place_value_blocks", "counting_objects", "number_line"),
    "G1-NUM-02": ("comparison_visual", "number_line"),
    "G1-OPS-01": ("operation_story", "counting_objects", "place_value_blocks", "stick_bundles"),
    "G1-OPS-02": ("ten_frame", "number_line"),
    "G1-WORD-01": ("bar_model", "operation_story"),
    "G1-GEO-01": ("spatial_position_scene",),
    "G1-GEO-02": ("geometry_shape", "real_object_match"),
    "G1-GEO-03": ("shape_composition", "drag_drop_shapes"),
    "G1-MEAS-01": ("comparison_visual", "clock_calendar", "ruler_measurement"),
    "G1-MEAS-02": ("ruler_measurement", "clock_calendar"),
}

PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC = {
    "G1-NUM-01": [
        "Số 24 có mấy chục mấy đơn vị?",
        "Biểu diễn số 36 bằng chục và đơn vị",
        "Đếm 42 bằng khối chục đơn vị",
    ],
    "G1-NUM-02": [
        "So sánh 37 và 42 bằng tia số",
        "Số nào lớn hơn: 58 hay 53?",
        "Đặt 19, 21, 20 theo thứ tự",
    ],
    "G1-OPS-01": [
        "Minh họa 24 + 13 bằng que tính",
        "Bớt 15 từ 48 bằng hình",
        "Giải thích 32 - 10 bằng chục đơn vị",
    ],
    "G1-OPS-02": [
        "Tính nhẩm 8 + 5 bằng khung 10",
        "Nhẩm 30 - 10 bằng hình",
        "Dùng tia số để tính 7 + 2",
    ],
    "G1-WORD-01": [
        "Lan có 5 quả táo, mẹ cho thêm 3 quả, vẽ sơ đồ",
        "Bài toán bớt đi 2 con chim bằng hình",
        "Tóm tắt bài toán lời văn bằng bar model",
    ],
    "G1-GEO-01": [
        "Quả bóng ở bên trái cái hộp",
        "Chỉ vị trí ở giữa",
        "Minh họa trên dưới trước sau",
    ],
    "G1-GEO-02": [
        "Nhận biết hình vuông và hình tròn",
        "Vật nào là khối hộp chữ nhật?",
        "Ghép đồ vật với hình học",
    ],
    "G1-GEO-03": [
        "Ghép các hình để tạo ngôi nhà",
        "Xếp hình từ tam giác và hình vuông",
        "Tạo hình mới bằng kéo thả",
    ],
    "G1-MEAS-01": [
        "So sánh bút nào dài hơn",
        "Đọc giờ đúng trên đồng hồ",
        "Thứ mấy đứng sau thứ ba",
    ],
    "G1-MEAS-02": [
        "Đo chiếc bút bằng thước cm",
        "Xem lịch hôm nay là thứ mấy",
        "Thực hành đọc 7 giờ đúng",
    ],
}

SCOPE_KEYWORDS_BY_CURRICULUM_TOPIC = {
    "G1-NUM-01": ("chuc", "don vi", "cau tao so", "tach so", "que tinh", "so "),
    "G1-NUM-02": ("so sanh", "lon hon", "be hon", "thu tu", "tia so", "xep"),
    "G1-OPS-01": ("cong", "tru", "them", "bot", "lay di", "que tinh"),
    "G1-OPS-02": ("tinh nham", "khung 10", "nham", "nhanh", "tia so"),
    "G1-WORD-01": ("bai toan", "loi van", "tom tat", "so do", "con lai", "them"),
    "G1-GEO-01": ("ben trai", "ben phai", "tren", "duoi", "o giua", "truoc", "sau", "vi tri"),
    "G1-GEO-02": ("hinh tron", "hinh vuong", "hinh tam giac", "hinh chu nhat", "khoi hop", "do vat"),
    "G1-GEO-03": ("ghep hinh", "xep hinh", "manh ghep", "keo tha", "ngoi nha"),
    "G1-MEAS-01": ("dai hon", "ngan hon", "dong ho", "lich", "thu", "ngay", "tuan"),
    "G1-MEAS-02": ("do dai", "thuoc", "cm", "doc gio", "gio dung"),
}

TOPIC_LABEL_BY_CURRICULUM_TOPIC = {
    "G1-NUM-01": "Cấu tạo số",
    "G1-NUM-02": "So sánh số",
    "G1-OPS-01": "Cộng trừ có minh họa",
    "G1-OPS-02": "Tính nhẩm",
    "G1-WORD-01": "Bài toán có lời văn",
    "G1-GEO-01": "Vị trí trong không gian",
    "G1-GEO-02": "Nhận biết hình",
    "G1-GEO-03": "Ghép hình",
    "G1-MEAS-01": "So sánh và đọc thời gian",
    "G1-MEAS-02": "Đo độ dài và đọc giờ",
}

EXPECTED_CONFIG_KEYS_BY_VISUAL = {
    "place_value_blocks": ("number", "tens", "ones"),
    "comparison_visual": ("a_label", "b_label"),
    "operation_story": ("operation", "before", "change", "result"),
    "stick_bundles": (
        "operation",
        "before",
        "change",
        "result",
        "object_name",
        "show_bundles",
        "tens_before",
        "ones_before",
        "tens_after",
        "ones_after",
    ),
    "bar_model": ("top_label", "bottom_label", "unit_label"),
    "spatial_position_scene": ("relation", "anchor_label", "moving_label"),
    "geometry_shape": ("shape_name",),
    "shape_composition": ("target_shape", "parts"),
    "clock_calendar": ("mode",),
    "ruler_measurement": ("object_name",),
}


@dataclass(frozen=True)
class CurriculumVisualPayload:
    topic: str
    visual_type: str
    title: str
    explanation: str
    life_example: str
    primary_count: int
    secondary_count: int
    total_count: float
    groups_label: str
    items_label: str
    config: dict[str, object] | None
    practice_question: LessonPracticeQuestion
    practice_chat: PracticeQuestion
    follow_ups: list[str]


def is_supported_curriculum_topic(curriculum_topic_id: str | None) -> bool:
    return bool(curriculum_topic_id and curriculum_topic_id in RUNTIME_TOPIC_BY_CURRICULUM_TOPIC)


def get_runtime_topic_for_curriculum_topic(curriculum_topic_id: str) -> str:
    return RUNTIME_TOPIC_BY_CURRICULUM_TOPIC[curriculum_topic_id]


def get_prompt_examples_for_curriculum_topic(curriculum_topic_id: str) -> list[str]:
    return list(PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC.get(curriculum_topic_id, ()))


def build_curriculum_scope_redirect_message(curriculum_topic_id: str) -> str:
    topic_label = TOPIC_LABEL_BY_CURRICULUM_TOPIC.get(curriculum_topic_id, "bài đang chọn")
    return (
        f"Con đang chọn bài '{topic_label}'. Câu hỏi này có vẻ chưa đúng nội dung của bài đó. "
        "Con hãy hỏi lại đúng phần kiến thức của bài này nhé."
    )



def is_curriculum_topic_message_in_scope(curriculum_topic_id: str, message: str) -> bool:
    normalized = _normalize(message)
    if not normalized.strip():
        return True

    current_keywords = SCOPE_KEYWORDS_BY_CURRICULUM_TOPIC.get(curriculum_topic_id, ())
    if any(keyword in normalized for keyword in current_keywords):
        return True

    for other_topic_id, keywords in SCOPE_KEYWORDS_BY_CURRICULUM_TOPIC.items():
        if other_topic_id == curriculum_topic_id:
            continue
        if any(keyword in normalized for keyword in keywords):
            return False

    return True


def get_expected_curriculum_visuals(curriculum_topic_id: str) -> set[str]:
    return set(ALLOWED_VISUALS_BY_CURRICULUM_TOPIC[curriculum_topic_id])


def get_expected_config_keys(visual_type: str) -> tuple[str, ...]:
    return EXPECTED_CONFIG_KEYS_BY_VISUAL.get(visual_type, ())


def build_grade1_curriculum_result(
    request: LearningCoreRequest,
    session_id: str,
) -> LearningCoreResult | None:
    curriculum_topic_id = request.curriculum_topic_id
    if not is_supported_curriculum_topic(curriculum_topic_id):
        return None

    assert curriculum_topic_id is not None
    payload = _build_payload(
        curriculum_topic_id=curriculum_topic_id,
        message=request.message,
        requested_visual=request.curriculum_visual_template,
    )
    runtime_topic = RUNTIME_TOPIC_BY_CURRICULUM_TOPIC[curriculum_topic_id]

    visual_card = VisualCard(
        topic=runtime_topic,
        title=payload.title,
        short_explanation=payload.explanation,
        life_example=payload.life_example,
        visual_data=VisualData(
            type=payload.visual_type,
            primary_count=payload.primary_count,
            secondary_count=payload.secondary_count,
            total_count=payload.total_count,
            groups_label=payload.groups_label,
            items_label=payload.items_label,
            config=payload.config,
        ),
        simulation_config=SimulationConfig(
            type=f"{payload.visual_type}_interactive",
            min_x=0,
            max_x=max(12, payload.primary_count + 4),
            min_y=0,
            max_y=max(12, payload.secondary_count + 4),
            default_x=payload.primary_count,
            default_y=payload.secondary_count,
            label_x=payload.groups_label,
            label_y=payload.items_label,
        ),
    )

    visual_spec = LessonVisual(
        visual_type=payload.visual_type,
        object=str((payload.config or {}).get("object_name") or (payload.config or {}).get("shape_name") or "curriculum"),
        groups=payload.primary_count,
        items_per_group=payload.secondary_count,
        total_items=int(payload.total_count),
    )
    simulation_spec = LessonSimulation(
        simulation_type=f"{payload.visual_type}_interactive",
        prompt=f"Thao tac voi visual {payload.visual_type} cho chu de {curriculum_topic_id}.",
    )

    return LearningCoreResult(
        topic=runtime_topic,
        curriculum_topic_id=curriculum_topic_id,
        grade=request.grade,
        intent="show_visual",
        assistant_message=payload.explanation,
        title=payload.title,
        simple_explanation=payload.explanation,
        real_life_example=payload.life_example,
        visual_spec=visual_spec,
        simulation_spec=simulation_spec,
        visual_card=visual_card,
        practice_question_spec=payload.practice_question,
        practice_question_chat=payload.practice_chat,
        tts_text=f"{payload.explanation} {payload.life_example}".strip(),
        response_mode="explain_with_visual_and_practice",
        follow_up_suggestions=payload.follow_ups,
        session_metadata=SessionMetadata(
            session_id=session_id,
            provider=settings.llm_provider,
            response_source="fallback",
        ),
        agent_metadata={
            "adapter": "grade1_curriculum",
            "curriculum_topic_id": curriculum_topic_id,
            "visual_type": payload.visual_type,
            "prompt_examples": PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC[curriculum_topic_id],
        },
    )


def build_grade1_prompt_matrix() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for curriculum_topic_id, prompts in PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC.items():
        default_visual = DEFAULT_VISUAL_BY_CURRICULUM_TOPIC[curriculum_topic_id]
        for index, prompt in enumerate(prompts, start=1):
            rows.append(
                {
                    "curriculum_topic_id": curriculum_topic_id,
                    "prompt": prompt,
                    "expected_visual": default_visual,
                    "expected_config_keys": ", ".join(get_expected_config_keys(default_visual)),
                    "notes": f"Prompt mau {index} cho {curriculum_topic_id}",
                }
            )
    return rows


def _build_payload(
    curriculum_topic_id: str,
    message: str,
    requested_visual: str | None,
) -> CurriculumVisualPayload:
    normalized = _normalize(message)
    numbers = _extract_numbers(message)
    visual_type = _pick_visual(curriculum_topic_id, normalized, requested_visual, numbers)

    if curriculum_topic_id == "G1-NUM-01":
        return _build_num_01_payload(visual_type, numbers)
    if curriculum_topic_id == "G1-NUM-02":
        return _build_num_02_payload(visual_type, numbers)
    if curriculum_topic_id == "G1-OPS-01":
        return _build_ops_01_payload(visual_type, normalized, numbers)
    if curriculum_topic_id == "G1-OPS-02":
        return _build_ops_02_payload(visual_type, normalized, numbers)
    if curriculum_topic_id == "G1-WORD-01":
        return _build_word_01_payload(visual_type, normalized, numbers)
    if curriculum_topic_id == "G1-GEO-01":
        return _build_geo_01_payload(numbers, normalized)
    if curriculum_topic_id == "G1-GEO-02":
        return _build_geo_02_payload(visual_type, normalized)
    if curriculum_topic_id == "G1-GEO-03":
        return _build_geo_03_payload(visual_type, normalized)
    if curriculum_topic_id == "G1-MEAS-01":
        return _build_meas_01_payload(visual_type, normalized, numbers)
    return _build_meas_02_payload(visual_type, normalized, numbers)


def _build_num_01_payload(visual_type: str, numbers: list[int]) -> CurriculumVisualPayload:
    number = numbers[0] if numbers else 24
    tens, ones = divmod(number, 10)
    if visual_type == "counting_objects" and number > 10:
        visual_type = "place_value_blocks"

    explanation = f"Số {number} gồm {tens} chục và {ones} đơn vị. Con có thể nhìn visual để thấy cấu tạo của số."
    life_example = f"Nếu có {number} que tính, ta tách thành {tens} bó mười và {ones} que lẻ."
    config = {"number": number, "tens": tens, "ones": ones}
    return CurriculumVisualPayload(
        topic="G1-NUM-01",
        visual_type=visual_type,
        title=f"Cấu tạo số {number}",
        explanation=explanation,
        life_example=life_example,
        primary_count=tens,
        secondary_count=ones,
        total_count=float(number),
        groups_label="Chục",
        items_label="Đơn vị",
        config=config,
        practice_question=LessonPracticeQuestion(
            question=f"Số {number} có bao nhiêu chục?",
            options=[str(max(tens - 1, 0)), str(tens), str(ones), str(number)],
            correct_answer=str(tens),
        ),
        practice_chat=PracticeQuestion(
            id="g1-num-01-practice",
            question_text=f"Số {number} có bao nhiêu chục?",
            options=[str(max(tens - 1, 0)), str(tens), str(ones), str(number)],
            correct_answer_index=1,
            success_message="Đúng rồi, con đã nhận ra số chục.",
            fail_message="Con thử tách số thành chục và đơn vị nhé.",
            hint="Mỗi chục gồm 10 đơn vị.",
        ),
        follow_ups=PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC["G1-NUM-01"],
    )


def _build_num_02_payload(visual_type: str, numbers: list[int]) -> CurriculumVisualPayload:
    a = numbers[0] if len(numbers) > 0 else 37
    b = numbers[1] if len(numbers) > 1 else 42
    bigger = max(a, b)
    smaller = min(a, b)
    symbol = ">" if a > b else "<" if a < b else "="
    explanation = f"Khi so sánh {a} và {b}, con nhìn vào visual sẽ thấy {a} {symbol} {b}."
    life_example = f"Số lớn hơn là {bigger}, còn số bé hơn là {smaller}."
    config = {"a_label": str(a), "b_label": str(b)}
    options = [str(a), str(b), str(abs(a - b)), "Bằng nhau"]
    correct_answer = str(bigger) if a != b else "Bằng nhau"
    return CurriculumVisualPayload(
        topic="G1-NUM-02",
        visual_type=visual_type,
        title=f"So sánh {a} và {b}",
        explanation=explanation,
        life_example=life_example,
        primary_count=a,
        secondary_count=b,
        total_count=float(max(a, b)),
        groups_label="Số",
        items_label="Đơn vị",
        config=config,
        practice_question=LessonPracticeQuestion(
            question=f"Số nào lớn hơn giữa {a} và {b}?",
            options=options,
            correct_answer=correct_answer,
        ),
        practice_chat=PracticeQuestion(
            id="g1-num-02-practice",
            question_text=f"Số nào lớn hơn giữa {a} và {b}?",
            options=options,
            correct_answer_index=options.index(correct_answer),
            success_message="Đúng rồi, con chọn đúng số lớn hơn.",
            fail_message="Con thử so sánh lại theo tia số hoặc theo số chục nhé.",
            hint="Số nào ở bên phải hơn trên tia số thì lớn hơn.",
        ),
        follow_ups=PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC["G1-NUM-02"],
    )


def _build_ops_01_payload(visual_type: str, normalized: str, numbers: list[int]) -> CurriculumVisualPayload:
    a = numbers[0] if len(numbers) > 0 else 24
    b = numbers[1] if len(numbers) > 1 else 13
    is_subtraction = any(token in normalized for token in ("bot", "tru", "lay di"))
    if is_subtraction and len(numbers) > 1 and " tu " in f" {normalized} ":
        a, b = numbers[1], numbers[0]
    operation = "-" if is_subtraction else "+"
    result = a - b if is_subtraction else a + b
    before_tens, before_ones = divmod(a, 10)
    after_tens, after_ones = divmod(result, 10)
    explanation = f"Ta minh họa {a} {operation} {b} bằng từng bước để con thấy rõ phép tính."
    life_example = (
        f"Bạn có {a} que tính, {'bớt đi' if is_subtraction else 'thêm'} {b} que tính "
        f"thì kết quả là {result}."
    )
    config = {
        "operation": operation,
        "before": a,
        "change": b,
        "result": result,
        "object_name": "que tính",
        "show_bundles": True,
        "tens_before": before_tens,
        "ones_before": before_ones,
        "tens_after": after_tens,
        "ones_after": after_ones,
    }
    return CurriculumVisualPayload(
        topic="G1-OPS-01",
        visual_type=visual_type,
        title=f"Minh họa {a} {operation} {b}",
        explanation=explanation,
        life_example=life_example,
        primary_count=a,
        secondary_count=b,
        total_count=float(result),
        groups_label="Que tính",
        items_label="Phép tính",
        config=config,
        practice_question=LessonPracticeQuestion(
            question=f"{a} {operation} {b} bằng bao nhiêu?",
            options=[str(result), str(a), str(b), str(abs(a - b))],
            correct_answer=str(result),
        ),
        practice_chat=PracticeQuestion(
            id="g1-ops-01-practice",
            question_text=f"{a} {operation} {b} bằng bao nhiêu?",
            options=[str(result), str(a), str(b), str(abs(a - b))],
            correct_answer_index=0,
            success_message="Đúng rồi, con đã tìm đúng kết quả.",
            fail_message="Con đếm lại trên hình từng bước nhé.",
            hint="Nếu thêm vào thì cộng, nếu bớt đi thì trừ.",
        ),
        follow_ups=PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC["G1-OPS-01"],
    )


def _build_ops_02_payload(visual_type: str, normalized: str, numbers: list[int]) -> CurriculumVisualPayload:
    a = numbers[0] if len(numbers) > 0 else 8
    b = numbers[1] if len(numbers) > 1 else 5
    is_subtraction = any(token in normalized for token in ("bot", "tru", "lay di"))
    operation = "-" if is_subtraction else "+"
    result = a - b if is_subtraction else a + b
    explanation = f"Đây là cách tính nhẩm {a} {operation} {b} bằng visual ngắn gọn và dễ nhìn."
    life_example = f"Con có thể tách nhanh {a} và {b} trên khung 10 hoặc tia số để ra {result}."
    config = {"operation": operation, "before": a, "change": b, "result": result}
    return CurriculumVisualPayload(
        topic="G1-OPS-02",
        visual_type=visual_type,
        title=f"Tính nhẩm {a} {operation} {b}",
        explanation=explanation,
        life_example=life_example,
        primary_count=a,
        secondary_count=b,
        total_count=float(result),
        groups_label="Số hạng",
        items_label="Kết quả",
        config=config,
        practice_question=LessonPracticeQuestion(
            question=f"Tính nhẩm {a} {operation} {b}",
            options=[str(result), str(a + b + 1), str(abs(a - b)), str(a)],
            correct_answer=str(result),
        ),
        practice_chat=PracticeQuestion(
            id="g1-ops-02-practice",
            question_text=f"Tính nhẩm {a} {operation} {b}",
            options=[str(result), str(a + b + 1), str(abs(a - b)), str(a)],
            correct_answer_index=0,
            success_message="Chính xác, con đã tính nhẩm đúng.",
            fail_message="Con thử dùng khung 10 hoặc nhảy trên tia số nhé.",
            hint="Tính nhẩm là nhìn nhanh số thay đổi bao nhiêu.",
        ),
        follow_ups=PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC["G1-OPS-02"],
    )


def _build_word_01_payload(visual_type: str, normalized: str, numbers: list[int]) -> CurriculumVisualPayload:
    start = numbers[0] if len(numbers) > 0 else 5
    change = numbers[1] if len(numbers) > 1 else 3
    is_subtraction = any(token in normalized for token in ("bot", "con lai", "bay di", "tru"))
    result = start - change if is_subtraction else start + change
    operation = "-" if is_subtraction else "+"
    object_name = "quả táo" if "tao" in normalized else "đồ vật"
    explanation = "Ta đổi bài toán lời văn thành visual để con thấy dữ liệu, phép tính và kết quả."
    life_example = (
        f"Lúc đầu có {start} {object_name}, "
        f"{'bớt đi' if is_subtraction else 'thêm'} {change} {object_name}, "
        f"nên kết quả là {result}."
    )
    config = {
        "top_label": "Ban đầu",
        "bottom_label": "Tất cả",
        "unit_label": object_name,
        "operation": operation,
        "before": start,
        "change": change,
        "result": result,
    }
    options = [str(result), str(start), str(change), str(start + change + 1)]
    return CurriculumVisualPayload(
        topic="G1-WORD-01",
        visual_type=visual_type,
        title="Tóm tắt bài toán lời văn",
        explanation=explanation,
        life_example=life_example,
        primary_count=start,
        secondary_count=change,
        total_count=float(result),
        groups_label="Đoạn",
        items_label=object_name,
        config=config,
        practice_question=LessonPracticeQuestion(
            question=f"Bài toán có {start} và {'thêm' if not is_subtraction else 'bớt'} {change}. Kết quả là bao nhiêu?",
            options=options,
            correct_answer=str(result),
        ),
        practice_chat=PracticeQuestion(
            id="g1-word-01-practice",
            question_text=f"Bài toán có {start} và {'thêm' if not is_subtraction else 'bớt'} {change}. Kết quả là bao nhiêu?",
            options=options,
            correct_answer_index=0,
            success_message="Đúng rồi, con đã chuyển được bài toán thành phép tính.",
            fail_message="Con đọc lại bài toán và xem sơ đồ thanh nhé.",
            hint="Tìm xem bài toán đang thêm vào hay bớt đi.",
        ),
        follow_ups=PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC["G1-WORD-01"],
    )


def _build_geo_01_payload(numbers: list[int], normalized: str) -> CurriculumVisualPayload:
    relation_id, relation_name = _parse_relation(normalized)
    moving_label = "Quả bóng" if "bong" in normalized else "Vật A"
    anchor_label = "Cái hộp" if "hop" in normalized else "Vật B"
    explanation = f"Visual này giúp con thấy vị trí {relation_name.lower()} trong không gian."
    life_example = f"Con hãy nhìn xem {moving_label.lower()} đang ở {relation_name.lower()} {anchor_label.lower()}."
    config = {
        "relation": relation_name,
        "anchor_label": anchor_label,
        "moving_label": moving_label,
    }
    options = ["Bên trái", "Bên phải", "Ở giữa", relation_name]
    if relation_name not in options:
        options[-1] = relation_name
    return CurriculumVisualPayload(
        topic="G1-GEO-01",
        visual_type="spatial_position_scene",
        title=f"Vị trí {relation_name.lower()}",
        explanation=explanation,
        life_example=life_example,
        primary_count=relation_id,
        secondary_count=0,
        total_count=float(relation_id),
        groups_label="Vị trí",
        items_label="Không gian",
        config=config,
        practice_question=LessonPracticeQuestion(
            question="Trong visual, vật đang ở vị trí nào?",
            options=options,
            correct_answer=relation_name,
        ),
        practice_chat=PracticeQuestion(
            id="g1-geo-01-practice",
            question_text="Trong visual, vật đang ở vị trí nào?",
            options=options,
            correct_answer_index=options.index(relation_name),
            success_message="Tốt lắm, con đã nhận đúng vị trí.",
            fail_message="Con so sánh lại vật với mốc chuẩn nhé.",
            hint="Hãy nhìn vật đang nằm bên trái, bên phải, trên, dưới hay ở giữa.",
        ),
        follow_ups=PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC["G1-GEO-01"],
    )


def _build_geo_02_payload(visual_type: str, normalized: str) -> CurriculumVisualPayload:
    shape_id, shape_name = _parse_shape(normalized)
    explanation = f"Visual này giúp con nhận biết {shape_name.lower()} thông qua đặc điểm và vật quen thuộc."
    life_example = f"Con có thể tìm {shape_name.lower()} trong đồ vật xung quanh."
    config = {"shape_name": shape_name}
    options = ["Hình tròn", "Hình vuông", "Hình tam giác", "Hình chữ nhật"]
    correct_answer = shape_name if shape_name in options else options[0]
    return CurriculumVisualPayload(
        topic="G1-GEO-02",
        visual_type=visual_type,
        title=f"Nhận biết {shape_name.lower()}",
        explanation=explanation,
        life_example=life_example,
        primary_count=shape_id,
        secondary_count=0,
        total_count=float(shape_id),
        groups_label="Hình học",
        items_label="Vật thật",
        config=config,
        practice_question=LessonPracticeQuestion(
            question="Con đang học hình nào?",
            options=options,
            correct_answer=correct_answer,
        ),
        practice_chat=PracticeQuestion(
            id="g1-geo-02-practice",
            question_text="Con đang học hình nào?",
            options=options,
            correct_answer_index=options.index(correct_answer),
            success_message="Đúng rồi, con đã gọi đúng tên hình.",
            fail_message="Con xem lại số cạnh hoặc hình dáng của vật nhé.",
            hint="Hình tròn không có cạnh, hình vuông có 4 cạnh bằng nhau.",
        ),
        follow_ups=PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC["G1-GEO-02"],
    )


def _build_geo_03_payload(visual_type: str, normalized: str) -> CurriculumVisualPayload:
    target_shape = "Ngôi nhà" if "nha" in normalized else "Hình mới"
    parts = ["Tam giác", "Hình vuông"] if "tam giac" in normalized and "vuong" in normalized else ["Hình vuông", "Hình vuông", "Tam giác"]
    explanation = f"Con có thể ghép các hình nhỏ để tạo thành {target_shape.lower()}."
    life_example = f"Mỗi phần nhỏ ghép lại sẽ tạo ra {target_shape.lower()} rõ ràng hơn."
    config = {"target_shape": target_shape, "parts": parts}
    return CurriculumVisualPayload(
        topic="G1-GEO-03",
        visual_type=visual_type,
        title=f"Ghép hình tạo {target_shape.lower()}",
        explanation=explanation,
        life_example=life_example,
        primary_count=len(parts),
        secondary_count=max(2, len(parts) - 1),
        total_count=float(len(parts)),
        groups_label="Ghép hình",
        items_label="Mảnh ghép",
        config=config,
        practice_question=LessonPracticeQuestion(
            question=f"Cần ghép bao nhiêu mảnh để tạo {target_shape.lower()}?",
            options=[str(len(parts) - 1), str(len(parts)), str(len(parts) + 1), "10"],
            correct_answer=str(len(parts)),
        ),
        practice_chat=PracticeQuestion(
            id="g1-geo-03-practice",
            question_text=f"Cần ghép bao nhiêu mảnh để tạo {target_shape.lower()}?",
            options=[str(len(parts) - 1), str(len(parts)), str(len(parts) + 1), "10"],
            correct_answer_index=1,
            success_message="Chuẩn rồi, con đếm đúng số mảnh ghép.",
            fail_message="Con đếm lại các mảnh hình trên visual nhé.",
            hint="Mỗi mảnh hình là một phần của hình lớn.",
        ),
        follow_ups=PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC["G1-GEO-03"],
    )


def _build_meas_01_payload(visual_type: str, normalized: str, numbers: list[int]) -> CurriculumVisualPayload:
    if visual_type == "clock_calendar":
        if any(token in normalized for token in ("thu", "ngay", "tuan", "lich")):
            weekday = _parse_weekday(normalized)
            explanation = f"Visual lịch giúp con nhận ra thứ trong tuần. Ở đây đang là {weekday.lower()}."
            life_example = f"Con có thể dùng lịch để tìm ngày hôm nay và ngày hôm sau của {weekday.lower()}."
            config = {"mode": "calendar", "weekday": weekday}
            options = ["Thứ hai", "Thứ ba", "Thứ tư", weekday]
            if weekday not in options:
                options[-1] = weekday
            correct_answer = weekday
            primary = _weekday_to_index(weekday)
            secondary = 0
        else:
            hour = numbers[0] if numbers else 7
            explanation = f"Visual đồng hồ đang chỉ {hour} giờ đúng."
            life_example = f"Khi kim ngắn chỉ {hour} và kim dài chỉ số 12, ta đọc là {hour} giờ đúng."
            config = {"mode": "clock", "hour": hour, "minute": 0}
            options = [f"{hour} giờ", f"{hour + 1} giờ", "12 giờ", "1 giờ"]
            correct_answer = f"{hour} giờ"
            primary = hour
            secondary = 0
        return CurriculumVisualPayload(
            topic="G1-MEAS-01",
            visual_type=visual_type,
            title="Đọc giờ và xem lịch",
            explanation=explanation,
            life_example=life_example,
            primary_count=primary,
            secondary_count=secondary,
            total_count=float(primary),
            groups_label="Thời gian",
            items_label="Đọc hình",
            config=config,
            practice_question=LessonPracticeQuestion(
                question="Con đang nhìn thấy gì trên visual?",
                options=options,
                correct_answer=correct_answer,
            ),
            practice_chat=PracticeQuestion(
                id="g1-meas-01-practice-clock",
                question_text="Con đang nhìn thấy gì trên visual?",
                options=options,
                correct_answer_index=options.index(correct_answer),
                success_message="Đúng rồi, con đọc đúng thời gian hoặc thứ.",
                fail_message="Con đối chiếu lại kim đồng hồ hoặc ngày được tô màu nhé.",
                hint="Hãy nhìn kim ngắn, kim dài hoặc ô được nhấn trên lịch.",
            ),
            follow_ups=PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC["G1-MEAS-01"],
        )

    if visual_type == "ruler_measurement":
        length = numbers[0] if numbers else 9
        object_name = "Cây bút"
        explanation = f"Visual này giúp con đọc độ dài {length} cm trên thước."
        life_example = f"{object_name} dài {length} cm khi đặt sát vạch 0 của thước."
        config = {"object_name": object_name}
        return CurriculumVisualPayload(
            topic="G1-MEAS-01",
            visual_type=visual_type,
            title=f"Đo dài {length} cm",
            explanation=explanation,
            life_example=life_example,
            primary_count=length,
            secondary_count=0,
            total_count=float(length),
            groups_label="Độ dài",
            items_label=object_name,
            config=config,
            practice_question=LessonPracticeQuestion(
                question=f"{object_name} dài bao nhiêu cm?",
                options=[str(length - 1), str(length), str(length + 1), "20"],
                correct_answer=str(length),
            ),
            practice_chat=PracticeQuestion(
                id="g1-meas-01-practice-ruler",
                question_text=f"{object_name} dài bao nhiêu cm?",
                options=[str(length - 1), str(length), str(length + 1), "20"],
                correct_answer_index=1,
                success_message="Đúng rồi, con đọc đúng trên thước.",
                fail_message="Con nhìn lại điểm đầu và điểm cuối của vật nhé.",
                hint="Vật bắt đầu từ vạch 0 và kết thúc ở vạch nào?",
            ),
            follow_ups=PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC["G1-MEAS-01"],
        )

    a = numbers[0] if len(numbers) > 0 else 8
    b = numbers[1] if len(numbers) > 1 else 5
    longer_label = "Bút A"
    shorter_label = "Bút B"
    explanation = f"Visual giúp con thấy {longer_label.lower()} {'dài hơn' if a >= b else 'ngắn hơn'} {shorter_label.lower()}."
    life_example = "So sánh độ dài để biết vật nào dài hơn và vật nào ngắn hơn."
    config = {"a_label": longer_label, "b_label": shorter_label}
    correct = longer_label if a >= b else shorter_label
    options = [longer_label, shorter_label, "Bằng nhau", "Không biết"]
    return CurriculumVisualPayload(
        topic="G1-MEAS-01",
        visual_type=visual_type,
        title="So sánh độ dài",
        explanation=explanation,
        life_example=life_example,
        primary_count=a,
        secondary_count=b,
        total_count=float(max(a, b)),
        groups_label="Vật",
        items_label="Độ dài",
        config=config,
        practice_question=LessonPracticeQuestion(
            question="Vật nào dài hơn?",
            options=options,
            correct_answer=correct,
        ),
        practice_chat=PracticeQuestion(
            id="g1-meas-01-practice-compare",
            question_text="Vật nào dài hơn?",
            options=options,
            correct_answer_index=options.index(correct),
            success_message="Đúng rồi, con đã so sánh đúng độ dài.",
            fail_message="Con nhìn lại thanh nào dài hơn nhé.",
            hint="Thanh nào dài hơn thì vật đó dài hơn.",
        ),
        follow_ups=PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC["G1-MEAS-01"],
    )


def _build_meas_02_payload(visual_type: str, normalized: str, numbers: list[int]) -> CurriculumVisualPayload:
    if visual_type == "clock_calendar":
        hour = numbers[0] if numbers else 7
        explanation = f"Con đang thực hành đọc {hour} giờ đúng trên đồng hồ."
        life_example = "Mỗi lần nhìn đồng hồ, con hãy tìm kim ngắn và kim dài trước."
        config = {"mode": "clock", "hour": hour, "minute": 0}
        options = [f"{hour} giờ", f"{hour + 1} giờ", "12 giờ", "1 giờ"]
        correct_answer = f"{hour} giờ"
        return CurriculumVisualPayload(
            topic="G1-MEAS-02",
            visual_type=visual_type,
            title="Thực hành đọc giờ",
            explanation=explanation,
            life_example=life_example,
            primary_count=hour,
            secondary_count=0,
            total_count=float(hour),
            groups_label="Giờ",
            items_label="Đồng hồ",
            config=config,
            practice_question=LessonPracticeQuestion(
                question="Đồng hồ đang chỉ mấy giờ?",
                options=options,
                correct_answer=correct_answer,
            ),
            practice_chat=PracticeQuestion(
                id="g1-meas-02-practice-clock",
                question_text="Đồng hồ đang chỉ mấy giờ?",
                options=options,
                correct_answer_index=options.index(correct_answer),
                success_message="Đúng rồi, con đọc giờ rất tốt.",
                fail_message="Con xem lại kim ngắn và kim dài nhé.",
                hint="Kim dài chỉ số 12 là giờ đúng.",
            ),
            follow_ups=PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC["G1-MEAS-02"],
        )

    length = numbers[0] if numbers else 12
    object_name = "Cây bút"
    explanation = f"Con đang thực hành đo độ dài {object_name.lower()} bằng thước. Kết quả là {length} cm."
    life_example = "Khi đo vật, con đặt đầu vật tại vạch 0 rồi đọc vạch cuối."
    config = {"object_name": object_name}
    return CurriculumVisualPayload(
        topic="G1-MEAS-02",
        visual_type=visual_type,
        title="Thực hành đo độ dài",
        explanation=explanation,
        life_example=life_example,
        primary_count=length,
        secondary_count=0,
        total_count=float(length),
        groups_label="Độ dài",
        items_label=object_name,
        config=config,
        practice_question=LessonPracticeQuestion(
            question=f"{object_name} dài bao nhiêu cm?",
            options=[str(length - 1), str(length), str(length + 1), "5"],
            correct_answer=str(length),
        ),
        practice_chat=PracticeQuestion(
            id="g1-meas-02-practice-ruler",
            question_text=f"{object_name} dài bao nhiêu cm?",
            options=[str(length - 1), str(length), str(length + 1), "5"],
            correct_answer_index=1,
            success_message="Đúng rồi, con đã đọc đúng kết quả đo.",
            fail_message="Con kiểm tra lại vạch cuối của vật nhé.",
            hint="Hãy đọc số ở ngay vạch cuối của vật.",
        ),
        follow_ups=PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC["G1-MEAS-02"],
    )


def _pick_visual(
    curriculum_topic_id: str,
    normalized: str,
    requested_visual: str | None,
    numbers: list[int],
) -> str:
    allowed = ALLOWED_VISUALS_BY_CURRICULUM_TOPIC[curriculum_topic_id]
    if requested_visual in allowed:
        return requested_visual

    if curriculum_topic_id == "G1-NUM-01":
        if "tia so" in normalized:
            return "number_line"
        if "dem" in normalized and numbers and numbers[0] <= 10:
            return "counting_objects"
    elif curriculum_topic_id == "G1-NUM-02":
        if any(token in normalized for token in ("tia so", "thu tu", "xep")):
            return "number_line"
    elif curriculum_topic_id == "G1-OPS-01":
        if "que tinh" in normalized or "hinh" in normalized:
            return "stick_bundles" if "que tinh" in normalized else "counting_objects"
        if "chuc" in normalized and "don vi" in normalized:
            return "place_value_blocks"
    elif curriculum_topic_id == "G1-OPS-02":
        if "tia so" in normalized:
            return "number_line"
    elif curriculum_topic_id == "G1-WORD-01":
        if "bar model" not in normalized and "so do" not in normalized and "tom tat" not in normalized:
            return "operation_story"
    elif curriculum_topic_id == "G1-GEO-02":
        if any(token in normalized for token in ("vat nao", "do vat", "dong ho", "sach", "hop")):
            return "real_object_match"
    elif curriculum_topic_id == "G1-GEO-03":
        if "keo tha" in normalized:
            return "drag_drop_shapes"
    elif curriculum_topic_id == "G1-MEAS-01":
        if any(token in normalized for token in ("gio", "dong ho", "thu", "ngay", "tuan", "lich")):
            return "clock_calendar"
        if any(token in normalized for token in ("cm", "do", "thuoc")):
            return "ruler_measurement"
    elif curriculum_topic_id == "G1-MEAS-02":
        if any(token in normalized for token in ("gio", "dong ho", "thu", "ngay", "lich")):
            return "clock_calendar"

    return DEFAULT_VISUAL_BY_CURRICULUM_TOPIC[curriculum_topic_id]


def _normalize(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text.lower())
    stripped = "".join(ch for ch in nfkd if unicodedata.category(ch) != "Mn")
    return stripped.replace("đ", "d")


def _extract_numbers(text: str) -> list[int]:
    return [int(item) for item in re.findall(r"\d+", text)]


def _parse_relation(normalized: str) -> tuple[int, str]:
    pairs = (
        ("ben trai", (3, "Bên trái")),
        ("trai", (3, "Bên trái")),
        ("ben phai", (4, "Bên phải")),
        ("phai", (4, "Bên phải")),
        ("tren", (1, "Trên")),
        ("duoi", (2, "Dưới")),
        ("o giua", (5, "Ở giữa")),
        ("giua", (5, "Ở giữa")),
        ("truoc", (5, "Phía trước")),
        ("sau", (6, "Phía sau")),
    )
    for token, value in pairs:
        if token in normalized:
            return value
    return (3, "Bên trái")


def _parse_shape(normalized: str) -> tuple[int, str]:
    if "tron" in normalized:
        return (1, "Hình tròn")
    if "vuong" in normalized:
        return (2, "Hình vuông")
    if "tam giac" in normalized:
        return (3, "Hình tam giác")
    if "chu nhat" in normalized or "hop chu nhat" in normalized:
        return (4, "Hình chữ nhật")
    return (2, "Hình vuông")


def _parse_weekday(normalized: str) -> str:
    weekday_pairs = (
        ("thu hai", "Thứ hai"),
        ("thu ba", "Thứ ba"),
        ("thu tu", "Thứ tư"),
        ("thu nam", "Thứ năm"),
        ("thu sau", "Thứ sáu"),
        ("thu bay", "Thứ bảy"),
        ("chu nhat", "Chủ nhật"),
    )
    for token, value in weekday_pairs:
        if token in normalized:
            return value
    return "Thứ tư"


def _weekday_to_index(weekday: str) -> int:
    mapping = {
        "Thứ hai": 1,
        "Thứ ba": 2,
        "Thứ tư": 3,
        "Thứ năm": 4,
        "Thứ sáu": 5,
        "Thứ bảy": 6,
        "Chủ nhật": 7,
    }
    return mapping.get(weekday, 3)
