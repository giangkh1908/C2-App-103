"""
guardrails.py – Lightweight guardrails for TutorAgent / AgentLoop.

Deterministic keyword-based heuristics only.
No external dependencies, no ML, no regex-heavy solutions.
"""

import unicodedata
from dataclasses import dataclass
from typing import Final

# ---------------------------------------------------------------------------
# Result type
# ---------------------------------------------------------------------------


@dataclass(slots=True)
class GuardrailResult:
    """Result returned when a message should be blocked.

    Attributes:
        category: One of ``greeting``, ``non_math``, ``gibberish``,
            ``prompt_injection``.
        response: Safe response returned directly to the student.
    """

    category: str
    response: str


# ---------------------------------------------------------------------------
# Canned responses
# ---------------------------------------------------------------------------

_RESPONSE_PROMPT_INJECTION: Final[str] = "Cô chỉ hỗ trợ học toán trực quan cho học sinh thôi nhé."
_RESPONSE_GREETING: Final[str] = (
    "Chào con 👋 Con muốn học phép nhân, phép chia, phân số hay hình học hôm nay?"
)
_RESPONSE_GIBBERISH: Final[str] = (
    "Cô chưa hiểu câu hỏi của con. Con hãy nhập một bài toán hoặc nội dung toán học cụ thể nhé."
)
_RESPONSE_NON_MATH: Final[str] = (
    "Cô chuyên hỗ trợ học toán trực quan thôi nhé. Con hãy hỏi một bài toán hoặc khái niệm toán học."
)


# ---------------------------------------------------------------------------
# Keyword lists
# ---------------------------------------------------------------------------

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
    # English
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
    # Vietnamese
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

# Characters that — when they make up the entire message — signal gibberish
_GIBBERISH_CHARS: frozenset[str] = frozenset("abcdefghijklmnopqrstuvwxyz0123456789")
_FILLER_CHARS: frozenset[str] = frozenset(".?!@#$%^&*_-~`")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def remove_accents(text: str) -> str:
    normalized = unicodedata.normalize("NFD", text)

    text = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")

    return text.replace("đ", "d").replace("Đ", "D")


def normalize_text(text: str) -> str:
    """Lowercase and normalize whitespace. Return empty string for blank input."""
    text = remove_accents(text)
    return " ".join(text.lower().split())


def is_greeting(text: str) -> bool:
    normalized = normalize_text(text)

    if not normalized:
        return False

    tokens = normalized.split()

    if len(tokens) <= 4:
        return any(normalized.startswith(keyword) for keyword in _GREETING_KEYWORDS)

    return False


def is_gibberish(text: str) -> bool:
    """Detect meaningless inputs (asdfasdf, ?????, ……, 123123123, …).

    Conservative: only flags input that consists entirely of repeated
    filler characters, or a single word with no vowels whose characters
    are all ASCII letters/digits.
    """
    normalized = normalize_text(text)
    if not normalized:
        return False

    # Case 1: entirely filler/punctuation characters (e.g. ".....", "?????")
    if all(ch in _FILLER_CHARS for ch in normalized if ch != " "):
        return True

    # Case 2: single token, all ASCII, no vowels → keyboard mash
    tokens = normalized.split()
    if len(tokens) == 1:
        token = tokens[0]
        if all(ch in _GIBBERISH_CHARS for ch in token):
            vowels = set("aeiou")
            has_vowel = any(ch in vowels for ch in token)
            if len(set(token)) == 1 and len(token) >= 4:
                return True
            if len(token) >= 5 and not has_vowel:
                return True

    return False


def is_prompt_injection(text: str) -> bool:
    """Detect common prompt injection attempts."""
    normalized = normalize_text(text)
    if not normalized:
        return False
    return any(phrase in normalized for phrase in _PROMPT_INJECTION_PHRASES)


def is_non_math_request(text: str) -> bool:
    """Detect requests clearly outside a math tutoring application."""
    normalized = normalize_text(text)
    if not normalized:
        return False
    return any(phrase in normalized for phrase in _NON_MATH_PHRASES)


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------


def guard_message(text: str) -> GuardrailResult | None:
    """Check a student message against all guardrail rules.

    Priority order:
    1. prompt_injection — highest risk, block immediately
    2. greeting — short-circuit before hitting the agent
    3. gibberish — unprocessable input
    4. non_math — out-of-scope request

    Returns:
        GuardrailResult if the message should be blocked,
        None if it should continue to TutorAgent / AgentLoop.
    """

    if is_prompt_injection(text):
        return GuardrailResult(
            category="prompt_injection",
            response=_RESPONSE_PROMPT_INJECTION,
        )

    if is_greeting(text):
        return GuardrailResult(
            category="greeting",
            response=_RESPONSE_GREETING,
        )

    if is_gibberish(text):
        return GuardrailResult(
            category="gibberish",
            response=_RESPONSE_GIBBERISH,
        )

    if is_non_math_request(text):
        return GuardrailResult(
            category="non_math",
            response=_RESPONSE_NON_MATH,
        )

    return None
