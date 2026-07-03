import re
from collections.abc import Callable
from dataclasses import dataclass

from src.agents.guardrail_contracts import (
    OUTPUT_GUARD_CHECK_CONTRACTS,
    OutputGuardCheckContract,
)
from src.agents.guardrail_text import normalize_guardrail_text
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


@dataclass(frozen=True, slots=True)
class _OutputGuardCheck:
    contract: OutputGuardCheckContract
    validator: Callable[[str, Topic | None, dict], list[str]]


def _matches_pii(text: str) -> bool:
    return bool(_EMAIL_RE.search(text) or _PHONE_RE.search(text) or _TOKEN_RE.search(text))


def _matches_meta_leak(normalized: str) -> bool:
    return any(phrase in normalized for phrase in _META_PHRASES)


def _validate_non_empty(answer: str, _topic: Topic | None, _tool_data: dict) -> list[str]:
    if answer.strip():
        return []
    return ["Assistant answer must not be empty."]


def _validate_no_pii(answer: str, _topic: Topic | None, _tool_data: dict) -> list[str]:
    if answer and _matches_pii(answer):
        return ["Assistant answer contains sensitive information."]
    return []


def _validate_no_meta_leak(answer: str, _topic: Topic | None, _tool_data: dict) -> list[str]:
    normalized = normalize_guardrail_text(answer)
    if normalized and _matches_meta_leak(normalized):
        return ["Assistant answer exposes internal prompt or tool details."]
    return []


def _validate_math_scope(answer: str, _topic: Topic | None, _tool_data: dict) -> list[str]:
    normalized = normalize_guardrail_text(answer)
    if normalized and is_non_math_request(normalized):
        return ["Assistant answer is outside the supported math scope."]
    return []


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

    return errors


def _check_tool_data_consistency(answer: str, topic: Topic | None, tool_data: dict) -> list[str]:
    errors: list[str] = []
    expected_total = tool_data.get("total")
    if topic == "multiplication" and isinstance(expected_total, int):
        if "bang" in normalize_text(answer) and str(expected_total) not in answer:
            errors.append("Multiplication answer omits the expected total from tool data.")

    expected_items_per_group = tool_data.get("items_per_group")
    if topic == "division" and isinstance(expected_items_per_group, int):
        if "moi nhom" in normalize_text(answer) and str(expected_items_per_group) not in answer:
            errors.append("Division answer omits the expected per-group result from tool data.")

    return errors


def _validate_arithmetic(answer: str, topic: Topic | None, tool_data: dict) -> list[str]:
    return _check_arithmetic_consistency(answer, topic, tool_data)


def _validate_tool_data(answer: str, topic: Topic | None, tool_data: dict) -> list[str]:
    return _check_tool_data_consistency(answer, topic, tool_data)


_OUTPUT_GUARD_CHECKS: tuple[_OutputGuardCheck, ...] = (
    _OutputGuardCheck(
        contract=OUTPUT_GUARD_CHECK_CONTRACTS[0],
        validator=_validate_non_empty,
    ),
    _OutputGuardCheck(
        contract=OUTPUT_GUARD_CHECK_CONTRACTS[1],
        validator=_validate_no_pii,
    ),
    _OutputGuardCheck(
        contract=OUTPUT_GUARD_CHECK_CONTRACTS[2],
        validator=_validate_no_meta_leak,
    ),
    _OutputGuardCheck(
        contract=OUTPUT_GUARD_CHECK_CONTRACTS[3],
        validator=_validate_math_scope,
    ),
    _OutputGuardCheck(
        contract=OUTPUT_GUARD_CHECK_CONTRACTS[4],
        validator=_validate_arithmetic,
    ),
    _OutputGuardCheck(
        contract=OUTPUT_GUARD_CHECK_CONTRACTS[5],
        validator=_validate_tool_data,
    ),
)


def list_output_guard_contracts() -> tuple[OutputGuardCheckContract, ...]:
    """Expose output guard contracts for audit and tests."""
    return tuple(check.contract for check in _OUTPUT_GUARD_CHECKS)


def validate_assistant_output(
    *,
    answer: str,
    topic: Topic | None,
    tool_data: dict,
    scope_restricted_to_math: bool = True,
) -> OutputValidationResult:
    sanitized_answer = answer.strip()
    errors: list[str] = []
    for check in _OUTPUT_GUARD_CHECKS:
        if check.contract.name == "math_scope" and not scope_restricted_to_math:
            continue
        errors.extend(check.validator(sanitized_answer, topic, tool_data))

    return OutputValidationResult(
        is_valid=len(errors) == 0,
        sanitized_answer=sanitized_answer,
        errors=errors,
    )
