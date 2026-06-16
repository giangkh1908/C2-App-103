#!/usr/bin/env python3
import json
from pathlib import Path


OUTPUT_PATH = Path(__file__).resolve().parents[1] / "data" / "practice" / "vi_grade_school_math_mcq_seed.json"


def option_block(correct_value: str, distractors: list[str], correct_letter: str) -> list[str]:
    choice_map = {
        "A": [correct_value, *distractors[:3]],
        "B": [distractors[0], correct_value, *distractors[1:3]],
        "C": [distractors[:2][0], distractors[:2][1], correct_value, distractors[2]],
        "D": [*distractors[:3], correct_value],
    }
    values = choice_map[correct_letter]
    return [f"{letter}. {value}" for letter, value in zip(["A", "B", "C", "D"], values)]


def mcq(question: str, correct_value: str, distractors: list[str], correct_letter: str, explanation: str) -> dict:
    return {
        "question": question,
        "choices": option_block(correct_value, distractors, correct_letter),
        "explanation": f"Đáp án đúng là: {correct_letter}. {explanation}",
    }


GRADE_TOPICS = {
    1: [
        "Đếm và nhận biết số",
        "Cộng trong phạm vi 10",
        "Trừ trong phạm vi 10",
        "So sánh số",
        "Hình cơ bản",
        "Độ dài cm",
        "Xem giờ tròn",
        "Tách gộp số",
        "Bài toán lời văn",
        "Ôn tập cuối tuần",
    ],
    2: [
        "Các số đến 100",
        "Cộng có nhớ",
        "Trừ có nhớ",
        "Bảng nhân 2 và 5",
        "Phép chia đơn giản",
        "Độ dài và mét",
        "Khối lượng và lít",
        "Tiền Việt Nam",
        "Xem giờ và phút",
        "Bài toán có lời văn",
    ],
    3: [
        "Nhân chia trong bảng",
        "Cộng trừ số có ba chữ số",
        "Chu vi hình đơn giản",
        "Phân số cơ bản",
        "Đơn vị đo độ dài",
        "Khối lượng và thể tích",
        "Tiền và mua bán",
        "Thời gian và lịch",
        "Bài toán chia đều",
        "Ôn tập tổng hợp",
    ],
    4: [
        "Số tự nhiên lớn",
        "Cộng trừ hàng nghìn",
        "Nhân với số có một chữ số",
        "Chia cho số có một chữ số",
        "Phân số và rút gọn",
        "Diện tích hình chữ nhật",
        "Đơn vị đo diện tích",
        "Thời gian và tuổi",
        "Bài toán trung bình",
        "Ôn tập tổng hợp lớp 4",
    ],
    5: [
        "Số thập phân cơ bản",
        "Cộng trừ số thập phân",
        "Nhân số thập phân",
        "Chia số thập phân",
        "Tỉ số phần trăm",
        "Tỉ lệ bản đồ",
        "Thể tích hình hộp chữ nhật",
        "Chu vi và diện tích",
        "Bài toán chuyển động",
        "Ôn tập tổng hợp lớp 5",
    ],
}


def generate_grade_1_exam(index: int) -> list[dict]:
    a = index + 1
    b = index + 2
    total = a + b
    remain = total - a
    return [
        mcq(
            f"Câu 1: Có {a} quả táo, thêm {b} quả nữa. Có tất cả bao nhiêu quả táo?",
            str(total),
            [str(total - 1), str(total + 1), str(total + 2)],
            "B",
            f"{a} cộng {b} bằng {total} nên có tất cả {total} quả táo.",
        ),
        mcq(
            f"Câu 2: Số nào đứng ngay sau số {total}?",
            str(total + 1),
            [str(total - 1), str(total), str(total + 2)],
            "C",
            f"Đếm tiếp sau {total} là {total + 1}.",
        ),
        mcq(
            f"Câu 3: Có {total} viên bi, cho bạn {a} viên. Còn lại bao nhiêu viên bi?",
            str(remain),
            [str(remain - 1), str(remain + 1), str(remain + 2)],
            "A",
            f"{total} bớt {a} còn {remain} viên bi.",
        ),
    ]


def generate_grade_2_exam(index: int) -> list[dict]:
    a = 20 + index * 3
    b = 10 + index
    total = a + b
    diff = total - b
    groups = index + 2
    items = 2
    product = groups * items
    return [
        mcq(
            f"Câu 1: {a} + {b} bằng bao nhiêu?",
            str(total),
            [str(total - 10), str(total + 10), str(total - 1)],
            "B",
            f"{a} cộng {b} bằng {total}.",
        ),
        mcq(
            f"Câu 2: {total} - {b} bằng bao nhiêu?",
            str(diff),
            [str(diff - 1), str(diff + 1), str(diff + 10)],
            "C",
            f"{total} trừ {b} bằng {diff}.",
        ),
        mcq(
            f"Câu 3: Có {groups} nhóm, mỗi nhóm có {items} bông hoa. Có tất cả bao nhiêu bông hoa?",
            str(product),
            [str(product - 2), str(product + 2), str(product + 4)],
            "A",
            f"{groups} nhân {items} bằng {product}.",
        ),
    ]


def generate_grade_3_exam(index: int) -> list[dict]:
    factor_1 = index + 3
    factor_2 = 4
    product = factor_1 * factor_2
    add_a = 120 + index * 10
    add_b = 23 + index
    perimeter_side = index + 4
    return [
        mcq(
            f"Câu 1: {factor_1} x {factor_2} bằng bao nhiêu?",
            str(product),
            [str(product - 4), str(product + 4), str(product + 8)],
            "D",
            f"{factor_1} nhân {factor_2} bằng {product}.",
        ),
        mcq(
            f"Câu 2: {add_a} + {add_b} bằng bao nhiêu?",
            str(add_a + add_b),
            [str(add_a + add_b - 10), str(add_a + add_b + 10), str(add_a + add_b - 1)],
            "A",
            f"{add_a} cộng {add_b} bằng {add_a + add_b}.",
        ),
        mcq(
            f"Câu 3: Hình vuông cạnh {perimeter_side} cm có chu vi là bao nhiêu?",
            f"{perimeter_side * 4} cm",
            [f"{perimeter_side * 2} cm", f"{perimeter_side * 3} cm", f"{perimeter_side * 5} cm"],
            "C",
            f"Chu vi hình vuông bằng {perimeter_side} nhân 4, được {perimeter_side * 4} cm.",
        ),
    ]


def generate_grade_4_exam(index: int) -> list[dict]:
    dividend = 420 + index * 24
    divisor = 3
    quotient = dividend // divisor
    length = index + 8
    width = index + 3
    numerator = index + 2
    denominator = numerator * 2
    return [
        mcq(
            f"Câu 1: {dividend} chia {divisor} bằng bao nhiêu?",
            str(quotient),
            [str(quotient - 10), str(quotient + 10), str(quotient + 20)],
            "B",
            f"{dividend} chia {divisor} bằng {quotient}.",
        ),
        mcq(
            f"Câu 2: Hình chữ nhật dài {length} cm, rộng {width} cm có diện tích là bao nhiêu?",
            f"{length * width} cm2",
            [f"{length + width} cm2", f"{(length + width) * 2} cm2", f"{length * width + width} cm2"],
            "A",
            f"Diện tích hình chữ nhật bằng {length} nhân {width}, được {length * width} cm2.",
        ),
        mcq(
            f"Câu 3: Phân số nào bằng 1/2?",
            f"{numerator}/{denominator}",
            [f"{numerator}/{denominator + 1}", f"{numerator + 1}/{denominator}", f"{numerator + 2}/{denominator + 2}"],
            "D",
            f"{numerator}/{denominator} rút gọn được 1/2.",
        ),
    ]


def generate_grade_5_exam(index: int) -> list[dict]:
    decimal_a = round(1.5 + index * 0.2, 1)
    decimal_b = round(0.4 + index * 0.1, 1)
    percent_base = 40 + index * 10
    percent_value = percent_base // 2
    speed = 6 + index
    time = 2
    return [
        mcq(
            f"Câu 1: {str(decimal_a).replace('.', ',')} + {str(decimal_b).replace('.', ',')} bằng bao nhiêu?",
            str(round(decimal_a + decimal_b, 1)).replace(".", ","),
            [
                str(round(decimal_a + decimal_b - 0.2, 1)).replace(".", ","),
                str(round(decimal_a + decimal_b + 0.2, 1)).replace(".", ","),
                str(round(decimal_a + decimal_b + 1, 1)).replace(".", ","),
            ],
            "C",
            f"{str(decimal_a).replace('.', ',')} cộng {str(decimal_b).replace('.', ',')} bằng {str(round(decimal_a + decimal_b, 1)).replace('.', ',')}.",
        ),
        mcq(
            f"Câu 2: 50% của {percent_base} là bao nhiêu?",
            str(percent_value),
            [str(percent_value - 5), str(percent_value + 5), str(percent_value + 10)],
            "A",
            f"50% là một nửa, một nửa của {percent_base} là {percent_value}.",
        ),
        mcq(
            f"Câu 3: Một bạn đi {speed} km mỗi giờ trong {time} giờ. Bạn đi được bao nhiêu ki-lô-mét?",
            str(speed * time),
            [str(speed + time), str(speed * time + 2), str(speed * time - 2)],
            "B",
            f"{speed} nhân {time} bằng {speed * time} km.",
        ),
    ]


GENERATORS = {
    1: generate_grade_1_exam,
    2: generate_grade_2_exam,
    3: generate_grade_3_exam,
    4: generate_grade_4_exam,
    5: generate_grade_5_exam,
}


def build_rows() -> list[dict]:
    rows: list[dict] = []
    for grade, topics in GRADE_TOPICS.items():
        for index, topic in enumerate(topics, start=1):
            rows.append(
                {
                    "grade": str(grade),
                    "id": f"g{grade}_exam_{index:02d}",
                    "title": f"Luyện tập Toán lớp {grade} - {topic}",
                    "url": f"https://example.local/practice/g{grade}_exam_{index:02d}",
                    "problems": GENERATORS[grade](index),
                }
            )
    return rows


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as file:
        json.dump(build_rows(), file, ensure_ascii=False, indent=2)
        file.write("\n")
    print({"output_path": str(OUTPUT_PATH).encode("ascii", "ignore").decode("ascii"), "exam_count": 50})


if __name__ == "__main__":
    main()
