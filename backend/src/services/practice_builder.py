from src.models.chat import PracticeQuestion, Topic
from src.models.lesson import LessonPracticeQuestion


def build_practice_questions(
    topic: Topic,
    tool_data: dict,
) -> tuple[LessonPracticeQuestion, PracticeQuestion]:
    if topic == "multiplication":
        question = (
            f"Neu co {tool_data['groups']} nhom, moi nhom co "
            f"{tool_data['items_per_group']} vat thi co tat ca bao nhieu vat?"
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
                success_message="Dung roi. Day la cach cong nhieu nhom bang nhau that gon.",
                fail_message="Con thu cong lap lai so vat moi nhom de tim tong nhe.",
                hint="So nhom nhan voi so vat moi nhom.",
            ),
        )

    if topic == "division":
        question = (
            f"Neu co {tool_data['total_items']} vat chia deu cho {tool_data['groups']} "
            "ban thi moi ban duoc may vat?"
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
                success_message="Dung roi. Chia deu se cho moi nhom so luong bang nhau.",
                fail_message="Con thu chia tong so vat thanh cac nhom bang nhau nhe.",
                hint="Tong so vat chia cho so nhom.",
            ),
        )

    if topic == "fraction_basic":
        question = (
            f"Lay {tool_data['numerator']} phan trong tong {tool_data['denominator']} "
            "phan bang nhau thi duoc phan so nao?"
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
                success_message="Dung roi. Tu so la so phan da lay, mau so la tong so phan.",
                fail_message="Con nhin lai pizza de xem da lay may phan trong tong may phan nhe.",
                hint="Tu so o tren, mau so o duoi.",
            ),
        )

    question = (
        f"Hinh chu nhat dai {tool_data['length']} o, rong {tool_data['width']} o "
        "co dien tich bao nhieu?"
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
            success_message="Dung roi. Dien tich bang chieu dai nhan chieu rong.",
            fail_message="Con thu dem tong so o vuong ben trong hinh nhe.",
            hint="Dien tich = dai x rong.",
        ),
    )
