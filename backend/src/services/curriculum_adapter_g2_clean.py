from __future__ import annotations

from src.models.chat import PracticeQuestion
from src.models.lesson import LessonPracticeQuestion
from src.services.curriculum_adapter import (
    PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC,
    CurriculumVisualPayload,
)


def build_g2_payload(
    curriculum_topic_id: str,
    visual_type: str,
    normalized: str,
    numbers: list[int],
) -> CurriculumVisualPayload:
    if curriculum_topic_id == "G2-NUM-01":
        return _build_num_01(visual_type, numbers)
    if curriculum_topic_id == "G2-NUM-02":
        return _build_num_02(visual_type, numbers)
    if curriculum_topic_id == "G2-NUM-03":
        return _build_num_03(visual_type, numbers)
    if curriculum_topic_id == "G2-OPS-01":
        return _build_ops_01(visual_type, normalized, numbers)
    if curriculum_topic_id == "G2-OPS-02":
        return _build_ops_02(visual_type, normalized, numbers)
    if curriculum_topic_id == "G2-OPS-03":
        return _build_ops_03(visual_type, normalized, numbers)
    if curriculum_topic_id == "G2-WORD-01":
        return _build_word_01(visual_type, normalized, numbers)
    if curriculum_topic_id == "G2-GEO-01":
        return _build_geo_01(visual_type, normalized)
    if curriculum_topic_id == "G2-GEO-02":
        return _build_geo_02(visual_type, numbers)
    if curriculum_topic_id == "G2-MEAS-01":
        return _build_meas_01(visual_type, normalized, numbers)
    if curriculum_topic_id == "G2-MEAS-02":
        return _build_meas_02(visual_type, normalized, numbers)
    if curriculum_topic_id == "G2-STAT-01":
        return _build_stat_01(visual_type, numbers)
    if curriculum_topic_id == "G2-PROB-01":
        return _build_prob_01(visual_type)
    raise KeyError(f"Unsupported grade 2 curriculum topic: {curriculum_topic_id}")


def pick_g2_visual(
    curriculum_topic_id: str,
    normalized: str,
    numbers: list[int],
) -> str | None:
    if curriculum_topic_id == "G2-NUM-01":
        if "tia so" in normalized:
            return "number_line"
        if numbers and numbers[0] <= 40:
            return "counting_objects"
        return None
    if curriculum_topic_id == "G2-NUM-02":
        if any(token in normalized for token in ("tia so", "sap xep", "tang dan", "giam dan")):
            return "number_line"
        if any(token in normalized for token in ("tram", "chuc", "don vi")):
            return "place_value_blocks"
        return None
    if curriculum_topic_id == "G2-NUM-03":
        if any(token in normalized for token in ("uoc tinh", "bao nhieu")):
            return "counting_objects"
        return None
    if curriculum_topic_id == "G2-OPS-01":
        if any(token in normalized for token in ("tia so", "nham")):
            return "number_line"
        if any(token in normalized for token in ("bai toan", "loi van")):
            return "operation_story"
        return None
    if curriculum_topic_id == "G2-OPS-02":
        if "chia" in normalized:
            return "grouping_model"
        if any(token in normalized for token in ("mang", "hang", "cot", "o vuong")):
            return "array_model"
        if any(token in normalized for token in ("dem", "do vat")):
            return "counting_objects"
        return None
    if curriculum_topic_id == "G2-OPS-03":
        if "tia so" in normalized:
            return "number_line"
        if any(token in normalized for token in ("tram", "chuc")) or (
            numbers and max(numbers) >= 20
        ):
            return "place_value_blocks"
        return None
    if curriculum_topic_id == "G2-WORD-01":
        if any(token in normalized for token in ("so do", "tom tat", "bar")):
            return "bar_model"
        return None
    if curriculum_topic_id == "G2-GEO-01":
        if any(token in normalized for token in ("do vat", "khoi tru", "khoi cau")):
            return "real_object_match"
        if any(token in normalized for token in ("phan loai", "sap xep")):
            return "shape_sorting"
        return None
    if curriculum_topic_id == "G2-GEO-02":
        if any(token in normalized for token in ("cm", "doan thang", "thuoc")):
            return "ruler_measurement"
        if "keo tha" in normalized:
            return "drag_drop_shapes"
        return None
    if curriculum_topic_id == "G2-MEAS-01":
        if "tien" in normalized:
            return "money_visual"
        if any(token in normalized for token in ("kg", "lit", "khoi luong", "dung tich")):
            return "mass_capacity_visual"
        if any(token in normalized for token in ("gio", "phut", "ngay", "thang", "lich")):
            return "clock_calendar"
        return None
    if curriculum_topic_id == "G2-MEAS-02":
        if any(token in normalized for token in ("gap khuc", "doan")):
            return "polyline_length_visual"
        if any(token in normalized for token in ("gio", "phut", "kim")):
            return "clock_calendar"
        if any(token in normalized for token in ("cm", "thuoc", "do dai")):
            return "ruler_measurement"
        return None
    if curriculum_topic_id == "G2-STAT-01":
        if any(token in normalized for token in ("bang", "so lieu")):
            return "data_table"
        if any(token in normalized for token in ("tranh", "bieu do")):
            return "picture_graph"
        return None
    if curriculum_topic_id == "G2-PROB-01":
        if any(token in normalized for token in ("co the", "chac chan", "khong the")):
            return "scenario_cards"
        return None
    return None


def _build_num_01(visual_type: str, numbers: list[int]) -> CurriculumVisualPayload:
    number = numbers[0] if numbers else 234
    hundreds = number // 100
    tens = (number % 100) // 10
    ones = number % 10
    return _payload(
        topic="G2-NUM-01",
        visual_type=visual_type,
        title=f"Cấu tạo số {number}",
        explanation=f"Số {number} gồm {hundreds} trăm, {tens} chục và {ones} đơn vị.",
        life_example=f"Con có thể tách số {number} thành các khối trăm, chục và đơn vị để nhìn rõ hơn.",
        primary_count=hundreds,
        secondary_count=tens,
        total_count=float(number),
        groups_label="Trăm",
        items_label="Chục",
        config={"number": number, "hundreds": hundreds, "tens": tens, "ones": ones},
        question=f"Số {number} có bao nhiêu trăm?",
        options=[str(max(hundreds - 1, 0)), str(hundreds), str(tens), str(ones)],
        answer=str(hundreds),
        practice_id="g2-num-01-practice",
        success_message="Đúng rồi, con đã nhận ra hàng trăm.",
        fail_message="Con thử nhìn lại khối trăm trong hình nhé.",
        hint="Mỗi khối trăm bằng 100 đơn vị.",
    )


def _build_num_02(visual_type: str, numbers: list[int]) -> CurriculumVisualPayload:
    a = numbers[0] if len(numbers) > 0 else 342
    b = numbers[1] if len(numbers) > 1 else 324
    symbol = ">" if a > b else "<" if a < b else "="
    answer = str(max(a, b)) if a != b else "Bằng nhau"
    return _payload(
        topic="G2-NUM-02",
        visual_type=visual_type,
        title=f"So sánh {a} và {b}",
        explanation=f"Khi so sánh {a} và {b}, con thấy ngay {a} {symbol} {b}.",
        life_example="Con có thể so từng hàng trăm, chục, đơn vị để biết số nào lớn hơn.",
        primary_count=a,
        secondary_count=b,
        total_count=float(max(a, b)),
        groups_label="Số",
        items_label="Giá trị",
        config={"a_label": str(a), "b_label": str(b), "compare_operator": symbol},
        question=f"Số nào lớn hơn giữa {a} và {b}?",
        options=[str(a), str(b), str(abs(a - b)), "Bằng nhau"],
        answer=answer,
        practice_id="g2-num-02-practice",
        success_message="Chính xác, con đã chọn đúng số lớn hơn.",
        fail_message="Con thử so lại từ hàng trăm rồi đến hàng chục nhé.",
        hint="Hàng lớn hơn quyết định số lớn hơn.",
    )


def _build_num_03(visual_type: str, numbers: list[int]) -> CurriculumVisualPayload:
    total_items = numbers[0] if numbers else 47
    tens_groups = total_items // 10
    remainder = total_items % 10
    rounded = tens_groups * 10 if remainder < 5 else tens_groups * 10 + 10
    return _payload(
        topic="G2-NUM-03",
        visual_type=visual_type,
        title=f"Ước lượng {total_items} đồ vật",
        explanation=f"Ta nhóm {total_items} đồ vật thành {tens_groups} nhóm chục và {remainder} đồ vật lẻ.",
        life_example=f"Khi nhìn nhanh, con có thể ước lượng gần {rounded} đồ vật.",
        primary_count=max(tens_groups, 1),
        secondary_count=10,
        total_count=float(total_items),
        groups_label="Nhóm",
        items_label="Mỗi nhóm",
        config={"group_size": 10, "estimated_total": rounded, "object_name": "đồ vật"},
        question=f"{total_items} đồ vật gần với số nào nhất?",
        options=[
            str(max(rounded - 10, 0)),
            str(tens_groups * 10),
            str(tens_groups * 10 + 10),
            str(total_items + 10),
        ],
        answer=str(rounded),
        practice_id="g2-num-03-practice",
        success_message="Đúng rồi, con đã ước lượng hợp lý.",
        fail_message="Con thử nhóm theo từng chục rồi chọn số gần nhất nhé.",
        hint="Hãy nhìn xem còn dư ít hay nhiều so với một nhóm 10.",
    )


def _build_ops_01(
    visual_type: str,
    normalized: str,
    numbers: list[int],
) -> CurriculumVisualPayload:
    a = numbers[0] if len(numbers) > 0 else 245
    b = numbers[1] if len(numbers) > 1 else 132
    subtraction = any(token in normalized for token in ("tru", "muon", "bot"))
    operation = "-" if subtraction else "+"
    result = a - b if subtraction else a + b
    return _payload(
        topic="G2-OPS-01",
        visual_type=visual_type,
        title=f"Tính {a} {operation} {b}",
        explanation=f"Ta minh họa phép tính {a} {operation} {b} để con nhìn rõ cách đổi ở hàng trăm, chục, đơn vị.",
        life_example=f"Kết quả của phép tính là {result}.",
        primary_count=a,
        secondary_count=b,
        total_count=float(result),
        groups_label="Số ban đầu",
        items_label="Số thay đổi",
        config={
            "operation": operation,
            "before": a,
            "change": b,
            "result": result,
            "story_context": "khối tính",
            "number": result,
            "hundreds": result // 100,
            "tens": (result % 100) // 10,
            "ones": result % 10,
        },
        question=f"{a} {operation} {b} bằng bao nhiêu?",
        options=[str(result), str(a), str(b), str(result + 10)],
        answer=str(result),
        practice_id="g2-ops-01-practice",
        success_message="Đúng rồi, con đã tìm đúng kết quả.",
        fail_message="Con xem lại từng hàng trăm, chục và đơn vị nhé.",
        hint="Nếu thêm vào thì cộng, nếu bớt đi thì trừ.",
    )


def _build_ops_02(
    visual_type: str,
    normalized: str,
    numbers: list[int],
) -> CurriculumVisualPayload:
    a = numbers[0] if len(numbers) > 0 else 3
    b = numbers[1] if len(numbers) > 1 else 5
    division = "chia" in normalized

    if division:
        total_items = a
        groups = max(b, 1)
        items = total_items // groups
        explanation = (
            f"Ta chia đều {total_items} đồ vật cho {groups} nhóm, mỗi nhóm có {items} đồ vật."
        )
        config = {
            "operation": "÷",
            "before": total_items,
            "change": groups,
            "result": items,
            "story_context": "kẹo",
        }
        question = f"Mỗi nhóm có bao nhiêu đồ vật khi chia {total_items} cho {groups}?"
        answer = str(items)
        primary_count = groups
        secondary_count = items
        total_count = float(total_items)
    else:
        groups = a
        items = b
        total_items = groups * items
        explanation = f"Ta có {groups} nhóm, mỗi nhóm {items} đồ vật nên tất cả là {total_items}."
        config = {
            "rows": groups,
            "cols": items,
            "operation": "×",
            "before": groups,
            "change": items,
            "result": total_items,
            "story_context": "kẹo",
        }
        question = f"{groups} × {items} bằng bao nhiêu?"
        answer = str(total_items)
        primary_count = groups
        secondary_count = items
        total_count = float(total_items)

    return _payload(
        topic="G2-OPS-02",
        visual_type=visual_type,
        title="Phép nhân và phép chia bảng 2, 5",
        explanation=explanation,
        life_example="Nhìn thành từng hàng hoặc từng nhóm giúp con hiểu bảng nhân, bảng chia dễ hơn.",
        primary_count=primary_count,
        secondary_count=secondary_count,
        total_count=total_count,
        groups_label="Nhóm",
        items_label="Đồ vật",
        config=config,
        question=question,
        options=[answer, str(primary_count), str(secondary_count), str(int(total_count) + 1)],
        answer=answer,
        practice_id="g2-ops-02-practice",
        success_message="Con làm đúng rồi.",
        fail_message="Con thử đếm theo từng nhóm hoặc từng hàng nhé.",
        hint="Đếm theo nhóm bằng nhau sẽ dễ hơn.",
    )


def _build_ops_03(
    visual_type: str,
    normalized: str,
    numbers: list[int],
) -> CurriculumVisualPayload:
    a = numbers[0] if len(numbers) > 0 else 70
    b = numbers[1] if len(numbers) > 1 else 80
    subtraction = any(token in normalized for token in ("tru", "bot"))
    operation = "-" if subtraction else "+"
    result = a - b if subtraction else a + b
    return _payload(
        topic="G2-OPS-03",
        visual_type=visual_type,
        title=f"Tính nhẩm {a} {operation} {b}",
        explanation=f"Con có thể tính nhẩm {a} {operation} {b} bằng tia số hoặc khung 10, được {result}.",
        life_example="Nhẩm nhanh giúp con nhìn ra số thay đổi mà không cần viết dài.",
        primary_count=a,
        secondary_count=b,
        total_count=float(result),
        groups_label="Số",
        items_label="Kết quả",
        config={"operation": operation, "before": a, "change": b, "result": result},
        question=f"{a} {operation} {b} bằng bao nhiêu?",
        options=[str(result), str(result + 10), str(a), str(b)],
        answer=str(result),
        practice_id="g2-ops-03-practice",
        success_message="Đúng rồi, con nhẩm rất nhanh.",
        fail_message="Con thử nhảy từng bước trên tia số nhé.",
        hint="Hãy nhìn xem số tăng hay giảm bao nhiêu.",
    )


def _build_word_01(
    visual_type: str,
    normalized: str,
    numbers: list[int],
) -> CurriculumVisualPayload:
    start = numbers[0] if len(numbers) > 0 else 12
    change = numbers[1] if len(numbers) > 1 else 8
    subtraction = any(token in normalized for token in ("con lai", "it hon", "tru", "bot"))
    operation = "-" if subtraction else "+"
    result = start - change if subtraction else start + change
    return _payload(
        topic="G2-WORD-01",
        visual_type=visual_type,
        title="Bài toán một bước tính",
        explanation=f"Ta đổi bài toán thành phép tính {start} {operation} {change} để tìm kết quả {result}.",
        life_example=f"Con có thể tóm tắt bài toán rồi tính ra {result}.",
        primary_count=start,
        secondary_count=change,
        total_count=float(result),
        groups_label="Đoạn",
        items_label="Quyển",
        config={
            "operation": operation,
            "before": start,
            "change": change,
            "result": result,
            "story_context": "quyển sách",
            "top_label": "Ban đầu",
            "bottom_label": "Kết quả",
            "unit_label": "quyển",
        },
        question="Kết quả của bài toán là bao nhiêu?",
        options=[str(result), str(start), str(change), str(result + 1)],
        answer=str(result),
        practice_id="g2-word-01-practice",
        success_message="Đúng rồi, con đã giải được bài toán.",
        fail_message="Con thử xác định xem bài toán đang thêm hay bớt nhé.",
        hint="Đọc kỹ từ khóa như tất cả, còn lại, nhiều hơn, ít hơn.",
    )


def _build_geo_01(visual_type: str, normalized: str) -> CurriculumVisualPayload:
    shape_name = (
        "Hình tam giác"
        if "tam giac" in normalized
        else "Hình chữ nhật"
        if "chu nhat" in normalized
        else "Hình tròn"
        if "tron" in normalized
        else "Hình vuông"
    )
    options = ["Hình tròn", "Hình vuông", "Hình tam giác", "Hình chữ nhật"]
    shape_id = options.index(shape_name) + 1
    return _payload(
        topic="G2-GEO-01",
        visual_type=visual_type,
        title=f"Nhận biết {shape_name.lower()}",
        explanation=f"Visual giúp con nhận biết {shape_name.lower()} qua đặc điểm và ví dụ quen thuộc.",
        life_example=f"Con hãy tìm {shape_name.lower()} trong các đồ vật xung quanh.",
        primary_count=shape_id,
        secondary_count=0,
        total_count=float(shape_id),
        groups_label="Hình",
        items_label="Đặc điểm",
        config={"shape_name": shape_name},
        question="Con đang học hình nào?",
        options=options,
        answer=shape_name,
        practice_id="g2-geo-01-practice",
        success_message="Đúng rồi, con gọi đúng tên hình.",
        fail_message="Con thử nhìn lại số cạnh hoặc đường cong nhé.",
        hint="Mỗi hình có đặc điểm riêng về cạnh và góc.",
    )


def _build_geo_02(visual_type: str, numbers: list[int]) -> CurriculumVisualPayload:
    if visual_type == "ruler_measurement":
        length = numbers[0] if numbers else 6
        return _payload(
            topic="G2-GEO-02",
            visual_type=visual_type,
            title=f"Vẽ đoạn thẳng {length} cm",
            explanation=f"Con dùng thước để vẽ và đọc đoạn thẳng dài {length} cm.",
            life_example="Đặt đầu đoạn thẳng ở vạch 0 rồi đọc đúng vạch cuối.",
            primary_count=length,
            secondary_count=0,
            total_count=float(length),
            groups_label="Độ dài",
            items_label="cm",
            config={"object_name": "Đoạn thẳng", "length_cm": length},
            question="Đoạn thẳng dài bao nhiêu cm?",
            options=[str(length - 1), str(length), str(length + 1), "10"],
            answer=str(length),
            practice_id="g2-geo-02-practice-ruler",
            success_message="Đúng rồi, con đã đọc đúng độ dài.",
            fail_message="Con nhìn lại vạch cuối của đoạn thẳng nhé.",
            hint="Đọc số ở ngay điểm cuối của đoạn thẳng.",
        )

    parts = ["Hình vuông", "Hình vuông", "Hình tam giác"]
    return _payload(
        topic="G2-GEO-02",
        visual_type=visual_type,
        title="Ghép hình",
        explanation="Con ghép các hình nhỏ để tạo thành hình mới lớn hơn.",
        life_example="Mỗi mảnh ghép góp phần tạo nên hình hoàn chỉnh.",
        primary_count=len(parts),
        secondary_count=max(len(parts) - 1, 1),
        total_count=float(len(parts)),
        groups_label="Mảnh",
        items_label="Ghép",
        config={"target_shape": "Ngôi nhà", "parts": parts},
        question="Có bao nhiêu mảnh ghép trong hình?",
        options=[str(len(parts) - 1), str(len(parts)), str(len(parts) + 1), "8"],
        answer=str(len(parts)),
        practice_id="g2-geo-02-practice-compose",
        success_message="Đúng rồi, con đếm đúng số mảnh ghép.",
        fail_message="Con thử đếm lại từng mảnh một nhé.",
        hint="Mỗi mảnh là một hình nhỏ riêng biệt.",
    )


def _build_meas_01(
    visual_type: str,
    normalized: str,
    numbers: list[int],
) -> CurriculumVisualPayload:
    if visual_type == "money_visual" or "tien" in normalized:
        denominations = numbers if numbers else [1000, 2000, 5000]
        total = sum(denominations)
        return _payload(
            topic="G2-MEAS-01",
            visual_type="money_visual",
            title="Nhận biết tiền Việt Nam",
            explanation=f"Con nhìn các tờ tiền và tính được tổng cộng là {total} đồng.",
            life_example="Cộng giá trị từng tờ tiền giúp con biết tổng tiền đang có.",
            primary_count=len(denominations),
            secondary_count=0,
            total_count=float(total),
            groups_label="Tờ tiền",
            items_label="Đồng",
            config={"denominations": denominations, "total_value": total, "currency": "đồng"},
            question="Tổng các tờ tiền là bao nhiêu?",
            options=[str(total), str(total + 1000), str(denominations[0]), "500"],
            answer=str(total),
            practice_id="g2-meas-01-practice-money",
            success_message="Đúng rồi, con đã tính đúng số tiền.",
            fail_message="Con thử cộng từng tờ một nhé.",
            hint="Cộng giá trị trên từng tờ tiền.",
        )

    if visual_type == "mass_capacity_visual" or any(
        token in normalized for token in ("kg", "lit", "khoi luong", "dung tich")
    ):
        left = numbers[0] if len(numbers) > 0 else 3
        right = numbers[1] if len(numbers) > 1 else 5
        unit = "l" if "lit" in normalized else "kg"
        answer = str(max(left, right)) if left != right else "Bằng nhau"
        return _payload(
            topic="G2-MEAS-01",
            visual_type="mass_capacity_visual",
            title="So sánh khối lượng hoặc dung tích",
            explanation=f"Con so sánh {left}{unit} và {right}{unit} để biết vật nào nặng hơn hoặc chứa nhiều hơn.",
            life_example="Cân hoặc ca đong giúp con so sánh trực quan.",
            primary_count=left,
            secondary_count=right,
            total_count=float(max(left, right)),
            groups_label="So sánh",
            items_label="Đại lượng",
            config={
                "left_label": "Vật A",
                "right_label": "Vật B",
                "unit": unit,
                "left_value": left,
                "right_value": right,
            },
            question="Giá trị nào lớn hơn?",
            options=[str(left), str(right), "Bằng nhau", "0"],
            answer=answer,
            practice_id="g2-meas-01-practice-mass",
            success_message="Đúng rồi, con đã so sánh đúng.",
            fail_message="Con nhìn lại bên nào thấp hơn trên cân nhé.",
            hint="Bên thấp hơn thường nặng hơn.",
        )

    hour = numbers[0] if numbers else 8
    minute = numbers[1] if len(numbers) > 1 else 30
    return _payload(
        topic="G2-MEAS-01",
        visual_type="clock_calendar",
        title="Đọc giờ và phút",
        explanation=f"Đồng hồ đang chỉ {hour} giờ {minute} phút.",
        life_example="Con nhìn kim phút rồi kim giờ để đọc đúng thời gian.",
        primary_count=hour,
        secondary_count=minute,
        total_count=float(hour),
        groups_label="Thời gian",
        items_label="Đồng hồ",
        config={"mode": "clock", "hour": hour, "minute": minute},
        question="Đồng hồ chỉ mấy giờ mấy phút?",
        options=[f"{hour}:{minute:02d}", f"{hour + 1}:{minute:02d}", f"{hour}:00", "12:00"],
        answer=f"{hour}:{minute:02d}",
        practice_id="g2-meas-01-practice-clock",
        success_message="Đúng rồi, con đọc đúng giờ phút.",
        fail_message="Con xem lại kim phút trước rồi đến kim giờ nhé.",
        hint="Kim phút chỉ số nào thì đổi ra phút tương ứng.",
    )


def _build_meas_02(
    visual_type: str,
    normalized: str,
    numbers: list[int],
) -> CurriculumVisualPayload:
    if visual_type == "polyline_length_visual" or "gap khuc" in normalized:
        segments = numbers if len(numbers) >= 2 else [4, 3, 5]
        total = sum(segments)
        return _payload(
            topic="G2-MEAS-02",
            visual_type="polyline_length_visual",
            title="Độ dài đường gấp khúc",
            explanation=f"Đường gấp khúc có các đoạn {segments}, cộng lại được {total} cm.",
            life_example="Muốn tính độ dài đường gấp khúc, con cộng độ dài từng đoạn.",
            primary_count=len(segments),
            secondary_count=max(segments),
            total_count=float(total),
            groups_label="Số đoạn",
            items_label="Độ dài",
            config={"segments": segments},
            question="Độ dài cả đường gấp khúc là bao nhiêu?",
            options=[str(total), str(max(segments)), str(total + 1), str(total - 1)],
            answer=str(total),
            practice_id="g2-meas-02-practice-polyline",
            success_message="Đúng rồi, con đã cộng đúng các đoạn.",
            fail_message="Con cộng lại từng đoạn một nhé.",
            hint="Tổng độ dài bằng tổng của mọi đoạn nhỏ.",
        )

    if visual_type == "clock_calendar":
        hour = numbers[0] if numbers else 6
        minute = numbers[1] if len(numbers) > 1 else 30
        return _payload(
            topic="G2-MEAS-02",
            visual_type="clock_calendar",
            title="Đọc giờ theo kim phút",
            explanation=f"Kim phút chỉ {minute} phút và kim giờ gần số {hour}.",
            life_example="Con đọc kim phút trước, rồi mới đọc kim giờ.",
            primary_count=hour,
            secondary_count=minute,
            total_count=float(hour),
            groups_label="Thời gian",
            items_label="Đồng hồ",
            config={"mode": "clock", "hour": hour, "minute": minute},
            question="Đồng hồ chỉ mấy giờ mấy phút?",
            options=[f"{hour}:{minute:02d}", f"{hour}:00", f"{hour + 1}:00", "12:30"],
            answer=f"{hour}:{minute:02d}",
            practice_id="g2-meas-02-practice-clock",
            success_message="Chính xác, con đọc đúng giờ phút.",
            fail_message="Con nhìn lại kim phút trước nhé.",
            hint="Kim phút ở số 6 nghĩa là 30 phút.",
        )

    length = numbers[0] if numbers else 9
    return _payload(
        topic="G2-MEAS-02",
        visual_type="ruler_measurement",
        title="Thực hành đo độ dài",
        explanation=f"Con dùng thước để đo được {length} cm.",
        life_example="Đặt vật sát vạch 0 rồi đọc số ở đầu kia.",
        primary_count=length,
        secondary_count=0,
        total_count=float(length),
        groups_label="Độ dài",
        items_label="cm",
        config={"object_name": "Đoạn thẳng", "length_cm": length},
        question="Độ dài là bao nhiêu cm?",
        options=[str(length - 1), str(length), str(length + 1), "12"],
        answer=str(length),
        practice_id="g2-meas-02-practice-ruler",
        success_message="Đúng rồi, con đã đo đúng.",
        fail_message="Con nhìn lại vạch cuối của vật nhé.",
        hint="Vạch cuối là số cần đọc.",
    )


def _build_stat_01(visual_type: str, numbers: list[int]) -> CurriculumVisualPayload:
    values = numbers if len(numbers) >= 3 else [4, 6, 2]
    labels = ["Táo", "Cam", "Nho"][: len(values)]
    answer = labels[values.index(max(values))]
    return _payload(
        topic="G2-STAT-01",
        visual_type=visual_type,
        title="Biểu đồ tranh và bảng số liệu",
        explanation="Con nhìn biểu đồ hoặc bảng để biết nhóm nào nhiều hơn, ít hơn.",
        life_example="Mỗi biểu tượng có thể đại diện cho nhiều bạn hoặc nhiều đồ vật.",
        primary_count=len(values),
        secondary_count=max(values),
        total_count=float(sum(values)),
        groups_label="Nhóm",
        items_label="Số lượng",
        config={"labels": labels, "values": values, "unit_value": 2, "icon_emoji": "⭐"},
        question="Nhóm nào có số lượng lớn nhất?",
        options=labels,
        answer=answer,
        practice_id="g2-stat-01-practice",
        success_message="Đúng rồi, con đã đọc đúng dữ liệu.",
        fail_message="Con so sánh lại các cột hoặc số liệu nhé.",
        hint="Tìm nhóm có nhiều biểu tượng nhất hoặc số lớn nhất.",
    )


def _build_prob_01(visual_type: str) -> CurriculumVisualPayload:
    outcomes = ["Bóng đỏ", "Bóng đỏ", "Bóng đỏ", "Bóng xanh", "Bóng xanh"]
    return _payload(
        topic="G2-PROB-01",
        visual_type=visual_type,
        title="Khả năng xảy ra của sự kiện",
        explanation="Con đếm số kết quả thuận lợi và số kết quả có thể để biết khả năng xảy ra.",
        life_example="Nếu có nhiều bóng đỏ hơn, lấy bóng đỏ sẽ dễ xảy ra hơn.",
        primary_count=len(outcomes),
        secondary_count=3,
        total_count=float(len(outcomes)),
        groups_label="Kết quả thuận lợi",
        items_label="Kết quả",
        config={
            "outcomes": outcomes,
            "favorable_count": 3,
            "experiment_label": "Bóng đỏ dễ xuất hiện hơn",
        },
        question="Màu nào dễ lấy ra hơn?",
        options=["Bóng đỏ", "Bóng xanh", "Bằng nhau", "Không thể biết"],
        answer="Bóng đỏ",
        practice_id="g2-prob-01-practice",
        success_message="Đúng rồi, bóng đỏ có nhiều hơn nên dễ xuất hiện hơn.",
        fail_message="Con thử đếm lại từng màu nhé.",
        hint="Màu nào nhiều hơn thì dễ xuất hiện hơn.",
    )


def _payload(
    *,
    topic: str,
    visual_type: str,
    title: str,
    explanation: str,
    life_example: str,
    primary_count: int,
    secondary_count: int,
    total_count: float,
    groups_label: str,
    items_label: str,
    config: dict[str, object],
    question: str,
    options: list[str],
    answer: str,
    practice_id: str,
    success_message: str,
    fail_message: str,
    hint: str,
) -> CurriculumVisualPayload:
    return CurriculumVisualPayload(
        topic=topic,
        visual_type=visual_type,
        title=title,
        explanation=explanation,
        life_example=life_example,
        primary_count=primary_count,
        secondary_count=secondary_count,
        total_count=total_count,
        groups_label=groups_label,
        items_label=items_label,
        config=config,
        practice_question=LessonPracticeQuestion(
            question=question,
            options=options,
            correct_answer=answer,
        ),
        practice_chat=PracticeQuestion(
            id=practice_id,
            question_text=question,
            options=options,
            correct_answer_index=options.index(answer),
            success_message=success_message,
            fail_message=fail_message,
            hint=hint,
        ),
        follow_ups=PROMPT_EXAMPLES_BY_CURRICULUM_TOPIC[topic],
    )
