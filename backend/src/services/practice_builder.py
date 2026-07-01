from src.models.chat import PracticeQuestion, Topic
from src.models.lesson import LessonPracticeQuestion


def build_practice_questions(
    topic: Topic,
    tool_data: dict,
) -> tuple[LessonPracticeQuestion, PracticeQuestion]:
    if topic == "multiplication":
        question = (
            f"Nếu có {tool_data['groups']} nhóm, mỗi nhóm có "
            f"{tool_data['items_per_group']} vật thì có tất cả bao nhiêu vật?"
        )
        options = [
            str(tool_data["total"] - tool_data["items_per_group"]),
            str(tool_data["total"]),
            str(tool_data["total"] + tool_data["items_per_group"]),
            str(tool_data["groups"] + tool_data["items_per_group"]),
        ]
        return (
            LessonPracticeQuestion(
                question=question, options=options, correct_answer=str(tool_data["total"])
            ),
            PracticeQuestion(
                id=f"practice_mult_{tool_data['groups']}_{tool_data['items_per_group']}",
                question_text=question,
                options=options,
                correct_answer_index=1,
                success_message="Đúng rồi. Đây là cách cộng nhiều nhóm bằng nhau thật gọn.",
                fail_message="Con thử cộng lặp lại số vật mỗi nhóm để tìm tổng nhé.",
                hint="Số nhóm nhân với số vật mỗi nhóm.",
            ),
        )

    if topic == "division":
        question = (
            f"Nếu có {tool_data['total_items']} vật chia đều cho {tool_data['groups']} "
            "bạn thì mỗi bạn được mấy vật?"
        )
        options = [
            str(tool_data["items_per_group"]),
            str(tool_data["groups"]),
            str(tool_data["total_items"]),
            str(tool_data["remainder"]),
        ]
        return (
            LessonPracticeQuestion(
                question=question, options=options, correct_answer=str(tool_data["items_per_group"])
            ),
            PracticeQuestion(
                id=f"practice_div_{tool_data['total_items']}_{tool_data['groups']}",
                question_text=question,
                options=options,
                correct_answer_index=0,
                success_message="Đúng rồi. Chia đều sẽ cho mỗi nhóm số lượng bằng nhau.",
                fail_message="Con thử chia tổng số vật thành các nhóm bằng nhau nhé.",
                hint="Tổng số vật chia cho số nhóm.",
            ),
        )

    if topic == "fraction_basic":
        question = (
            f"Lấy {tool_data['numerator']} phần trong tổng {tool_data['denominator']} "
            "phần bằng nhau thì được phân số nào?"
        )
        options = [
            tool_data["fraction_text"],
            f"{tool_data['denominator']}/{tool_data['numerator']}",
            f"{tool_data['numerator']}/{tool_data['numerator']}",
            f"1/{tool_data['denominator']}",
        ]
        return (
            LessonPracticeQuestion(
                question=question, options=options, correct_answer=tool_data["fraction_text"]
            ),
            PracticeQuestion(
                id=f"practice_frac_{tool_data['numerator']}_{tool_data['denominator']}",
                question_text=question,
                options=options,
                correct_answer_index=0,
                success_message="Đúng rồi. Tử số là số phần đã lấy, mẫu số là tổng số phần.",
                fail_message="Con nhìn lại pizza để xem đã lấy mấy phần trong tổng mấy phần nhé.",
                hint="Tử số ở trên, mẫu số ở dưới.",
            ),
        )

    if topic == "data_representation":
        labels = tool_data.get("labels") or ["Tổ 1", "Tổ 2", "Tổ 3"]
        values = tool_data.get("values") or [6, 9, 7]
        max_value = max(values)
        max_index = values.index(max_value)
        question = "Cột nào cao nhất trong biểu đồ?"
        options = labels
        return (
            LessonPracticeQuestion(
                question=question, options=options, correct_answer=labels[max_index]
            ),
            PracticeQuestion(
                id="practice_bar_chart_compare",
                question_text=question,
                options=options,
                correct_answer_index=max_index,
                success_message="Đúng rồi. Cột cao nhất là nhóm có số lượng lớn nhất.",
                fail_message="Con hãy tìm cột cao nhất trong biểu đồ nhé.",
                hint="Cột cao nhất biểu diễn giá trị lớn nhất.",
            ),
        )

    if topic == "addition_subtraction":
        operation = tool_data["operation"]
        operand_a = tool_data["operand_a"]
        operand_b = tool_data["operand_b"]
        result = tool_data["result"]
        question = f"{operand_a} {operation} {operand_b} bằng bao nhiêu?"
        options = [
            str(result),
            str(operand_a + operand_b + 1),
            str(abs(operand_a - operand_b)),
            str(operand_a),
        ]
        return (
            LessonPracticeQuestion(question=question, options=options, correct_answer=str(result)),
            PracticeQuestion(
                id=f"practice_addsub_{operand_a}_{operation}_{operand_b}",
                question_text=question,
                options=options,
                correct_answer_index=0,
                success_message="Đúng rồi. Con đã tính đúng kết quả.",
                fail_message="Con thử đếm lại từng bước trên hình nhé.",
                hint="Nếu thêm vào thì cộng, nếu bớt đi thì trừ.",
            ),
        )

    if topic == "comparison_numbers":
        number_a = tool_data["number_a"]
        number_b = tool_data["number_b"]
        larger = tool_data.get("larger", max(number_a, number_b))
        question = f"Số nào lớn hơn giữa {number_a} và {number_b}?"
        options = [str(number_a), str(number_b), str(abs(number_a - number_b)), "Bằng nhau"]
        correct_answer = str(larger) if number_a != number_b else "Bằng nhau"
        return (
            LessonPracticeQuestion(
                question=question, options=options, correct_answer=correct_answer
            ),
            PracticeQuestion(
                id=f"practice_compare_{number_a}_{number_b}",
                question_text=question,
                options=options,
                correct_answer_index=options.index(correct_answer),
                success_message="Đúng rồi. Con đã so sánh đúng hai số.",
                fail_message="Con thử so sánh lại theo tia số nhé.",
                hint="Số nào ở bên phải hơn trên tia số thì lớn hơn.",
            ),
        )

    if topic == "time_clock":
        hour = tool_data["hour"]
        time_label = tool_data.get("time_label") or f"{hour} giờ"
        question = "Đồng hồ đang chỉ mấy giờ?"
        options = [time_label, f"{hour % 12 + 1} giờ", f"{max(hour - 1, 1)} giờ", "12 giờ"]
        return (
            LessonPracticeQuestion(
                question=question, options=options, correct_answer=time_label
            ),
            PracticeQuestion(
                id=f"practice_clock_{hour}_{tool_data.get('minute', 0)}",
                question_text=question,
                options=options,
                correct_answer_index=0,
                success_message="Đúng rồi. Con đọc giờ rất tốt.",
                fail_message="Con xem lại kim ngắn và kim dài nhé.",
                hint="Kim ngắn chỉ giờ, kim dài chỉ phút.",
            ),
        )

    if topic == "measurement_length":
        length_a = tool_data["length_a"]
        length_b = tool_data["length_b"]
        unit = tool_data.get("unit") or "cm"
        object_a = tool_data.get("object_a") or "cây bút"
        object_b = tool_data.get("object_b") or "cây thước"
        longer_object = tool_data.get("longer_object") or (
            object_a if length_a >= length_b else object_b
        )
        question = f"{object_a} dài {length_a}{unit}, {object_b} dài {length_b}{unit}. Vật nào dài hơn?"
        options = [object_a, object_b, "Bằng nhau", "Không biết"]
        correct_answer = longer_object if length_a != length_b else "Bằng nhau"
        return (
            LessonPracticeQuestion(
                question=question, options=options, correct_answer=correct_answer
            ),
            PracticeQuestion(
                id=f"practice_length_{length_a}_{length_b}",
                question_text=question,
                options=options,
                correct_answer_index=options.index(correct_answer),
                success_message="Đúng rồi. Con đã so sánh đúng độ dài.",
                fail_message="Con nhìn lại vật nào dài hơn nhé.",
                hint="Vật nào có số đo lớn hơn thì dài hơn.",
            ),
        )

    question = (
        f"Hình chữ nhật dài {tool_data['length']} ô, rộng {tool_data['width']} ô "
        "có diện tích bao nhiêu?"
    )
    options = [
        str(tool_data["length"] + tool_data["width"]),
        str(tool_data["perimeter"]),
        str(tool_data["area"]),
        str(tool_data["width"]),
    ]
    return (
        LessonPracticeQuestion(
            question=question, options=options, correct_answer=str(tool_data["area"])
        ),
        PracticeQuestion(
            id=f"practice_rect_{tool_data['length']}_{tool_data['width']}",
            question_text=question,
            options=options,
            correct_answer_index=2,
            success_message="Đúng rồi. Diện tích bằng chiều dài nhân chiều rộng.",
            fail_message="Con thử đếm tổng số ô vuông bên trong hình nhé.",
            hint="Diện tích = dài x rộng.",
        ),
    )
