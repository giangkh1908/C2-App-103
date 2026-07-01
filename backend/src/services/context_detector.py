import re
import unicodedata

from src.models.chat import Intent, Topic
from src.services.types import LearningContext

DEFAULT_TOOL_ARGS: dict[Topic, dict[str, int | str]] = {
    "multiplication": {
        "groups": 3,
        "items_per_group": 4,
        "item_name": "keo",
        "group_name": "dia",
    },
    "division": {
        "total_items": 12,
        "groups": 3,
        "item_name": "qua tao",
        "group_name": "ban",
    },
    "fraction_basic": {
        "numerator": 3,
        "denominator": 5,
        "whole_name": "pizza",
    },
    "perimeter_area_basic": {
        "length": 4,
        "width": 3,
        "unit": "o",
        "mode": "area",
    },
    "data_representation": {
        "bar_count": 3,
        "max_value": 9,
        "total_value": 22,
    },
    "addition_subtraction": {
        "operation": "+",
        "operand_a": 5,
        "operand_b": 3,
        "item_name": "cam",
    },
    "comparison_numbers": {
        "number_a": 37,
        "number_b": 42,
    },
    "time_clock": {
        "hour": 7,
        "minute": 0,
    },
    "measurement_length": {
        "length_a": 9,
        "length_b": 6,
        "unit": "cm",
        "object_a": "but",
        "object_b": "thuoc",
    },
}


def normalize_text(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = text.lower()
    return text.replace("đ", "d")


def detect_context(message: str, selected_topic: Topic | None) -> LearningContext:
    normalized = normalize_text(message)
    # An explicit topic keyword in the current message (e.g. "chia") must win
    # over a topic carried over from a previous turn, otherwise the student
    # can never switch topics mid-conversation.
    topic = infer_topic(normalized) or selected_topic
    intent = infer_intent(normalized)

    if topic == "multiplication":
        tool_args = parse_multiplication_operands(normalized) or DEFAULT_TOOL_ARGS[topic]
        return LearningContext(
            topic=topic,
            intent=intent,
            tool_name="candy_multiplication",
            tool_args=tool_args,
            visual_type="equal_groups",
        )

    if topic == "division":
        tool_args = parse_division_operands(normalized) or DEFAULT_TOOL_ARGS[topic]
        return LearningContext(
            topic=topic,
            intent=intent,
            tool_name="equal_division",
            tool_args=tool_args,
            visual_type="sharing",
        )

    if topic == "fraction_basic":
        tool_args = parse_fraction_operands(normalized) or DEFAULT_TOOL_ARGS[topic]
        return LearningContext(
            topic=topic,
            intent=intent,
            tool_name="fraction_pizza",
            tool_args=tool_args,
            visual_type="fraction_pizza",
        )

    if topic == "perimeter_area_basic":
        tool_args = parse_rectangle_operands(normalized) or DEFAULT_TOOL_ARGS[topic]
        return LearningContext(
            topic=topic,
            intent=intent,
            tool_name="rectangle_measurement",
            tool_args=tool_args,
            visual_type=("perimeter_path" if tool_args.get("mode") == "perimeter" else "area_grid"),
        )

    if topic == "data_representation":
        tool_args = parse_bar_chart_operands(normalized) or DEFAULT_TOOL_ARGS[topic]
        return LearningContext(
            topic=topic,
            intent="show_visual" if intent == "explain_concept" else intent,
            tool_name=None,
            tool_args=tool_args,
            visual_type="bar_chart",
        )

    if topic == "addition_subtraction":
        tool_args = parse_addition_subtraction_operands(normalized) or DEFAULT_TOOL_ARGS[topic]
        return LearningContext(
            topic=topic,
            intent=intent,
            tool_name="addition_subtraction",
            tool_args=tool_args,
            visual_type="operation_story",
        )

    if topic == "comparison_numbers":
        tool_args = parse_comparison_operands(normalized) or DEFAULT_TOOL_ARGS[topic]
        return LearningContext(
            topic=topic,
            intent=intent,
            tool_name="number_comparison",
            tool_args=tool_args,
            visual_type="comparison_visual",
        )

    if topic == "time_clock":
        tool_args = parse_time_operands(normalized) or DEFAULT_TOOL_ARGS[topic]
        return LearningContext(
            topic=topic,
            intent=intent,
            tool_name="clock_reading",
            tool_args=tool_args,
            visual_type="clock_calendar",
        )

    if topic == "measurement_length":
        tool_args = parse_measurement_operands(normalized) or DEFAULT_TOOL_ARGS[topic]
        return LearningContext(
            topic=topic,
            intent=intent,
            tool_name="length_comparison",
            tool_args=tool_args,
            visual_type="ruler_measurement",
        )

    return LearningContext(topic=None, intent=intent)


def infer_topic(normalized: str) -> Topic | None:
    if any(
        token in normalized
        for token in [
            "bar chart",
            "bieu do cot",
            "bieu do tranh",
            "bieu do",
            "so sanh cot",
            "so sanh so lieu",
            "so sanh du lieu",
            "to 1",
            "to 2",
            "to 3",
        ]
    ):
        return "data_representation"
    if any(
        token in normalized
        for token in ["so sanh", "lon hon", "be hon", "bang nhau", "so nao lon", "so nao be"]
    ):
        return "comparison_numbers"
    if any(token in normalized for token in ["phan so", "pizza", "/"]):
        return "fraction_basic"
    if any(token in normalized for token in ["chu vi", "dien tich", "hinh chu nhat", "o vuong"]):
        return "perimeter_area_basic"
    if any(
        token in normalized
        for token in ["dong ho", "may gio", "kim ngan", "kim dai", "doc gio", "gio", "phut"]
    ):
        return "time_clock"
    if any(
        token in normalized
        for token in ["do dai", "thuoc", "dai hon", "ngan hon", "chieu dai bang thuoc"]
    ):
        return "measurement_length"
    if any(token in normalized for token in ["chia", "chia deu", ":"]):
        return "division"
    if any(token in normalized for token in ["nhan", "x", "dia keo", "moi nhom"]):
        return "multiplication"
    # NOTE: "them"/"bot" are deliberately excluded — they're common generic
    # Vietnamese words ("more"/"less") that also show up in unrelated
    # follow-up phrases like "cho con them vi du" (give me another example),
    # which would otherwise be misdetected as an addition_subtraction topic
    # switch. "cong"/"tru"/"+"/"-" are unambiguous enough on their own.
    if any(token in normalized for token in ["cong", "tru", "+", "-"]):
        return "addition_subtraction"
    return None


def infer_intent(normalized: str) -> Intent:
    if any(token in normalized for token in ["vi sao", "tai sao", "why"]):
        return "compare_or_why"
    if any(token in normalized for token in ["vi du", "cho con them"]):
        return "give_example"
    if any(token in normalized for token in ["de hon", "ngan hon", "giai thich lai"]):
        return "change_difficulty"
    if any(token in normalized for token in ["hinh", "minh hoa", "visual"]):
        return "show_visual"
    if any(token in normalized for token in ["on tap", "bai tap", "practice"]):
        return "generate_quick_practice"
    return "explain_concept"


def parse_multiplication_operands(normalized: str) -> dict[str, int | str] | None:
    match = re.search(r"(\d+)\s*[x*]\s*(\d+)", normalized)
    if match:
        return {
            "groups": int(match.group(1)),
            "items_per_group": int(match.group(2)),
            "item_name": "keo",
            "group_name": "dia",
        }

    numbers = [int(number) for number in re.findall(r"\d+", normalized)]
    if len(numbers) >= 2:
        return {
            "groups": numbers[0],
            "items_per_group": numbers[1],
            "item_name": "keo",
            "group_name": "dia",
        }
    return None


def parse_division_operands(normalized: str) -> dict[str, int | str] | None:
    match = re.search(r"(\d+)\s*(?::|chia)\s*(\d+)", normalized)
    if match:
        return {
            "total_items": int(match.group(1)),
            "groups": int(match.group(2)),
            "item_name": "qua tao",
            "group_name": "ban",
        }

    numbers = [int(number) for number in re.findall(r"\d+", normalized)]
    if len(numbers) >= 2:
        return {
            "total_items": numbers[0],
            "groups": numbers[1],
            "item_name": "qua tao",
            "group_name": "ban",
        }
    return None


def parse_fraction_operands(normalized: str) -> dict[str, int | str] | None:
    match = re.search(r"(\d+)\s*/\s*(\d+)", normalized)
    if not match:
        return None

    return {
        "numerator": int(match.group(1)),
        "denominator": int(match.group(2)),
        "whole_name": "pizza",
    }


def parse_rectangle_operands(normalized: str) -> dict[str, int | str] | None:
    mode = "area"
    if "chu vi" in normalized and "dien tich" not in normalized:
        mode = "perimeter"

    match = re.search(r"dai\s*(\d+).{0,20}rong\s*(\d+)", normalized)
    if match:
        return {
            "length": int(match.group(1)),
            "width": int(match.group(2)),
            "unit": "o",
            "mode": mode,
        }

    numbers = [int(number) for number in re.findall(r"\d+", normalized)]
    if len(numbers) >= 2:
        return {
            "length": numbers[0],
            "width": numbers[1],
            "unit": "o",
            "mode": mode,
        }
    return None


def parse_addition_subtraction_operands(normalized: str) -> dict[str, int | str] | None:
    match = re.search(r"(\d+)\s*\+\s*(\d+)", normalized) or re.search(
        r"(\d+)\s*cong\s*(\d+)", normalized
    )
    if match:
        return {
            "operation": "+",
            "operand_a": int(match.group(1)),
            "operand_b": int(match.group(2)),
            "item_name": "cam",
        }

    match = re.search(r"(\d+)\s*-\s*(\d+)", normalized) or re.search(
        r"(\d+)\s*tru\s*(\d+)", normalized
    )
    if match:
        return {
            "operation": "-",
            "operand_a": int(match.group(1)),
            "operand_b": int(match.group(2)),
            "item_name": "cam",
        }

    numbers = [int(number) for number in re.findall(r"\d+", normalized)]
    if len(numbers) >= 2:
        operation = "-" if any(token in normalized for token in ["tru", "bot"]) else "+"
        return {
            "operation": operation,
            "operand_a": numbers[0],
            "operand_b": numbers[1],
            "item_name": "cam",
        }
    return None


def parse_comparison_operands(normalized: str) -> dict[str, int | str] | None:
    numbers = [int(number) for number in re.findall(r"\d+", normalized)]
    if len(numbers) >= 2:
        return {"number_a": numbers[0], "number_b": numbers[1]}
    return None


def parse_time_operands(normalized: str) -> dict[str, int | str] | None:
    hour_match = re.search(r"(\d+)\s*gio", normalized)
    if not hour_match:
        return None

    minute_match = re.search(r"(\d+)\s*phut", normalized)
    return {
        "hour": int(hour_match.group(1)),
        "minute": int(minute_match.group(1)) if minute_match else 0,
    }


def parse_measurement_operands(normalized: str) -> dict[str, int | str] | None:
    numbers = [int(number) for number in re.findall(r"\d+", normalized)]
    if len(numbers) >= 2:
        return {
            "length_a": numbers[0],
            "length_b": numbers[1],
            "unit": "cm",
            "object_a": "but",
            "object_b": "thuoc",
        }
    return None


def parse_bar_chart_operands(normalized: str) -> dict[str, int | str] | None:
    matches = re.findall(r"to\s*(\d+)\s*co\s*(\d+)", normalized)
    if not matches:
        return None

    labels = [f"To {group_id}" for group_id, _ in matches]
    values = [int(value) for _, value in matches]
    if not values:
        return None

    return {
        "bar_count": len(values),
        "max_value": max(values),
        "total_value": sum(values),
        "labels_csv": "|".join(labels),
        "values_csv": "|".join(str(value) for value in values),
    }
