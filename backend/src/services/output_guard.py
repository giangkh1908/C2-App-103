import re
from dataclasses import dataclass

from src.agents.guardrails import is_non_math_request, normalize_text
from src.models.chat import Topic

_EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
_PHONE_RE = re.compile(r"(?:\+?84|0)(?:\d{9}|\d{10})\b")
_TOKEN_RE = re.compile(r"\b(?:sk|pk|rk|ghp|gho|ghu|ghs|ghr|AKIA|eyJ)[A-Za-z0-9._-]{8,}\b")
_META_PHRASES = (
    "system prompt",
    "developer message",
    "tool call",
    "internal instruction",
    "chain of thought",
    "prompt injection",
)
_MULTIPLICATION_RE = re.compile(r"(\d+)\s*(?:x|\*)\s*(\d+)\s*(?:=|bang)\s*(\d+)", re.IGNORECASE)
_ADDITION_RE = re.compile(r"(\d+)\s*\+\s*(\d+)\s*(?:=|bang)\s*(\d+)", re.IGNORECASE)
_SUBTRACTION_RE = re.compile(r"(\d+)\s*-\s*(\d+)\s*(?:=|bang)\s*(\d+)", re.IGNORECASE)


@dataclass(slots=True)
class OutputValidationResult:
    is_valid: bool
    sanitized_answer: str
    errors: list[str]


def _matches_pii(text: str) -> bool:
    return bool(_EMAIL_RE.search(text) or _PHONE_RE.search(text) or _TOKEN_RE.search(text))


def _matches_meta_leak(normalized: str) -> bool:
    return any(phrase in normalized for phrase in _META_PHRASES)


def _check_arithmetic_consistency(answer: str, topic: Topic | None, tool_data: dict) -> list[str]:
    errors: list[str] = []

    for left, right, result in _MULTIPLICATION_RE.findall(answer):
        if int(left) * int(right) != int(result):
            errors.append("Multiplication statement is inconsistent.")

    for left, right, result in _ADDITION_RE.findall(answer):
        if int(left) + int(right) != int(result):
            errors.append("Addition statement is inconsistent.")

    for left, right, result in _SUBTRACTION_RE.findall(answer):
        if int(left) - int(right) != int(result):
            errors.append("Subtraction statement is inconsistent.")

    expected_total = tool_data.get("total")
    if topic == "multiplication" and isinstance(expected_total, int):
        if "bang" in normalize_text(answer) and str(expected_total) not in answer:
            errors.append("Multiplication answer omits the expected total from tool data.")

    expected_items_per_group = tool_data.get("items_per_group")
    if topic == "division" and isinstance(expected_items_per_group, int):
        if "moi nhom" in normalize_text(answer) and str(expected_items_per_group) not in answer:
            errors.append("Division answer omits the expected per-group result from tool data.")

    return errors


def validate_assistant_output(
    *,
    answer: str,
    topic: Topic | None,
    tool_data: dict,
    scope_restricted_to_math: bool = True,
) -> OutputValidationResult:
    sanitized_answer = answer.strip()
    errors: list[str] = []
    normalized = normalize_text(sanitized_answer)

    if not sanitized_answer:
        errors.append("Assistant answer must not be empty.")

    if sanitized_answer and _matches_pii(sanitized_answer):
        errors.append("Assistant answer contains sensitive information.")

    if normalized and _matches_meta_leak(normalized):
        errors.append("Assistant answer exposes internal prompt or tool details.")

    if scope_restricted_to_math and normalized and is_non_math_request(normalized):
        errors.append("Assistant answer is outside the supported math scope.")

    errors.extend(_check_arithmetic_consistency(sanitized_answer, topic, tool_data))

    return OutputValidationResult(
        is_valid=len(errors) == 0,
        sanitized_answer=sanitized_answer,
        errors=errors,
    )
