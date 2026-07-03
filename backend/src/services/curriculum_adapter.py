from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from typing import Literal

from src.core.config import settings
from src.models.chat import PracticeQuestion, SimulationConfig, VisualCard, VisualData
from src.models.lesson import LessonPracticeQuestion, LessonSimulation, LessonVisual
from src.services.types import LearningCoreRequest, LearningCoreResult, SessionMetadata
from src.services.visualization_generator import VisualizationPlan, resolve_visualization_plan
from src.services.visualization_validator import validate_visual_payload

RUNTIME_TOPIC_BY_CURRICULUM_TOPIC = {
    # Grade 1
    "G1-NUM-01": "multiplication",
    "G1-NUM-02": "comparison_numbers",
    "G1-OPS-01": "addition_subtraction",
    "G1-OPS-02": "addition_subtraction",
    "G1-WORD-01": "multiplication",
    "G1-GEO-01": "perimeter_area_basic",
    "G1-GEO-02": "perimeter_area_basic",
    "G1-GEO-03": "perimeter_area_basic",
    "G1-MEAS-01": "perimeter_area_basic",
    "G1-MEAS-02": "perimeter_area_basic",
    # Grade 2
    "G2-NUM-01": "multiplication",
    "G2-NUM-02": "comparison_numbers",
    "G2-NUM-03": "multiplication",
    "G2-OPS-01": "addition_subtraction",
    "G2-OPS-02": "multiplication",
    "G2-OPS-03": "addition_subtraction",
    "G2-WORD-01": "multiplication",
    "G2-GEO-01": "perimeter_area_basic",
    "G2-GEO-02": "perimeter_area_basic",
    "G2-MEAS-01": "perimeter_area_basic",
    "G2-MEAS-02": "perimeter_area_basic",
    "G2-STAT-01": "data_representation",
    "G2-PROB-01": "data_representation",
}

DEFAULT_VISUAL_BY_CURRICULUM_TOPIC = {
    # Grade 1
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
    # Grade 2
    "G2-NUM-01": "place_value_blocks",
    "G2-NUM-02": "comparison_visual",
    "G2-NUM-03": "grouping_model",
    "G2-OPS-01": "place_value_blocks",
    "G2-OPS-02": "array_model",
    "G2-OPS-03": "ten_frame",
    "G2-WORD-01": "operation_story",
    "G2-GEO-01": "geometry_shape",
    "G2-GEO-02": "shape_composition",
    "G2-MEAS-01": "clock_calendar",
    "G2-MEAS-02": "ruler_measurement",
    "G2-STAT-01": "picture_graph",
    "G2-PROB-01": "probability_experiment",
}

ALLOWED_VISUALS_BY_CURRICULUM_TOPIC = {
    # Grade 1
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
    # Grade 2
    "G2-NUM-01": ("place_value_blocks", "number_line", "counting_objects"),
    "G2-NUM-02": ("comparison_visual", "number_line", "place_value_blocks"),
    "G2-NUM-03": ("grouping_model", "counting_objects"),
    "G2-OPS-01": ("place_value_blocks", "number_line", "operation_story"),
    "G2-OPS-02": ("array_model", "grouping_model", "counting_objects"),
    "G2-OPS-03": ("ten_frame", "number_line", "place_value_blocks"),
    "G2-WORD-01": ("operation_story", "bar_model", "counting_objects", "array_model"),
    "G2-GEO-01": ("geometry_shape", "shape_sorting", "real_object_match"),
    "G2-GEO-02": ("ruler_measurement", "shape_composition", "drag_drop_shapes"),
    "G2-MEAS-01": ("mass_capacity_visual", "clock_calendar", "money_visual", "ruler_measurement"),
    "G2-MEAS-02": (
        "ruler_measurement",
        "clock_calendar",
        "mass_capacity_visual",
        "polyline_length_visual",
    ),
    "G2-STAT-01": ("picture_graph", "data_table", "counting_objects"),
    "G2-PROB-01": ("probability_experiment", "scenario_cards"),
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
    # Grade 2
    "G2-NUM-01": [
        "Số 234 gồm mấy trăm mấy chục mấy đơn vị?",
        "Biểu diễn số 150 bằng trăm chục đơn vị",
        "Đọc số 708 trên tia số",
    ],
    "G2-NUM-02": [
        "So sánh 342 và 324",
        "Số nào lớn nhất: 150, 510, 105?",
        "Sắp xếp 231, 312, 213 theo thứ tự tăng dần",
    ],
    "G2-NUM-03": [
        "Ước lượng 47 bằng cách nhóm theo chục",
        "Xếp 35 que tính thành từng nhóm 10",
        "Ước lượng nhanh 63 bằng mắt",
    ],
    "G2-OPS-01": [
        "Minh họa 245 + 132 bằng khối trăm chục đơn vị",
        "Tính 500 - 234 bằng hình",
        "Giải thích phép cộng có nhớ 157 + 46",
    ],
    "G2-OPS-02": [
        "Minh họa 3 × 5 bằng mảng ô vuông",
        "Chia đều 20 kẹo cho 5 bạn",
        "Bảng nhân 2: minh họa 2 × 4",
    ],
    "G2-OPS-03": [
        "Tính nhẩm 70 + 80 bằng tia số",
        "Nhẩm nhanh 200 - 100",
        "Dùng khung 10 tính 15 + 7",
    ],
    "G2-WORD-01": [
        "An có 12 quyển sách, mua thêm 8 quyển. Tất cả có mấy quyển?",
        "Vẽ sơ đồ bài toán: 24 bạn chia thành 4 nhóm đều nhau",
        "Hộp kẹo có 30 cái, ăn 15 cái, còn lại bao nhiêu?",
    ],
    "G2-GEO-01": [
        "Nhận biết đoạn thẳng và đường cong",
        "Tìm hình tứ giác trong các vật xung quanh",
        "Nhận biết khối trụ và khối cầu",
    ],
    "G2-GEO-02": [
        "Vẽ đoạn thẳng dài 6 cm bằng thước",
        "Ghép hình chữ nhật từ hai hình vuông",
        "Kéo thả hình tam giác để tạo hình ngôi nhà",
    ],
    "G2-MEAS-01": [
        "Nhận biết kg và đọc số đo khối lượng",
        "Đồng hồ chỉ 8 giờ 30 phút đọc thế nào?",
        "Xem lịch: tháng 3 có bao nhiêu ngày?",
    ],
    "G2-MEAS-02": [
        "Tính độ dài đường gấp khúc có 3 đoạn: 4cm, 3cm, 5cm",
        "Đổi 2 kg = bao nhiêu gram?",
        "Đọc giờ khi kim phút chỉ số 6",
    ],
    "G2-STAT-01": [
        "Đọc biểu đồ tranh: mỗi hình sao = 2 bạn",
        "Lập bảng số liệu màu sắc yêu thích của lớp",
        "Nhận xét từ biểu đồ tranh về số lượng",
    ],
    "G2-PROB-01": [
        "Sự kiện nào chắc chắn xảy ra: mặt trời mọc ở đông?",
        "Lấy bóng từ hộp có 3 bóng đỏ 2 bóng xanh: màu nào dễ ra hơn?",
        "Tung đồng xu: kết quả có thể là gì?",
    ],
}

SCOPE_KEYWORDS_BY_CURRICULUM_TOPIC = {
    # Grade 1
    "G1-NUM-01": (
        "chuc",
        "don vi",
        "cau tao so",
        "tach so",
        "que tinh",
        "may chuc",
        "may don vi",
        "gom may",
    ),
    "G1-NUM-02": ("so sanh", "lon hon", "be hon", "thu tu", "tia so", "xep"),
    "G1-OPS-01": ("cong", "tru", "them", "bot", "lay di", "que tinh"),
    "G1-OPS-02": ("tinh nham", "khung 10", "nham", "nhanh", "tia so"),
    "G1-WORD-01": ("bai toan", "loi van", "tom tat", "so do", "con lai", "them"),
    "G1-GEO-01": ("ben trai", "ben phai", "tren", "duoi", "o giua", "truoc", "sau", "vi tri"),
    "G1-GEO-02": (
        "hinh tron",
        "hinh vuong",
        "hinh tam giac",
        "hinh chu nhat",
        "khoi hop",
        "do vat",
    ),
    "G1-GEO-03": ("ghep hinh", "xep hinh", "manh ghep", "keo tha", "ngoi nha"),
    "G1-MEAS-01": ("dai hon", "ngan hon", "dong ho", "lich", "thu", "ngay", "tuan"),
    "G1-MEAS-02": ("do dai", "thuoc", "cm", "doc gio", "gio dung"),
    # Grade 2
    "G2-NUM-01": (
        "tram",
        "nghin",
        "cau tao so",
        "so tron tram",
        "tia so",
        "bien dien",
        "may tram",
        "may chuc",
        "may don vi",
        "gom may",
    ),
    "G2-NUM-02": ("so sanh", "lon nhat", "be nhat", "sap xep", "tang dan", "giam dan"),
    "G2-NUM-03": ("uoc luong", "nhom chuc", "uoc tinh", "bao nhieu"),
    "G2-OPS-01": ("cong co nho", "tru co muon", "ket qua", "cot doc", "dat tinh"),
    "G2-OPS-02": ("nhan", "chia", "bang nhan 2", "bang nhan 5", "bang chia", "deu"),
    "G2-OPS-03": ("nham", "tron chuc", "tron tram", "nhanh", "nham nhanh", "tia so", "tinh"),
    "G2-WORD-01": ("bai toan", "loi van", "mot buoc", "tat ca", "con lai", "nhieu hon", "it hon"),
    "G2-GEO-01": (
        "diem",
        "doan thang",
        "duong cong",
        "duong thang",
        "duong gap khuc",
        "tu giac",
        "khoi tru",
        "khoi cau",
    ),
    "G2-GEO-02": ("ve doan thang", "gep cat", "ghep hinh", "do dai cho truoc"),
    "G2-MEAS-01": (
        "kg",
        "khoi luong",
        "lit",
        "dung tich",
        "dm",
        "km",
        "gio phut",
        "tien",
        "ngay thang",
    ),
    "G2-MEAS-02": ("chuyen doi", "do gap khuc", "kim phut", "uoc luong do luong"),
    "G2-STAT-01": ("bieu do tranh", "phan loai", "kiem dem", "bang so lieu", "nhan xet"),
    "G2-PROB-01": ("co the", "chac chan", "khong the", "xac suat", "ngau nhien"),
}

TOPIC_LABEL_BY_CURRICULUM_TOPIC = {
    # Grade 1
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
    # Grade 2
    "G2-NUM-01": "Số và cấu tạo thập phân trong phạm vi 1000",
    "G2-NUM-02": "So sánh và sắp xếp số trong phạm vi 1000",
    "G2-NUM-03": "Ước lượng số đồ vật theo nhóm chục",
    "G2-OPS-01": "Cộng và trừ trong phạm vi 1000",
    "G2-OPS-02": "Phép nhân và phép chia bảng 2 và 5",
    "G2-OPS-03": "Tính nhẩm cộng trừ",
    "G2-WORD-01": "Bài toán một bước tính",
    "G2-GEO-01": "Nhận biết điểm đoạn thẳng và hình",
    "G2-GEO-02": "Vẽ và ghép hình",
    "G2-MEAS-01": "Các đại lượng đo lường lớp 2",
    "G2-MEAS-02": "Thực hành đo và chuyển đổi",
    "G2-STAT-01": "Biểu đồ tranh và bảng số liệu",
    "G2-PROB-01": "Khả năng xảy ra của sự kiện",
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
    "ruler_measurement": ("object_name", "length_cm"),
    "money_visual": ("denominations", "total_value", "currency"),
    "mass_capacity_visual": ("left_label", "right_label", "unit", "left_value", "right_value"),
    "picture_graph": ("labels", "values", "unit_value", "icon_emoji"),
    "data_table": ("labels", "values"),
    "probability_experiment": ("outcomes", "favorable_count", "experiment_label"),
    "polyline_length_visual": ("segments",),
}

CurriculumScopeStatus = Literal[
    "in_scope",
    "other_curriculum_topic",
    "out_of_curriculum",
]


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
    topic_label = TOPIC_LABEL_BY_CURRICULUM_TOPIC.get(curriculum_topic_id, "bài đang chọn")
    return (
        f"Con đang chọn bài '{topic_label}'. Câu hỏi này có vẻ chưa đúng nội dung của bài đó. "
        "Con hãy hỏi lại đúng phần kiến thức của bài này nhé."
    )


def build_curriculum_out_of_scope_message(grade: int) -> str:
    return (
        f"Cô đang hỗ trợ kiến thức toán lớp {grade} thôi nhé. "
        f"Con hãy hỏi lại một nội dung đúng trong chương trình toán lớp {grade}."
    )


def get_prompt_examples_for_grade(grade: int, limit: int = 4) -> list[str]:
    topic_prefix = f"G{grade}-"
    examples: list[str] = []
    for curriculum_topic_id, prompts in PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC.items():
        if not curriculum_topic_id.startswith(topic_prefix):
            continue
        if prompts:
            examples.append(prompts[0])
        if len(examples) >= limit:
            break
    return examples


def resolve_curriculum_topic_scope(
    curriculum_topic_id: str,
    message: str,
    matched_topic_id: str | None = None,
) -> CurriculumScopeStatus:
    normalized = _normalize(message)
    if not normalized.strip():
        return "in_scope"

    if matched_topic_id is not None:
        return "in_scope" if matched_topic_id == curriculum_topic_id else "other_curriculum_topic"

    current_keywords = SCOPE_KEYWORDS_BY_CURRICULUM_TOPIC.get(curriculum_topic_id, ())
    if any(keyword in normalized for keyword in current_keywords):
        return "in_scope"

    for other_topic_id, keywords in SCOPE_KEYWORDS_BY_CURRICULUM_TOPIC.items():
        if other_topic_id == curriculum_topic_id:
            continue
        if any(keyword in normalized for keyword in keywords):
            return "other_curriculum_topic"

    return "out_of_curriculum"


def is_curriculum_topic_message_in_scope(curriculum_topic_id: str, message: str) -> bool:
    return resolve_curriculum_topic_scope(curriculum_topic_id, message) == "in_scope"


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
    plan = _get_visualization_plan(
        curriculum_topic_id=curriculum_topic_id,
        message=request.message,
        requested_visual=request.curriculum_visual_template,
    )
    payload = _build_payload(
        curriculum_topic_id=curriculum_topic_id,
        message=request.message,
        requested_visual=request.curriculum_visual_template,
    )
    if plan is not None:
        validation_result = validate_visual_payload(
            concept_type=plan.concept_type,
            template=payload.visual_type,
            grade=request.grade,
            primary_count=payload.primary_count,
            secondary_count=payload.secondary_count,
            total_count=payload.total_count,
            config=payload.config,
        )
        if not validation_result.is_valid:
            fallback_plan = VisualizationPlan(
                concept_type=plan.concept_type,
                template=DEFAULT_VISUAL_BY_CURRICULUM_TOPIC[curriculum_topic_id],
                requested_template_accepted=False,
            )
            fallback_payload = _build_payload(
                curriculum_topic_id=curriculum_topic_id,
                message=request.message,
                requested_visual=fallback_plan.template,
            )
            payload = fallback_payload
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
            concept_type=plan.concept_type if plan is not None else None,
            polypad_enabled=plan.polypad_enabled if plan is not None else None,
            polypad_mode=plan.polypad_mode if plan is not None else None,
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
        object=str(
            (payload.config or {}).get("object_name")
            or (payload.config or {}).get("shape_name")
            or "curriculum"
        ),
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
    if curriculum_topic_id == "G1-MEAS-02":
        return _build_meas_02_payload(visual_type, normalized, numbers)
    if curriculum_topic_id.startswith("G2-"):
        from src.services.curriculum_adapter_g2_clean import build_g2_payload

        return build_g2_payload(curriculum_topic_id, visual_type, normalized, numbers)
    raise KeyError(f"Unsupported curriculum topic: {curriculum_topic_id}")


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
    options = [str(a), str(b), str(abs(a - b)), "B?ng nhau"]
    correct_answer = str(bigger) if a != b else "B?ng nhau"
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


def _build_ops_01_payload(
    visual_type: str, normalized: str, numbers: list[int]
) -> CurriculumVisualPayload:
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


def _build_ops_02_payload(
    visual_type: str, normalized: str, numbers: list[int]
) -> CurriculumVisualPayload:
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


def _build_word_01_payload(
    visual_type: str, normalized: str, numbers: list[int]
) -> CurriculumVisualPayload:
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
    explanation = (
        f"Visual này giúp con nhận biết {shape_name.lower()} thông qua đặc điểm và vật quen thuộc."
    )
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
    parts = (
        ["Tam giác", "Hình vuông"]
        if "tam giac" in normalized and "vuong" in normalized
        else ["Hình vuông", "Hình vuông", "Tam giác"]
    )
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


def _build_meas_01_payload(
    visual_type: str, normalized: str, numbers: list[int]
) -> CurriculumVisualPayload:
    if visual_type == "clock_calendar":
        if any(token in normalized for token in ("thu", "ngay", "tuan", "lich")):
            weekday = _parse_weekday(normalized)
            explanation = (
                f"Visual lịch giúp con nhận ra thứ trong tuần. Ở đây đang là {weekday.lower()}."
            )
            life_example = (
                f"Con có thể dùng lịch để tìm ngày hôm nay và ngày hôm sau của {weekday.lower()}."
            )
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
            life_example = (
                f"Khi kim ngắn chỉ {hour} và kim dài chỉ số 12, ta đọc là {hour} giờ đúng."
            )
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
    if a > b:
        correct = longer_label
    elif a < b:
        correct = shorter_label
    else:
        correct = "Bằng nhau"
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


def _build_meas_02_payload(
    visual_type: str, normalized: str, numbers: list[int]
) -> CurriculumVisualPayload:
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
    explanation = (
        f"Con đang thực hành đo độ dài {object_name.lower()} bằng thước. Kết quả là {length} cm."
    )
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
    plan = resolve_visualization_plan(
        curriculum_topic_id=curriculum_topic_id,
        normalized_message=normalized,
        requested_template=requested_visual,
        allowed_templates=allowed,
    )
    if plan is not None and plan.template in allowed:
        return plan.template

    if requested_visual in allowed:
        return requested_visual

    return DEFAULT_VISUAL_BY_CURRICULUM_TOPIC[curriculum_topic_id]


def _get_visualization_plan(
    curriculum_topic_id: str,
    message: str,
    requested_visual: str | None,
) -> VisualizationPlan | None:
    normalized = _normalize(message)
    return resolve_visualization_plan(
        curriculum_topic_id=curriculum_topic_id,
        normalized_message=normalized,
        requested_template=requested_visual,
        allowed_templates=ALLOWED_VISUALS_BY_CURRICULUM_TOPIC[curriculum_topic_id],
    )


def _normalize(text: str) -> str:
    text = text.replace("\u0111", "d").replace("\u0110", "d")
    nfkd = unicodedata.normalize("NFKD", text.lower())
    stripped = "".join(ch for ch in nfkd if unicodedata.category(ch) != "Mn")
    stripped = stripped.replace("đ", "d")
    return stripped.replace("đ", "d")


def _normalize_legacy_v0(text: str) -> str:
    lowered = text.lower().replace("đ", "d").replace("Đ", "d")
    nfkd = unicodedata.normalize("NFKD", lowered)
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
