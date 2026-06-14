from unittest.mock import AsyncMock

import pytest


@pytest.mark.asyncio
async def test_topics_endpoint_returns_four_topics(client) -> None:
    response = await client.get("/api/v1/topics")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["topics"]) == 4


@pytest.mark.asyncio
async def test_chat_turn_returns_structured_payload(client, monkeypatch) -> None:
    from src.api import chat as chat_api
    from src.models.chat import ChatTurnResponse

    fake_response = ChatTurnResponse(
        session_id="session_123",
        assistant_message="Day la giai thich ngan gon.",
        detected_topic="multiplication",
        intent="explain_concept",
        response_mode="explain_with_visual_and_practice",
        visual_card={
            "topic": "multiplication",
            "title": "Phep nhan 3 x 4 bang nhom deu",
            "short_explanation": "Day la giai thich ngan gon.",
            "life_example": "Co 3 dia, moi dia 4 keo.",
            "visual_data": {
                "type": "candy",
                "primary_count": 3,
                "secondary_count": 4,
                "total_count": 12,
                "groups_label": "So nhom",
                "items_label": "So vat moi nhom",
            },
            "simulation_config": {
                "type": "groups",
                "min_x": 1,
                "max_x": 12,
                "min_y": 1,
                "max_y": 20,
                "default_x": 3,
                "default_y": 4,
                "label_x": "So nhom",
                "label_y": "So vat moi nhom",
            },
        },
        practice_question={
            "id": "practice",
            "question_text": "Hoi nhanh",
            "options": ["1", "12", "9", "7"],
            "correct_answer_index": 1,
            "success_message": "Dung roi",
            "fail_message": "Thu lai nhe",
            "hint": "Nhan hai so",
        },
        follow_up_suggestions=["Cho con vi du khac."],
    )

    fake_orchestrator = AsyncMock()
    fake_orchestrator.handle_turn.return_value = fake_response
    app = client._transport.app
    app.dependency_overrides[chat_api.get_tutor_chat_orchestrator] = lambda: fake_orchestrator

    response = await client.post(
        "/api/v1/chat/turn",
        json={
            "user_id": "user_1",
            "grade": 3,
            "message": "Giai thich phep nhan 3 x 4",
        },
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["detected_topic"] == "multiplication"
    assert payload["visual_card"]["visual_data"]["type"] == "candy"
