#!/usr/bin/env python3
import argparse
import asyncio
import sys
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.core.config import settings
from src.services.practice_dataset import (
    ACTIVE_EXAMS_PER_GRADE,
    DEFAULT_CURATED_MANIFEST_PATH,
    DEFAULT_FULL_DATASET_PATH,
    build_exam_documents_from_rows,
    load_curated_manifest,
    load_rows_from_file,
    parse_exam_rows,
)


def _auto_generate_manifest(rows: list) -> dict[int, list[str]]:
    """Auto-generate curated manifest by picking top 10 exams per grade."""
    parsed_exams, _stats = parse_exam_rows(rows)
    manifest: dict[int, list[str]] = {}
    for grade in range(1, 6):
        grade_exams = sorted(
            [e for e in parsed_exams if e["grade"] == grade],
            key=lambda e: (-e["question_count"], e["title"].lower(), e["exam_id"]),
        )
        manifest[grade] = [e["source_row_id"] for e in grade_exams[:ACTIVE_EXAMS_PER_GRADE]]
    return manifest


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Import practice exams from a local dataset export"
    )
    parser.add_argument(
        "dataset_path",
        nargs="?",
        type=Path,
        default=DEFAULT_FULL_DATASET_PATH,
        help="Path to the exported dataset JSON file",
    )
    parser.add_argument(
        "--replace", action="store_true", help="Replace existing practice exams before import"
    )
    parser.add_argument(
        "--deactivate-existing",
        action="store_true",
        help="Mark existing practice exams inactive before upserting the curated set",
    )
    parser.add_argument(
        "--manifest-path",
        type=Path,
        default=DEFAULT_CURATED_MANIFEST_PATH,
        help="Path to the curated manifest JSON file",
    )
    args = parser.parse_args()

    rows = load_rows_from_file(args.dataset_path)

    if args.manifest_path.exists():
        manifest = load_curated_manifest(args.manifest_path)
        print(f"Loaded manifest from {args.manifest_path}")
    else:
        print(f"Manifest not found at {args.manifest_path}, auto-generating...")
        manifest = _auto_generate_manifest(rows)
        print(f"Auto-generated manifest with {sum(len(v) for v in manifest.values())} exams")

    exams, stats = build_exam_documents_from_rows(rows, curated_manifest=manifest)

    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]
    try:
        if args.replace:
            await db.practice_exam_sets.delete_many({})
        elif args.deactivate_existing:
            await db.practice_exam_sets.update_many(
                {},
                {
                    "$set": {
                        "is_active": False,
                        "sort_order": None,
                        "curation_status": "stale_import",
                    }
                },
            )
        for exam in exams:
            await db.practice_exam_sets.replace_one(
                {"exam_id": exam["exam_id"]},
                exam,
                upsert=True,
            )
        print(
            {
                "upserted_exams": len(exams),
                "rows_seen": stats["rows_seen"],
                "rows_imported": stats["rows_imported"],
                "rows_skipped": stats["rows_skipped"],
                "questions_seen": stats["questions_seen"],
                "questions_imported": stats["questions_imported"],
                "questions_skipped": stats["questions_skipped"],
                "active_exam_count": stats["active_exam_count"],
                "inactive_exam_count": stats["inactive_exam_count"],
                "active_per_grade": stats["active_per_grade"],
                "overflow_per_grade": stats["overflow_per_grade"],
                "available_per_grade": stats["available_per_grade"],
                "skipped_reasons": stats["skipped_reasons"],
            }
        )
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
