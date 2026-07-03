"""
guardrails.py - Lightweight guardrails for TutorAgent / AgentLoop.

Deterministic keyword-based heuristics only.
No external dependencies, no ML, no regex-heavy solutions.
"""

from collections.abc import Callable
from dataclasses import dataclass

from src.agents.guardrail_contracts import (
    INPUT_GUARDRAIL_CONTRACTS,
    GuardrailCategory,
    GuardrailSeverity,
    InputGuardrailContract,
)
from src.agents.guardrail_text import normalize_guardrail_text


@dataclass(slots=True)
class GuardrailResult:
    """Result returned when a message should be blocked."""

    category: GuardrailCategory
    response: str
    severity: GuardrailSeverity
    log_reason: str


_GREETING_KEYWORDS: frozenset[str] = frozenset(
    {
        "hi",
        "hello",
        "hey",
        "xin chao",
        "chao",
        "chao co",
        "chao ban",
        "good morning",
        "good afternoon",
        "good evening",
        "howdy",
    }
)

_PROMPT_INJECTION_PHRASES: tuple[str, ...] = (
    "ignore previous instructions",
    "ignore your instructions",
    "ignore all instructions",
    "reveal system prompt",
    "show system prompt",
    "print system prompt",
    "display system prompt",
    "act as chatgpt",
    "act as gpt",
    "you are chatgpt",
    "you are gpt",
    "pretend you are",
    "forget your role",
    "disregard previous",
    "override instructions",
    "jailbreak",
    "huong dan truoc",
    "bo qua huong dan truoc",
    "bo qua tat ca huong dan",
    "hay bo qua huong dan",
    "quen vai tro cua ban",
    "bo qua vai tro hien tai",
    "tiet lo system prompt",
    "hien system prompt",
    "cho toi xem system prompt",
    "in system prompt",
    "dua ra system prompt",
    "ban la chatgpt",
    "ban la gpt",
    "dong vai chatgpt",
    "gia vo la chatgpt",
    "gia vo la gpt",
    "thay doi huong dan",
    "ghi de huong dan",
    "override huong dan",
    "bo qua tat ca quy tac",
    "pha vo gioi han",
)

_NON_MATH_PHRASES: tuple[str, ...] = (
    "viet bai van",
    "ke chuyen",
    "lam tho",
    "viet tho",
    "viet email",
    "viet bai",
    "bai van",
    "viet van",
    "lam van",
    "tom tat bai bao",
    "tom tat van ban",
    "dich doan van",
    "dich sang tieng",
    "viet code",
    "lap trinh",
    "tin tuc",
    "the thao",
    "am nhac",
    "phim",
    "nau an",
    "cong thuc nau",
)

_ABUSIVE_OR_PROFANITY_PHRASES: tuple[str, ...] = (
    "do ngu",
    "ngu qua",
    "im di",
    "im mom",
    "cai lon",
    "lon me",
    "dit me",
    "me may",
    "fuck",
    "shit",
    "stupid",
    "idiot",
)

_UNSAFE_PERSONAL_REQUEST_PHRASES: tuple[str, ...] = (
    "mat khau",
    "password",
    "otp",
    "ma xac thuc",
    "ma xac minh",
    "token",
    "api key",
    "tai khoan cua toi",
    "dang nhap ho",
    "dang nhap giup",
    "cho toi email",
    "so dien thoai cua",
    "thong tin ca nhan",
)

_GIBBERISH_CHARS: frozenset[str] = frozenset("abcdefghijklmnopqrstuvwxyz0123456789")
_FILLER_CHARS: frozenset[str] = frozenset(".?!@#$%^&*_-~`")


def normalize_text(text: str) -> str:
    """Lowercase and normalize whitespace. Return empty string for blank input."""
    return normalize_guardrail_text(text)


def is_greeting(text: str) -> bool:
    normalized = normalize_text(text)
    if not normalized:
        return False

    tokens = normalized.split()
    return len(tokens) <= 4 and any(
        normalized.startswith(keyword) for keyword in _GREETING_KEYWORDS
    )


def is_gibberish(text: str) -> bool:
    """Detect meaningless inputs conservatively."""
    normalized = normalize_text(text)
    if not normalized:
        return False

    if all(ch in _FILLER_CHARS for ch in normalized if ch != " "):
        return True

    tokens = normalized.split()
    if len(tokens) != 1:
        return False

    token = tokens[0]
    if not all(ch in _GIBBERISH_CHARS for ch in token):
        return False

    has_vowel = any(ch in set("aeiou") for ch in token)
    if len(set(token)) == 1 and len(token) >= 4:
        return True
    return len(token) >= 5 and not has_vowel


def is_prompt_injection(text: str) -> bool:
    normalized = normalize_text(text)
    return bool(normalized) and any(phrase in normalized for phrase in _PROMPT_INJECTION_PHRASES)


def is_non_math_request(text: str) -> bool:
    normalized = normalize_text(text)
    return bool(normalized) and any(phrase in normalized for phrase in _NON_MATH_PHRASES)


def is_abusive_or_profanity(text: str) -> bool:
    normalized = normalize_text(text)
    return bool(normalized) and any(
        phrase in normalized for phrase in _ABUSIVE_OR_PROFANITY_PHRASES
    )


def is_unsafe_personal_request(text: str) -> bool:
    normalized = normalize_text(text)
    return bool(normalized) and any(
        phrase in normalized for phrase in _UNSAFE_PERSONAL_REQUEST_PHRASES
    )


@dataclass(frozen=True, slots=True)
class _InputGuardRule:
    contract: InputGuardrailContract
    predicate: Callable[[str], bool]

    def maybe_block(self, text: str) -> GuardrailResult | None:
        if not self.predicate(text):
            return None
        return GuardrailResult(
            category=self.contract.category,
            response=self.contract.response,
            severity=self.contract.severity,
            log_reason=self.contract.log_reason,
        )


_PREDICATES_BY_CATEGORY: dict[GuardrailCategory, Callable[[str], bool]] = {
    "prompt_injection": is_prompt_injection,
    "greeting": is_greeting,
    "gibberish": is_gibberish,
    "abusive_or_profanity": is_abusive_or_profanity,
    "unsafe_personal_request": is_unsafe_personal_request,
    "non_math": is_non_math_request,
}

_INPUT_GUARD_RULES: tuple[_InputGuardRule, ...] = tuple(
    _InputGuardRule(contract=contract, predicate=_PREDICATES_BY_CATEGORY[contract.category])
    for contract in sorted(INPUT_GUARDRAIL_CONTRACTS, key=lambda contract: contract.priority)
)


def list_input_guardrail_contracts() -> tuple[InputGuardrailContract, ...]:
    """Expose ordered input guardrail contracts for audit and tests."""
    return tuple(rule.contract for rule in _INPUT_GUARD_RULES)


def guard_message(text: str) -> GuardrailResult | None:
    """Check a student message against all guardrail rules."""
    for rule in _INPUT_GUARD_RULES:
        blocked = rule.maybe_block(text)
        if blocked is not None:
            return blocked
    return None
