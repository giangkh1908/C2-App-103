from pathlib import Path

import pytest

from src.services.practice_dataset import (
    ACTIVE_EXAMS_PER_GRADE,
    build_exam_documents_from_rows,
    curate_exam_documents,
    is_visual_dependent_content,
    load_curated_manifest,
    parse_exam_rows,
)


def test_parse_exam_rows_imports_only_clean_questions() -> None:
    rows = [
        {
            "grade": "3",
            "id": "row_1",
            "title": "Đề lớp 3",
            "url": "https://example.com",
            "problems": [
                {
                    "question": "Câu 1: 1 + 1 = ?",
                    "choices": ["A. 1", "B. 2", "C. 3", "D. 4"],
                    "explanation": "Đáp án đúng là: B. Vì 1 cộng 1 bằng 2.",
                },
                {
                    "question": "Câu 2: Câu lỗi",
                    "choices": [],
                    "explanation": "Đáp án đúng là: A.",
                },
            ],
        }
    ]

    exams, stats = parse_exam_rows(rows)

    assert len(exams) == 1
    assert exams[0]["grade"] == 3
    assert exams[0]["question_count"] == 1
    assert exams[0]["questions"][0]["correct_choice_index"] == 1
    assert exams[0]["questions"][0]["question_text"] == "1 + 1 = ?"
    assert stats["questions_seen"] == 2
    assert stats["questions_imported"] == 1
    assert stats["questions_skipped"] == 1
    assert exams[0]["is_active"] is False
    assert exams[0]["curation_status"] == "parsed"
    assert "source_url" not in exams[0]


def test_parse_exam_rows_skips_rows_without_inferable_answer() -> None:
    rows = [
        {
            "grade": "2",
            "id": "row_2",
            "title": "Đề lỗi",
            "url": "https://example.com",
            "problems": [
                {
                    "question": "5 + 5 = ?",
                    "choices": ["A. 8", "B. 9", "C. 10", "D. 11"],
                    "explanation": "Lời giải chưa nêu đáp án rõ ràng.",
                }
            ],
        }
    ]

    exams, stats = parse_exam_rows(rows)

    assert exams == []
    assert stats["rows_seen"] == 1
    assert stats["rows_imported"] == 0
    assert stats["questions_skipped"] == 1
    assert stats["skipped_reasons"]["missing_correct_answer"] == 1


def test_parse_exam_rows_skips_visual_dependent_questions() -> None:
    rows = [
        {
            "grade": "1",
            "id": "visual_row",
            "title": "Đề có hình",
            "problems": [
                {
                    "question": "Câu 1: Quan sát hình vẽ bên rồi chọn đáp án đúng.",
                    "choices": ["A. 1", "B. 2", "C. 3", "D. 4"],
                    "explanation": "Đáp án đúng là: B. Quan sát hình bên ta thấy có 2 bạn nhỏ.",
                }
            ],
        }
    ]

    exams, stats = parse_exam_rows(rows)

    assert exams == []
    assert stats["questions_skipped"] == 1
    assert stats["skipped_reasons"]["visual_dependent"] == 1


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("Quan sát hình vẽ bên rồi chọn đáp án.", True),
        ("Phần tô màu trong hình dưới đây là:", True),
        ("Gọi tên hình có 4 cạnh bằng nhau.", True),
        ("Một hình vuông có cạnh 4 cm. Chu vi là bao nhiêu?", False),
        ("5 + 7 = ?", False),
    ],
)
def test_is_visual_dependent_content(text: str, expected: bool) -> None:
    assert is_visual_dependent_content(text) is expected


def test_curate_exam_documents_requires_enough_clean_exams_per_grade() -> None:
    raw_exams = [
        {
            "exam_id": f"practice_g1_{index}",
            "grade": 1,
            "title": f"Đề 1-{index}",
            "question_count": 3,
            "preview_text": "Preview",
            "questions": [],
            "source": "test",
            "source_split": "train",
            "source_row_id": f"row_1_{index}",
            "tags": [],
            "is_active": False,
            "sort_order": None,
            "curation_status": "parsed",
            "created_at": None,
            "updated_at": None,
        }
        for index in range(9)
    ]
    manifest = {
        1: [f"row_1_{index}" for index in range(ACTIVE_EXAMS_PER_GRADE)],
        2: [f"missing_2_{index}" for index in range(ACTIVE_EXAMS_PER_GRADE)],
        3: [f"missing_3_{index}" for index in range(ACTIVE_EXAMS_PER_GRADE)],
        4: [f"missing_4_{index}" for index in range(ACTIVE_EXAMS_PER_GRADE)],
        5: [f"missing_5_{index}" for index in range(ACTIVE_EXAMS_PER_GRADE)],
    }

    with pytest.raises(ValueError, match="only has 9 clean exams"):
        curate_exam_documents(raw_exams, curated_manifest=manifest)


def test_curate_exam_documents_uses_manifest_order() -> None:
    raw_exams = []
    for grade in range(1, 6):
        for index in range(12):
            raw_exams.append(
                {
                    "exam_id": f"practice_g{grade}_{index}",
                    "grade": grade,
                    "title": f"Đề {grade}-{index}",
                    "question_count": 3,
                    "preview_text": "Preview",
                    "questions": [],
                    "source": "test",
                    "source_split": "train",
                    "source_row_id": f"row_{grade}_{index}",
                    "tags": [],
                    "is_active": False,
                    "sort_order": None,
                    "curation_status": "parsed",
                    "created_at": None,
                    "updated_at": None,
                }
            )

    manifest = {
        1: [f"row_1_{index}" for index in range(10)],
        2: [f"row_2_{index}" for index in range(10)],
        3: [f"missing_3_{index}" for index in range(10)],
        4: [f"row_4_{index}" for index in range(10)],
        5: [f"row_5_{index}" for index in range(10)],
    }

    with pytest.raises(ValueError, match="missing exam id"):
        curate_exam_documents(raw_exams, curated_manifest=manifest)


def test_build_exam_documents_from_rows_requires_manifest_entries_for_all_grades() -> None:
    rows = [
        {
            "grade": "1",
            "id": "row_1",
            "title": "Đề lớp 1",
            "url": "https://example.com",
            "problems": [
                {
                    "question": "Câu 1: 1 + 1 = ?",
                    "choices": ["A. 1", "B. 2", "C. 3", "D. 4"],
                    "explanation": "Đáp án đúng là: B. Vì 1 cộng 1 bằng 2.",
                }
            ],
        }
    ]

    manifest = {
        1: ["row_1"] * ACTIVE_EXAMS_PER_GRADE,
        2: [f"g2_{index}" for index in range(ACTIVE_EXAMS_PER_GRADE)],
        3: [f"g3_{index}" for index in range(ACTIVE_EXAMS_PER_GRADE)],
        4: [f"g4_{index}" for index in range(ACTIVE_EXAMS_PER_GRADE)],
        5: [f"g5_{index}" for index in range(ACTIVE_EXAMS_PER_GRADE)],
    }

    with pytest.raises(ValueError):
        build_exam_documents_from_rows(rows, curated_manifest=manifest)


def test_load_curated_manifest_validates_target_count() -> None:
    manifest_path = Path("backend/tests/fixtures/practice_invalid_manifest.json")
    with pytest.raises(ValueError, match="exactly 10"):
        load_curated_manifest(manifest_path)
