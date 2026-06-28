#!/usr/bin/env python3
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.services.practice_dataset import (  # noqa: E402
    DEFAULT_CURATED_MANIFEST_PATH,
    DEFAULT_FULL_DATASET_PATH,
    build_exam_documents_from_rows,
    load_curated_manifest,
    load_rows_from_file,
)

MOJIBAKE_MARKERS = ("Ãƒ", "Ã„", "Ã…", "Ã†", "Ã¡Âº", "Ã¡Â»")


def contains_mojibake(text: str) -> bool:
    return any(marker in text for marker in MOJIBAKE_MARKERS)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate practice dataset snapshot and curated manifest before import"
    )
    parser.add_argument(
        "--input-path",
        type=Path,
        default=DEFAULT_FULL_DATASET_PATH,
        help="Path to the full fetched dataset JSON snapshot",
    )
    parser.add_argument(
        "--manifest-path",
        type=Path,
        default=DEFAULT_CURATED_MANIFEST_PATH,
        help="Path to the curated manifest JSON file",
    )
    args = parser.parse_args()

    rows = load_rows_from_file(args.input_path)
    manifest = load_curated_manifest(args.manifest_path)
    exams, stats = build_exam_documents_from_rows(rows, curated_manifest=manifest)

    active_exams = [exam for exam in exams if exam["is_active"]]
    mojibake_findings: list[dict[str, str]] = []

    for exam in active_exams:
        if contains_mojibake(exam["title"]):
            mojibake_findings.append({"exam_id": exam["exam_id"], "field": "title"})
        if contains_mojibake(exam["preview_text"]):
            mojibake_findings.append({"exam_id": exam["exam_id"], "field": "preview_text"})
        for question in exam["questions"]:
            if contains_mojibake(question["question_text"]):
                mojibake_findings.append(
                    {"exam_id": exam["exam_id"], "field": f"question:{question['question_id']}"}
                )
            if contains_mojibake(question["explanation"]):
                mojibake_findings.append(
                    {"exam_id": exam["exam_id"], "field": f"explanation:{question['question_id']}"}
                )

    summary = {
        "input_path": str(args.input_path).encode("ascii", "ignore").decode("ascii"),
        "manifest_path": str(args.manifest_path).encode("ascii", "ignore").decode("ascii"),
        "row_count": len(rows),
        "exam_count": len(exams),
        "active_exam_count": len(active_exams),
        "active_per_grade": stats["active_per_grade"],
        "available_per_grade": stats["available_per_grade"],
        "questions_skipped": stats["questions_skipped"],
        "rows_skipped": stats["rows_skipped"],
        "skipped_reasons": stats["skipped_reasons"],
        "mojibake_findings": mojibake_findings[:20],
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))

    if mojibake_findings:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
