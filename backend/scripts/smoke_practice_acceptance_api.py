#!/usr/bin/env python3
import argparse
import json
import sys
from typing import Any

import requests


VISUAL_DEPENDENT_MARKERS = (
    "hình bên",
    "hình dưới",
    "hình vẽ",
    "quan sát hình",
    "bức tranh",
    "sơ đồ",
    "tô màu",
    "tô đậm",
)


def assert_no_visual_marker(text: str) -> None:
    lowered = text.lower()
    for marker in VISUAL_DEPENDENT_MARKERS:
        if marker in lowered:
            raise AssertionError(f"Visual-dependent content leaked into curated set: '{marker}'")


def require_ok(response: requests.Response, action: str) -> dict[str, Any]:
    if not response.ok:
        raise RuntimeError(f"{action} failed: {response.status_code} {response.text}")
    return response.json()


def main() -> None:
    parser = argparse.ArgumentParser(description="Smoke test the /practice API against an acceptance backend")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000/api/v1", help="Backend API base URL")
    parser.add_argument("--email", required=True, help="Existing user email in the acceptance database")
    parser.add_argument("--password", required=True, help="Existing user password in the acceptance database")
    args = parser.parse_args()

    session = requests.Session()
    login_payload = {"email": args.email, "password": args.password}
    login_data = require_ok(
        session.post(f"{args.base_url}/auth/login", json=login_payload, timeout=30),
        "login",
    )
    access_token = login_data.get("accessToken")
    if not access_token:
        raise RuntimeError("login response did not include accessToken")

    headers = {"Authorization": f"Bearer {access_token}"}
    history_data = require_ok(
        session.get(f"{args.base_url}/practice/attempts", headers=headers, timeout=30),
        "list attempts",
    )
    if history_data.get("attempts"):
        raise AssertionError("Acceptance DB should start with an empty practice attempt history")

    grades_data = require_ok(
        session.get(f"{args.base_url}/practice/grades", headers=headers, timeout=30),
        "list grades",
    )
    grades = grades_data.get("grades", [])
    if len(grades) != 5:
        raise AssertionError(f"Expected 5 grades, got {len(grades)}")

    exam_counts: dict[int, int] = {}
    detail_samples: dict[int, str] = {}
    for grade_info in grades:
        grade = grade_info["grade"]
        exam_count = grade_info["exam_count"]
        if exam_count != 10:
            raise AssertionError(f"Grade {grade} expected 10 exams, got {exam_count}")
        exam_counts[grade] = exam_count

        exams_data = require_ok(
            session.get(f"{args.base_url}/practice/exams", headers=headers, params={"grade": grade}, timeout=30),
            f"list exams grade {grade}",
        )
        exams = exams_data.get("exams", [])
        if len(exams) != 10:
            raise AssertionError(f"Grade {grade} exam list expected 10 exams, got {len(exams)}")

        exam_id = exams[0]["exam_id"]
        detail_data = require_ok(
            session.get(f"{args.base_url}/practice/exams/{exam_id}", headers=headers, timeout=30),
            f"get exam detail {exam_id}",
        )
        if "source_url" in detail_data:
            raise AssertionError("source_url should not be exposed in PracticeExamDetail")
        for question in detail_data.get("questions", []):
            assert_no_visual_marker(question["question_text"])
            assert_no_visual_marker(question["explanation"])
        detail_samples[grade] = exam_id

    print(
        json.dumps(
            {
                "base_url": args.base_url,
                "grades_checked": len(grades),
                "exam_counts": exam_counts,
                "detail_samples": detail_samples,
                "attempt_history_count": 0,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": str(exc)}, ensure_ascii=False))
        sys.exit(1)
