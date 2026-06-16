import pytest


@pytest.mark.asyncio
async def test_get_practice_grades_requires_auth(client):
    response = await client.get("/api/v1/practice/grades")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_practice_exam_flow_submit_and_history(client, auth_headers, seeded_practice_data):
    del seeded_practice_data
    grades_res = await client.get("/api/v1/practice/grades", headers=auth_headers)
    assert grades_res.status_code == 200
    grades_payload = grades_res.json()
    assert grades_payload["grades"]
    assert grades_payload["grades"][0]["exam_count"] == 10

    exams_res = await client.get("/api/v1/practice/exams?grade=1", headers=auth_headers)
    assert exams_res.status_code == 200
    exams_payload = exams_res.json()
    assert len(exams_payload["exams"]) == 10
    exam_id = exams_payload["exams"][0]["exam_id"]
    assert exams_payload["exams"][0]["attempt_status"] == "not_started"

    detail_res = await client.get(f"/api/v1/practice/exams/{exam_id}", headers=auth_headers)
    assert detail_res.status_code == 200
    exam_detail = detail_res.json()
    assert exam_detail["questions"]
    assert "source_url" not in exam_detail

    create_res = await client.post(
        "/api/v1/practice/attempts",
        headers=auth_headers,
        json={"exam_id": exam_id, "start_mode": "create_new"},
    )
    assert create_res.status_code == 201
    attempt_payload = create_res.json()
    attempt_id = attempt_payload["attempt_id"]

    in_progress_res = await client.get(f"/api/v1/practice/attempts/in-progress?exam_id={exam_id}", headers=auth_headers)
    assert in_progress_res.status_code == 200
    in_progress_payload = in_progress_res.json()
    assert in_progress_payload["attempt"]["attempt_id"] == attempt_id

    first_question = exam_detail["questions"][0]
    draft_res = await client.patch(
        f"/api/v1/practice/attempts/{attempt_id}/draft",
        headers=auth_headers,
        json={
            "answers": [
                {
                    "question_id": first_question["question_id"],
                    "selected_choice_index": first_question["correct_choice_index"],
                }
            ]
        },
    )
    assert draft_res.status_code == 200
    draft_payload = draft_res.json()
    assert draft_payload["status"] == "in_progress"
    assert draft_payload["answers"][0]["question_id"] == first_question["question_id"]

    submit_res = await client.post(
        f"/api/v1/practice/attempts/{attempt_id}/submit",
        headers=auth_headers,
        json={
            "answers": [
                {
                    "question_id": first_question["question_id"],
                    "selected_choice_index": first_question["correct_choice_index"],
                }
            ]
        },
    )
    assert submit_res.status_code == 200
    result_payload = submit_res.json()
    assert result_payload["status"] == "submitted"
    assert result_payload["result_summary"]["total_count"] == len(exam_detail["questions"])
    assert result_payload["questions"][0]["selected_choice_index"] == first_question["correct_choice_index"]
    assert result_payload["answers"][0]["question_id"] == first_question["question_id"]

    history_res = await client.get("/api/v1/practice/attempts", headers=auth_headers)
    assert history_res.status_code == 200
    history_payload = history_res.json()
    assert history_payload["attempts"]
    assert history_payload["attempts"][0]["attempt_id"] == attempt_id

    attempt_detail_res = await client.get(f"/api/v1/practice/attempts/{attempt_id}", headers=auth_headers)
    assert attempt_detail_res.status_code == 200
    attempt_detail_payload = attempt_detail_res.json()
    assert attempt_detail_payload["attempt_id"] == attempt_id
    assert attempt_detail_payload["questions"]


@pytest.mark.asyncio
async def test_in_progress_lookup_returns_null_when_attempt_missing(client, auth_headers, seeded_practice_data):
    del seeded_practice_data
    exams_res = await client.get("/api/v1/practice/exams?grade=1", headers=auth_headers)
    exam_id = exams_res.json()["exams"][0]["exam_id"]

    lookup_res = await client.get(f"/api/v1/practice/attempts/in-progress?exam_id={exam_id}", headers=auth_headers)

    assert lookup_res.status_code == 200
    assert lookup_res.json()["attempt"] is None


@pytest.mark.asyncio
async def test_create_new_rejects_when_attempt_in_progress(client, auth_headers, seeded_practice_data):
    del seeded_practice_data
    exams_res = await client.get("/api/v1/practice/exams?grade=2", headers=auth_headers)
    exam_id = exams_res.json()["exams"][0]["exam_id"]

    first_res = await client.post(
        "/api/v1/practice/attempts",
        headers=auth_headers,
        json={"exam_id": exam_id, "start_mode": "create_new"},
    )
    assert first_res.status_code == 201

    second_res = await client.post(
        "/api/v1/practice/attempts",
        headers=auth_headers,
        json={"exam_id": exam_id, "start_mode": "create_new"},
    )
    assert second_res.status_code == 400


@pytest.mark.asyncio
async def test_restart_abandons_previous_attempt(client, auth_headers, seeded_practice_data):
    del seeded_practice_data
    exams_res = await client.get("/api/v1/practice/exams?grade=3", headers=auth_headers)
    exam_id = exams_res.json()["exams"][0]["exam_id"]

    first_res = await client.post(
        "/api/v1/practice/attempts",
        headers=auth_headers,
        json={"exam_id": exam_id, "start_mode": "create_new"},
    )
    first_attempt_id = first_res.json()["attempt_id"]

    restart_res = await client.post(
        "/api/v1/practice/attempts",
        headers=auth_headers,
        json={"exam_id": exam_id, "start_mode": "restart"},
    )
    assert restart_res.status_code == 201
    restarted_attempt_id = restart_res.json()["attempt_id"]
    assert restarted_attempt_id != first_attempt_id

    first_detail_res = await client.get(f"/api/v1/practice/attempts/{first_attempt_id}", headers=auth_headers)
    assert first_detail_res.status_code == 200
    assert first_detail_res.json()["status"] == "abandoned"

    resumed_res = await client.get(f"/api/v1/practice/attempts/in-progress?exam_id={exam_id}", headers=auth_headers)
    assert resumed_res.status_code == 200
    assert resumed_res.json()["attempt"]["attempt_id"] == restarted_attempt_id


@pytest.mark.asyncio
async def test_submit_rejects_question_not_in_exam(client, auth_headers, seeded_practice_data):
    del seeded_practice_data
    exams_res = await client.get("/api/v1/practice/exams?grade=2", headers=auth_headers)
    exam_id = exams_res.json()["exams"][0]["exam_id"]

    create_res = await client.post(
        "/api/v1/practice/attempts",
        headers=auth_headers,
        json={"exam_id": exam_id, "start_mode": "create_new"},
    )
    attempt_id = create_res.json()["attempt_id"]

    submit_res = await client.post(
        f"/api/v1/practice/attempts/{attempt_id}/submit",
        headers=auth_headers,
        json={
            "answers": [
                {
                    "question_id": "not_in_exam",
                    "selected_choice_index": 0,
                }
            ]
        },
    )

    assert submit_res.status_code == 400


@pytest.mark.asyncio
async def test_submit_with_missing_answers_marks_unanswered_wrong(client, auth_headers, seeded_practice_data):
    del seeded_practice_data
    exams_res = await client.get("/api/v1/practice/exams?grade=2", headers=auth_headers)
    exam_id = exams_res.json()["exams"][0]["exam_id"]

    detail_res = await client.get(f"/api/v1/practice/exams/{exam_id}", headers=auth_headers)
    exam_detail = detail_res.json()
    first_question = exam_detail["questions"][0]
    second_question = exam_detail["questions"][1]

    create_res = await client.post(
        "/api/v1/practice/attempts",
        headers=auth_headers,
        json={"exam_id": exam_id, "start_mode": "create_new"},
    )
    attempt_id = create_res.json()["attempt_id"]

    submit_res = await client.post(
        f"/api/v1/practice/attempts/{attempt_id}/submit",
        headers=auth_headers,
        json={
            "answers": [
                {
                    "question_id": first_question["question_id"],
                    "selected_choice_index": first_question["correct_choice_index"],
                }
            ]
        },
    )

    assert submit_res.status_code == 200
    payload = submit_res.json()
    unanswered = next(question for question in payload["questions"] if question["question_id"] == second_question["question_id"])
    assert payload["status"] == "submitted"
    assert payload["result_summary"]["total_count"] == len(exam_detail["questions"])
    assert unanswered["selected_choice_index"] is None
    assert unanswered["is_correct"] is False


@pytest.mark.asyncio
async def test_inactive_exam_is_not_exposed_but_old_attempt_remains_viewable(client, auth_headers, seeded_practice_data, mock_db):
    sample_exam = next(
        exam
        for exam in seeded_practice_data.exams_by_id.values()
        if exam["grade"] == 1 and exam["is_active"]
    )
    sample_exam["is_active"] = False
    sample_exam["sort_order"] = None
    sample_exam["curation_status"] = "overflow_pool"

    detail_res = await client.get(f"/api/v1/practice/exams/{sample_exam['exam_id']}", headers=auth_headers)
    assert detail_res.status_code == 404

    create_res = await client.post(
        "/api/v1/practice/attempts",
        headers=auth_headers,
        json={"exam_id": next(exam["exam_id"] for exam in seeded_practice_data.list_active_exams(1) if exam["exam_id"] != sample_exam["exam_id"]), "start_mode": "create_new"},
    )
    attempt_id = create_res.json()["attempt_id"]

    await mock_db.practice_attempts.update_one(
        {"attempt_id": attempt_id},
        {"$set": {"exam_id": sample_exam["exam_id"], "exam_title": sample_exam["title"]}},
    )

    attempt_detail_res = await client.get(f"/api/v1/practice/attempts/{attempt_id}", headers=auth_headers)
    assert attempt_detail_res.status_code == 200
    assert attempt_detail_res.json()["exam_id"] == sample_exam["exam_id"]
