import json
import logging
import re
import unicodedata
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

from src.models.practice import PracticeExamQuestion

logger = logging.getLogger("toan_truc_quan.practice_dataset")

ACTIVE_EXAMS_PER_GRADE = 10
DATASET_SOURCE = "hllj/vi_grade_school_math_mcq"
DEFAULT_FULL_DATASET_PATH = (
    Path(__file__).resolve().parents[2] / "data" / "practice" / "vi_grade_school_math_mcq_full.json"
)
DEFAULT_CURATED_MANIFEST_PATH = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "practice"
    / "vi_grade_school_math_mcq_curated_manifest.json"
)
EXPLANATION_PATTERNS = (
    re.compile(r"dap an dung la[:\s]+([A-D])", re.IGNORECASE),
    re.compile(r"dap an[:\s]+([A-D])", re.IGNORECASE),
    re.compile(r"chon dap an[:\s]+([A-D])", re.IGNORECASE),
)
VISUAL_DEPENDENT_PATTERNS = (
    re.compile(r"\bhinh\s+(ben|duoi|ve|tren)\b", re.IGNORECASE),
    re.compile(r"\bquan sat\s+hinh\b", re.IGNORECASE),
    re.compile(r"\bbuc tranh\b", re.IGNORECASE),
    re.compile(r"\bso do\b", re.IGNORECASE),
    re.compile(r"\bphan\s+to\s+(mau|dam)\b", re.IGNORECASE),
    re.compile(r"\bda\s+to\s+(mau|dam)\b", re.IGNORECASE),
    re.compile(r"\bcho\s+hinh\s+ve\b", re.IGNORECASE),
    re.compile(r"\btrong\s+hinh\s+(ve|tren|duoi|ben)\b", re.IGNORECASE),
    re.compile(r"\bnoi\s+hinh\b", re.IGNORECASE),
    re.compile(r"\bve\s+them\s+hinh\b", re.IGNORECASE),
    re.compile(r"\bgoi?\s+ten\s+hinh\b", re.IGNORECASE),
    re.compile(r"\bchi\s+phan\s+to\b", re.IGNORECASE),
)
MOJIBAKE_MARKERS = ("ÃƒÆ’", "Ãƒâ€ž", "Ãƒâ€¦", "Ãƒâ€ ", "ÃƒÂ¡Ã‚Âº", "ÃƒÂ¡Ã‚Â»")


@dataclass(frozen=True)
class PracticeExamCatalog:
    exams_by_id: dict[str, dict[str, Any]]
    active_exam_ids_by_grade: dict[int, list[str]]

    def list_grade_summaries(self) -> list[dict[str, int]]:
        return [
            {"grade": grade, "exam_count": len(self.active_exam_ids_by_grade.get(grade, []))}
            for grade in range(1, 6)
            if self.active_exam_ids_by_grade.get(grade)
        ]

    def list_active_exams(self, grade: int) -> list[dict[str, Any]]:
        return [
            self.exams_by_id[exam_id]
            for exam_id in self.active_exam_ids_by_grade.get(grade, [])
            if exam_id in self.exams_by_id and self.exams_by_id[exam_id].get("is_active", False)
        ]

    def get_exam(self, exam_id: str, *, active_only: bool) -> dict[str, Any] | None:
        exam = self.exams_by_id.get(exam_id)
        if exam is None:
            return None
        if active_only and not exam.get("is_active", False):
            return None
        return exam


def slugify(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_text.lower()).strip("-")
    return slug or "practice-exam"


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def normalize_ascii(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    return normalized.encode("ascii", "ignore").decode("ascii").lower()


def maybe_fix_mojibake(text: str) -> str:
    if not text or not any(marker in text for marker in MOJIBAKE_MARKERS):
        return text
    try:
        return text.encode("latin1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text


def sanitize_text(text: str) -> str:
    return normalize_space(maybe_fix_mojibake(text))


def clean_question_text(text: str) -> str:
    cleaned = sanitize_text(text.replace("\r", "\n"))
    cleaned = re.sub(r"^(Câu|Cau)\s*\d+:\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\n{2,}", "\n", cleaned)
    return cleaned.strip()


def build_fallback_explanation(correct_choice: str) -> str:
    return f"Đáp án đúng là {correct_choice}. Em thử đọc lại đề và so sánh từng lựa chọn nhé."


def normalize_explanation(text: str, correct_choice: str) -> str:
    cleaned = sanitize_text(text.replace("\r", "\n"))
    cleaned = re.sub(
        r"^\s*(Hướng dẫn giải|Lời giải|Huong dan giai|Loi giai)\s*:?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(r"\n{2,}", "\n", cleaned).strip()
    if len(cleaned) < 12:
        return build_fallback_explanation(correct_choice)
    return cleaned


def infer_correct_choice_index(choices: list[str], explanation: str) -> int | None:
    cleaned_explanation = sanitize_text(explanation)
    normalized = normalize_ascii(cleaned_explanation)
    for pattern in EXPLANATION_PATTERNS:
        match = pattern.search(normalized)
        if not match:
            continue
        index = ord(match.group(1).upper()) - ord("A")
        if 0 <= index < len(choices):
            return index
    fallback = re.search(r"\b([A-D])\b(?=[\.\):\s])", cleaned_explanation)
    if fallback:
        index = ord(fallback.group(1).upper()) - ord("A")
        if 0 <= index < len(choices):
            return index
    return None


def is_visual_dependent_content(*texts: str) -> bool:
    normalized_texts = [normalize_ascii(text) for text in texts if text]
    if not normalized_texts:
        return False
    joined_text = " ".join(normalized_texts)
    return any(pattern.search(joined_text) for pattern in VISUAL_DEPENDENT_PATTERNS)


def build_badge(score: int) -> str:
    if score >= 90:
        return "Xuất sắc"
    if score >= 75:
        return "Rất tốt"
    if score >= 50:
        return "Cố gắng tốt"
    return "Cần luyện thêm"


def build_preview_text(questions: list[PracticeExamQuestion]) -> str:
    if not questions:
        return ""
    preview = normalize_space(questions[0].question_text)
    return preview[:140].rstrip() + ("..." if len(preview) > 140 else "")


def _increment_reason(stats: dict[str, Any], reason: str) -> None:
    skipped_reasons = stats.setdefault("skipped_reasons", {})
    skipped_reasons[reason] = skipped_reasons.get(reason, 0) + 1


def load_curated_manifest(path: Path) -> dict[int, list[str]]:
    with open(path, "r", encoding="utf-8") as file:
        payload = json.load(file)

    if not isinstance(payload, dict):
        raise ValueError("Curated manifest must be a JSON object")

    grades_payload = payload.get("grades", payload)
    if not isinstance(grades_payload, dict):
        raise ValueError("Curated manifest must contain a grade map")

    manifest: dict[int, list[str]] = {}
    for grade in range(1, 6):
        raw_ids = grades_payload.get(str(grade))
        if not isinstance(raw_ids, list):
            raise ValueError(f"Curated manifest is missing grade {grade}")
        source_row_ids = [str(item).strip() for item in raw_ids if str(item).strip()]
        if len(source_row_ids) != ACTIVE_EXAMS_PER_GRADE:
            raise ValueError(
                f"Grade {grade} must contain exactly {ACTIVE_EXAMS_PER_GRADE} curated exams"
            )
        if len(set(source_row_ids)) != len(source_row_ids):
            raise ValueError(f"Grade {grade} contains duplicate curated exam ids")
        manifest[grade] = source_row_ids
    return manifest


def parse_exam_rows(rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    now = datetime.now(timezone.utc)
    exams: list[dict[str, Any]] = []
    stats: dict[str, Any] = {
        "rows_seen": 0,
        "rows_imported": 0,
        "rows_skipped": 0,
        "questions_seen": 0,
        "questions_imported": 0,
        "questions_skipped": 0,
        "skipped_reasons": {},
    }

    for row in rows:
        stats["rows_seen"] += 1
        try:
            grade = int(str(row.get("grade", "")).strip())
        except ValueError:
            stats["rows_skipped"] += 1
            _increment_reason(stats, "invalid_grade")
            continue

        if grade < 1 or grade > 5:
            stats["rows_skipped"] += 1
            _increment_reason(stats, "grade_out_of_range")
            continue

        title = sanitize_text(str(row.get("title", "")).strip())
        source_row_id = str(row.get("id", "")).strip()
        problems = row.get("problems") or []
        if not title or not source_row_id or not isinstance(problems, list):
            stats["rows_skipped"] += 1
            _increment_reason(stats, "invalid_row_shape")
            continue

        questions: list[PracticeExamQuestion] = []
        for idx, problem in enumerate(problems, start=1):
            stats["questions_seen"] += 1
            question_text = clean_question_text(str(problem.get("question", "")).strip())
            raw_choices = problem.get("choices") or []
            choices = [
                sanitize_text(str(choice)) for choice in raw_choices if sanitize_text(str(choice))
            ]
            explanation_raw = sanitize_text(str(problem.get("explanation", "")).strip())

            if not question_text:
                stats["questions_skipped"] += 1
                _increment_reason(stats, "missing_question")
                continue
            if len(choices) < 2:
                stats["questions_skipped"] += 1
                _increment_reason(stats, "invalid_choices")
                continue
            if not explanation_raw:
                stats["questions_skipped"] += 1
                _increment_reason(stats, "missing_explanation")
                continue
            if is_visual_dependent_content(question_text, explanation_raw):
                stats["questions_skipped"] += 1
                _increment_reason(stats, "visual_dependent")
                continue

            correct_index = infer_correct_choice_index(choices, explanation_raw)
            if correct_index is None:
                stats["questions_skipped"] += 1
                _increment_reason(stats, "missing_correct_answer")
                continue

            explanation = normalize_explanation(explanation_raw, choices[correct_index])
            questions.append(
                PracticeExamQuestion(
                    question_id=f"{source_row_id}_q{idx}",
                    question_text=question_text,
                    choices=choices,
                    correct_choice_index=correct_index,
                    explanation=explanation,
                )
            )
            stats["questions_imported"] += 1

        if not questions:
            stats["rows_skipped"] += 1
            _increment_reason(stats, "no_clean_questions")
            continue

        exam_id = f"practice_{source_row_id}"
        exams.append(
            {
                "exam_id": exam_id,
                "source": DATASET_SOURCE,
                "source_split": "train",
                "source_row_id": source_row_id,
                "grade": grade,
                "title": title,
                "slug": slugify(title),
                "preview_text": build_preview_text(questions),
                "question_count": len(questions),
                "tags": [f"grade_{grade}", "math_mcq", "elementary_math"],
                "questions": [question.model_dump() for question in questions],
                "is_active": False,
                "sort_order": None,
                "curation_status": "parsed",
                "created_at": now,
                "updated_at": now,
            }
        )
        stats["rows_imported"] += 1

    return exams, stats


def curate_exam_documents(
    exams: list[dict[str, Any]],
    *,
    curated_manifest: dict[int, list[str]],
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    grouped: dict[int, list[dict[str, Any]]] = defaultdict(list)
    by_source_id: dict[str, dict[str, Any]] = {}
    for exam in exams:
        grouped[exam["grade"]].append(exam)
        by_source_id[exam["source_row_id"]] = exam

    curated: list[dict[str, Any]] = []
    summary: dict[str, Any] = {
        "active_per_grade": {},
        "overflow_per_grade": {},
        "available_per_grade": {},
    }

    selected_ids = {source_row_id for ids in curated_manifest.values() for source_row_id in ids}

    for grade in range(1, 6):
        grade_exams = sorted(
            grouped.get(grade, []),
            key=lambda exam: (-exam["question_count"], exam["title"].lower(), exam["exam_id"]),
        )
        summary["available_per_grade"][str(grade)] = len(grade_exams)
        curated_ids = curated_manifest.get(grade, [])

        if len(grade_exams) < ACTIVE_EXAMS_PER_GRADE:
            raise ValueError(
                f"Grade {grade} only has {len(grade_exams)} clean exams after filtering, expected {ACTIVE_EXAMS_PER_GRADE}"
            )

        for sort_order, source_row_id in enumerate(curated_ids, start=1):
            exam = by_source_id.get(source_row_id)
            if exam is None:
                raise ValueError(
                    f"Curated manifest references missing exam id '{source_row_id}' for grade {grade}"
                )
            if exam["grade"] != grade:
                raise ValueError(
                    f"Curated exam id '{source_row_id}' is assigned to the wrong grade"
                )
            exam["is_active"] = True
            exam["sort_order"] = sort_order
            exam["curation_status"] = "active_curated"

        for exam in grade_exams:
            if exam["source_row_id"] not in selected_ids:
                exam["is_active"] = False
                exam["sort_order"] = None
                exam["curation_status"] = "overflow_pool"
            curated.append(exam)

        summary["active_per_grade"][str(grade)] = len(curated_ids)
        summary["overflow_per_grade"][str(grade)] = max(len(grade_exams) - len(curated_ids), 0)

    return curated, summary


def load_rows_from_file(path: Path) -> list[dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as file:
        payload = json.load(file)
    rows = payload["rows"] if isinstance(payload, dict) and "rows" in payload else payload
    if not isinstance(rows, list):
        raise ValueError("Dataset file must contain a list of rows")
    return rows


def build_exam_documents_from_rows(
    rows: list[dict[str, Any]],
    *,
    curated_manifest: dict[int, list[str]] | None = None,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    manifest = curated_manifest or load_curated_manifest(DEFAULT_CURATED_MANIFEST_PATH)
    parsed_exams, parse_stats = parse_exam_rows(rows)
    curated_exams, curate_stats = curate_exam_documents(parsed_exams, curated_manifest=manifest)
    stats = {
        **parse_stats,
        "active_exam_count": sum(1 for exam in curated_exams if exam["is_active"]),
        "inactive_exam_count": sum(1 for exam in curated_exams if not exam["is_active"]),
        "active_per_grade": curate_stats["active_per_grade"],
        "overflow_per_grade": curate_stats["overflow_per_grade"],
        "available_per_grade": curate_stats["available_per_grade"],
    }
    return curated_exams, stats


def build_exam_catalog(
    rows: list[dict[str, Any]],
    *,
    curated_manifest: dict[int, list[str]] | None = None,
) -> PracticeExamCatalog:
    exams, _stats = build_exam_documents_from_rows(rows, curated_manifest=curated_manifest)
    exams_by_id = {exam["exam_id"]: exam for exam in exams}
    active_exam_ids_by_grade: dict[int, list[str]] = {}
    for grade in range(1, 6):
        active_exam_ids_by_grade[grade] = [
            exam["exam_id"]
            for exam in sorted(
                (
                    candidate
                    for candidate in exams
                    if candidate["grade"] == grade and candidate["is_active"]
                ),
                key=lambda exam: (
                    exam["sort_order"] or 9999,
                    exam["title"].lower(),
                    exam["exam_id"],
                ),
            )
        ]
    return PracticeExamCatalog(
        exams_by_id=exams_by_id, active_exam_ids_by_grade=active_exam_ids_by_grade
    )


_mongo_catalog: PracticeExamCatalog | None = None


async def load_exam_catalog_from_db(db) -> PracticeExamCatalog:
    """Load exam catalog from MongoDB practice_exam_sets collection.

    Falls back to local JSON file if the MongoDB collection is empty.
    """
    global _mongo_catalog
    exams = (
        await db.practice_exam_sets.find(
            {"is_active": True},
            {"_id": 0},
        )
        .sort([("grade", 1), ("sort_order", 1)])
        .to_list(length=None)
    )

    if not exams:
        logger.warning(
            "practice_exam_sets_empty_fallback",
            extra={"fallback": "local_json"},
        )
        _mongo_catalog = get_runtime_exam_catalog()
        return _mongo_catalog

    exams_by_id: dict[str, dict[str, Any]] = {exam["exam_id"]: exam for exam in exams}
    active_exam_ids_by_grade: dict[int, list[str]] = {}
    for grade in range(1, 6):
        active_exam_ids_by_grade[grade] = [
            exam["exam_id"] for exam in exams if exam["grade"] == grade
        ]

    _mongo_catalog = PracticeExamCatalog(
        exams_by_id=exams_by_id,
        active_exam_ids_by_grade=active_exam_ids_by_grade,
    )
    return _mongo_catalog


def get_cached_exam_catalog() -> PracticeExamCatalog:
    """Get the cached catalog. Raises RuntimeError if not loaded yet."""
    if _mongo_catalog is None:
        raise RuntimeError("Practice exam catalog not loaded. Run import script and restart app.")
    return _mongo_catalog


def set_exam_catalog(catalog: PracticeExamCatalog | None) -> None:
    """Set the catalog directly (used by tests and import script)."""
    global _mongo_catalog
    _mongo_catalog = catalog


@lru_cache(maxsize=1)
def get_runtime_exam_catalog(
    dataset_path: Path = DEFAULT_FULL_DATASET_PATH,
    manifest_path: Path = DEFAULT_CURATED_MANIFEST_PATH,
) -> PracticeExamCatalog:
    """Load catalog from local JSON files (used by import script only)."""
    rows = load_rows_from_file(dataset_path)
    manifest = load_curated_manifest(manifest_path)
    return build_exam_catalog(rows, curated_manifest=manifest)
