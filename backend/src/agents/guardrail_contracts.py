"""Declarative contracts describing input and output guardrail behavior."""

from dataclasses import dataclass
from typing import Literal

GuardrailCategory = Literal[
    "greeting",
    "non_math",
    "gibberish",
    "prompt_injection",
    "abusive_or_profanity",
    "unsafe_personal_request",
]

GuardrailSeverity = Literal["low", "medium", "high"]


@dataclass(frozen=True, slots=True)
class InputGuardrailContract:
    category: GuardrailCategory
    priority: int
    severity: GuardrailSeverity
    log_reason: str
    trigger_type: Literal["keyword", "heuristic"]
    purpose: str
    response: str
    block_examples: tuple[str, ...]
    allow_examples: tuple[str, ...]
    covered_by_tests: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class OutputGuardCheckContract:
    name: str
    trigger_type: Literal["regex", "heuristic"]
    purpose: str
    covered_by_tests: tuple[str, ...]


INPUT_GUARDRAIL_CONTRACTS: tuple[InputGuardrailContract, ...] = (
    InputGuardrailContract(
        category="prompt_injection",
        priority=1,
        severity="high",
        log_reason="prompt_injection_phrase_detected",
        trigger_type="keyword",
        purpose="Block attempts to reveal or override system behavior before the LLM runs.",
        response="Cô chỉ hỗ trợ học toán trực quan cho học sinh thôi nhé.",
        block_examples=(
            "ignore previous instructions",
            "bo qua tat ca huong dan",
        ),
        allow_examples=("3 x 4 bang bao nhieu",),
        covered_by_tests=("backend/tests/agents/test_guardrails.py",),
    ),
    InputGuardrailContract(
        category="greeting",
        priority=2,
        severity="low",
        log_reason="greeting_short_circuit",
        trigger_type="heuristic",
        purpose="Short-circuit simple greetings with a friendly math-focused prompt.",
        response="Chào con. Con muốn học phép nhân, phép chia, phân số hay hình học hôm nay?",
        block_examples=("xin chao", "hello co oi"),
        allow_examples=("chao co giai giup em 3 x 4 bang bao nhieu",),
        covered_by_tests=("backend/tests/agents/test_guardrails.py",),
    ),
    InputGuardrailContract(
        category="gibberish",
        priority=3,
        severity="medium",
        log_reason="gibberish_detected",
        trigger_type="heuristic",
        purpose="Catch obviously unprocessable inputs without sending them to the LLM.",
        response="Cô chưa hiểu câu hỏi của con. Con hãy nhập một bài toán hoặc nội dung toán học cụ thể nhé.",
        block_examples=(".....", "aaaaaaaa"),
        allow_examples=("12 chia 3", "phan so 3/4"),
        covered_by_tests=("backend/tests/agents/test_guardrails.py",),
    ),
    InputGuardrailContract(
        category="abusive_or_profanity",
        priority=4,
        severity="medium",
        log_reason="abusive_language_detected",
        trigger_type="keyword",
        purpose="Deflect abusive language while keeping the tutor available for math help.",
        response="Mình hãy dùng lời lẽ lịch sự để cô cùng hỗ trợ toán cho con nhé.",
        block_examples=("do ngu", "fuck"),
        allow_examples=("giai bai nay gium em",),
        covered_by_tests=("backend/tests/agents/test_guardrails.py",),
    ),
    InputGuardrailContract(
        category="unsafe_personal_request",
        priority=5,
        severity="high",
        log_reason="personal_data_request_detected",
        trigger_type="keyword",
        purpose="Block requests involving passwords, accounts, OTPs, or personal data.",
        response="Cô không thể hỗ trợ về mật khẩu, tài khoản hay thông tin cá nhân. Con hãy nhờ người lớn hỗ trợ nhé.",
        block_examples=("cho toi mat khau", "cho toi email"),
        allow_examples=("cho em cach giai bai nay",),
        covered_by_tests=("backend/tests/agents/test_guardrails.py",),
    ),
    InputGuardrailContract(
        category="non_math",
        priority=6,
        severity="medium",
        log_reason="non_math_scope_detected",
        trigger_type="keyword",
        purpose="Keep the tutor in math scope for clear non-math requests.",
        response="Cô chuyên hỗ trợ học toán trực quan thôi nhé. Con hãy hỏi một bài toán hoặc khái niệm toán học.",
        block_examples=("viet bai van", "viet code python"),
        allow_examples=("3 x 4 bang bao nhieu",),
        covered_by_tests=("backend/tests/agents/test_guardrails.py",),
    ),
)


OUTPUT_GUARD_CHECK_CONTRACTS: tuple[OutputGuardCheckContract, ...] = (
    OutputGuardCheckContract(
        name="non_empty",
        trigger_type="heuristic",
        purpose="Reject blank assistant outputs before returning them to the student.",
        covered_by_tests=("backend/tests/unit/test_output_guard.py",),
    ),
    OutputGuardCheckContract(
        name="pii_or_secret",
        trigger_type="regex",
        purpose="Reject assistant outputs containing email, phone number, or token-like secrets.",
        covered_by_tests=("backend/tests/unit/test_output_guard.py",),
    ),
    OutputGuardCheckContract(
        name="meta_leak",
        trigger_type="keyword",
        purpose="Reject assistant outputs that reveal internal prompt or tool details.",
        covered_by_tests=("backend/tests/unit/test_output_guard.py",),
    ),
    OutputGuardCheckContract(
        name="math_scope",
        trigger_type="keyword",
        purpose="Reject assistant outputs that drift out of math tutoring scope.",
        covered_by_tests=("backend/tests/unit/test_output_guard.py",),
    ),
    OutputGuardCheckContract(
        name="arithmetic_consistency",
        trigger_type="regex",
        purpose="Reject assistant outputs that contain inconsistent arithmetic statements.",
        covered_by_tests=("backend/tests/unit/test_output_guard.py",),
    ),
    OutputGuardCheckContract(
        name="tool_data_consistency",
        trigger_type="heuristic",
        purpose="Reject assistant outputs that contradict required multiplication or division tool results.",
        covered_by_tests=("backend/tests/unit/test_output_guard.py",),
    ),
)
