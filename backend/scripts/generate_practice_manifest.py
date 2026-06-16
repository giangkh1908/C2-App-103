#!/usr/bin/env python3
import argparse
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.services.practice_dataset import (  # noqa: E402
    ACTIVE_EXAMS_PER_GRADE,
    DEFAULT_CURATED_MANIFEST_PATH,
    DEFAULT_FULL_DATASET_PATH,
    load_rows_from_file,
    parse_exam_rows,
)


def build_draft_manifest(rows: list[dict]) -> dict[str, dict[str, list[str]]]:
    exams, _stats = parse_exam_rows(rows)
    grouped: dict[int, list[dict]] = {grade: [] for grade in range(1, 6)}
    for exam in exams:
        grouped[exam["grade"]].append(exam)

    manifest: dict[str, dict[str, list[str]]] = {"grades": {}}
    for grade in range(1, 6):
        grade_exams = sorted(
            grouped.get(grade, []),
            key=lambda exam: (-exam["question_count"], exam["title"].lower(), exam["exam_id"]),
        )
        chosen = [exam["source_row_id"] for exam in grade_exams[:ACTIVE_EXAMS_PER_GRADE]]
        if len(chosen) < ACTIVE_EXAMS_PER_GRADE:
            raise ValueError(f"Grade {grade} only has {len(chosen)} clean exams, expected {ACTIVE_EXAMS_PER_GRADE}")
        manifest["grades"][str(grade)] = chosen
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a draft curated manifest from a full dataset snapshot")
    parser.add_argument(
        "--input-path",
        type=Path,
        default=DEFAULT_FULL_DATASET_PATH,
        help="Path to the full fetched dataset JSON snapshot",
    )
    parser.add_argument(
        "--output-path",
        type=Path,
        default=DEFAULT_CURATED_MANIFEST_PATH,
        help="Path to the curated manifest JSON file",
    )
    args = parser.parse_args()

    rows = load_rows_from_file(args.input_path)
    manifest = build_draft_manifest(rows)
    args.output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(args.output_path, "w", encoding="utf-8") as file:
        json.dump(manifest, file, ensure_ascii=False, indent=2)
        file.write("\n")

    safe_output_path = str(args.output_path).encode("ascii", "ignore").decode("ascii")
    print({"output_path": safe_output_path, "grades": list(manifest["grades"].keys())})


if __name__ == "__main__":
    main()
