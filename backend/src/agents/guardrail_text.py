"""Shared text normalization helpers for guardrails."""

import unicodedata


def strip_vietnamese_accents(text: str) -> str:
    """Remove accents and normalize Vietnamese d/D characters safely."""
    normalized = unicodedata.normalize("NFD", text)
    stripped = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return stripped.replace("\u0111", "d").replace("\u0110", "D")


def normalize_guardrail_text(text: str) -> str:
    """Lowercase and normalize whitespace for guardrail keyword matching."""
    return " ".join(strip_vietnamese_accents(text).lower().split())
