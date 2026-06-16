import re

from src.models.chat import Intent, Topic
from src.services.types import LearningContext
import unicodedata

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
}


def normalize_text(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    text = "".join(
        ch
        for ch in text
        if unicodedata.category(ch) != "Mn"
    )
    text = text.lower()
    return text.replace("đ", 'd')

def detect_context(message: str, selected_topic: Topic | None) -> LearningContext:
    normalized = normalize_text(message)
    topic = selected_topic or infer_topic(normalized)
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
            visual_type=(
                "perimeter_path"
                if tool_args.get("mode") == "perimeter"
                else "area_grid"
            ),
        )

    return LearningContext(topic=None, intent=intent)


def infer_topic(normalized: str) -> Topic | None:
    if any(token in normalized for token in ["phan so", "pizza", "/"]):
        return "fraction_basic"
    if any(token in normalized for token in ["chu vi", "dien tich", "hinh chu nhat", "o vuong"]):
        return "perimeter_area_basic"
    if any(token in normalized for token in ["chia", "chia deu", ":"]):
        return "division"
    if any(token in normalized for token in ["nhan", "x", "dia keo", "moi nhom"]):
        return "multiplication"
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
