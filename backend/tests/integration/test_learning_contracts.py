from unittest.mock import AsyncMock

import pytest

from src.models.chat import (
    ChatTurnResponse,
    PracticeQuestion,
    SimulationConfig,
    VisualCard,
    VisualData,
)
from src.models.lesson import LessonPracticeQuestion, LessonSimulation, LessonVisual
from src.services.types import LearningCoreResult, SessionMetadata


def build_core_result(
    topic: str = "multiplication",
    response_source: str = "llm",
) -> LearningCoreResult:
    visual_by_topic = {
        "multiplication": {
            "visual_spec": LessonVisual(
                visual_type="equal_groups",
                object="keo",
                groups=3,
                items_per_group=4,
                total_items=12,
            ),
            "simulation_spec": LessonSimulation(
                simulation_type="equal_groups_builder",
                prompt="Xep 3 nhom, moi nhom 4 cai keo.",
            ),
            "visual_card": VisualCard(
                topic="multiplication",
                title="Phep nhan 3 x 4 bang nhom deu",
                short_explanation="3 nhom, moi nhom 4 vat se co 12 vat.",
                life_example="Co 3 dia, moi dia 4 cai keo.",
                visual_data=VisualData(
                    type="candy",
                    primary_count=3,
                    secondary_count=4,
                    total_count=12,
                    groups_label="So nhom",
                    items_label="So vat moi nhom",
                ),
                simulation_config=SimulationConfig(
                    type="groups",
                    min_x=1,
                    max_x=12,
                    min_y=1,
                    max_y=20,
                    default_x=3,
                    default_y=4,
                    label_x="So nhom",
                    label_y="So vat moi nhom",
                ),
            ),
            "practice_spec": LessonPracticeQuestion(
                question="3 nhom, moi nhom 4 vat thi co tat ca bao nhieu vat?",
                options=["7", "12", "9", "16"],
                correct_answer="12",
            ),
            "practice_chat": PracticeQuestion(
                id="practice_mult_3_4",
                question_text="3 nhom, moi nhom 4 vat thi co tat ca bao nhieu vat?",
                options=["7", "12", "9", "16"],
                correct_answer_index=1,
                success_message="Dung roi.",
                fail_message="Thu cong lap lai tung nhom nhe.",
                hint="Nhan so nhom voi so vat moi nhom.",
            ),
        },
        "division": {
            "visual_spec": LessonVisual(
                visual_type="sharing",
                object="qua tao",
                groups=4,
                total_items=12,
            ),
            "simulation_spec": LessonSimulation(
                simulation_type="sharing_builder",
                prompt="Chia 12 qua tao deu cho 4 ban.",
            ),
            "visual_card": VisualCard(
                topic="division",
                title="Phep chia 12 cho 4",
                short_explanation="12 vat chia deu cho 4 nhom, moi nhom duoc 3.",
                life_example="Co 12 qua tao chia deu cho 4 ban.",
                visual_data=VisualData(
                    type="apple",
                    primary_count=12,
                    secondary_count=4,
                    total_count=3,
                    groups_label="Tong so tao",
                    items_label="So ban",
                ),
                simulation_config=SimulationConfig(
                    type="division",
                    min_x=1,
                    max_x=30,
                    min_y=1,
                    max_y=10,
                    default_x=12,
                    default_y=4,
                    label_x="Tong so tao",
                    label_y="So ban",
                ),
            ),
            "practice_spec": LessonPracticeQuestion(
                question="12 chia 4 bang may?",
                options=["2", "3", "4", "12"],
                correct_answer="3",
            ),
            "practice_chat": PracticeQuestion(
                id="practice_div_12_4",
                question_text="12 chia 4 bang may?",
                options=["2", "3", "4", "12"],
                correct_answer_index=1,
                success_message="Dung roi.",
                fail_message="Thu chia deu lai nhe.",
                hint="Chia tong so vat cho so nhom.",
            ),
        },
    }

    selected = visual_by_topic[topic]
    return LearningCoreResult(
        topic=topic,  # type: ignore[arg-type]
        grade=3,
        intent="explain_concept",
        assistant_message=selected["visual_card"].short_explanation,
        title=selected["visual_card"].title,
        simple_explanation=selected["visual_card"].short_explanation,
        real_life_example=selected["visual_card"].life_example,
        visual_spec=selected["visual_spec"],
        simulation_spec=selected["simulation_spec"],
        visual_card=selected["visual_card"],
        practice_question_spec=selected["practice_spec"],
        practice_question_chat=selected["practice_chat"],
        tts_text=f"{selected['visual_card'].short_explanation} {selected['visual_card'].life_example}",
        response_mode="explain_with_visual_and_practice",
        follow_up_suggestions=["Cho con vi du khac."],
        session_metadata=SessionMetadata(
            session_id="session_123",
            provider="openai",
            response_source=response_source,  # type: ignore[arg-type]
        ),
    )


@pytest.mark.asyncio
async def test_lessons_generate_without_token_returns_401(client) -> None:
    response = await client.post(
        "/api/v1/lessons/generate",
        json={
            "grade": 3,
            "topic": "multiplication",
            "prompt": "Giai thich 3 x 4",
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_lessons_generate_returns_spec_payload(client, auth_headers, test_user) -> None:
    from src.api.lessons import get_learning_core_service

    fake_service = AsyncMock()
    fake_service.generate.return_value = build_core_result("multiplication")

    app = client._transport.app
    app.dependency_overrides[get_learning_core_service] = lambda: fake_service

    response = await client.post(
        "/api/v1/lessons/generate",
        json={
            "grade": 3,
            "topic": "multiplication",
            "prompt": "Giai thich 3 x 4",
        },
        headers=auth_headers,
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    payload = response.json()
    assert payload["topic"] == "multiplication"
    assert payload["visual"]["visual_type"] == "equal_groups"
    assert payload["simulation"]["simulation_type"] == "equal_groups_builder"
    assert payload["practice_question"]["correct_answer"] == "12"
    # Assert LearningCoreRequest.user_id comes from auth user
    call_kwargs = fake_service.generate.call_args
    assert call_kwargs is not None
    args, _ = call_kwargs
    assert args[0].user_id == str(test_user["_id"])


@pytest.mark.asyncio
async def test_chat_and_lesson_share_the_same_core_shape(client, auth_headers) -> None:
    from src.api.chat import get_tutor_chat_orchestrator
    from src.api.lessons import get_learning_core_service as get_lessons_core_service

    core_result = build_core_result("division", response_source="fallback")
    fake_service = AsyncMock()
    fake_service.generate.return_value = core_result

    class FakeOrchestrator:
        async def handle_turn(self, request, user_id):
            return ChatTurnResponse(
                session_id=core_result.session_metadata.session_id,
                assistant_message=core_result.assistant_message,
                detected_topic=core_result.topic,
                intent=core_result.intent,
                response_mode=core_result.response_mode,
                visual_card=core_result.visual_card,
                practice_question=core_result.practice_question_chat,
                follow_up_suggestions=core_result.follow_up_suggestions,
            )

    app = client._transport.app
    app.dependency_overrides[get_lessons_core_service] = lambda: fake_service
    app.dependency_overrides[get_tutor_chat_orchestrator] = lambda: FakeOrchestrator()

    lesson_response = await client.post(
        "/api/v1/lessons/generate",
        json={
            "grade": 3,
            "topic": "division",
            "prompt": "Giai thich 12 chia 4",
        },
        headers=auth_headers,
    )
    chat_response = await client.post(
        "/api/v1/chat/turn",
        json={
            "grade": 3,
            "message": "Giai thich 12 chia 4",
            "selected_topic": "division",
        },
        headers=auth_headers,
    )

    app.dependency_overrides.clear()

    assert lesson_response.status_code == 200
    assert chat_response.status_code == 200

    lesson_payload = lesson_response.json()
    chat_payload = chat_response.json()

    assert lesson_payload["topic"] == chat_payload["detected_topic"] == "division"
    assert lesson_payload["title"] == chat_payload["visual_card"]["title"]
    assert lesson_payload["real_life_example"] == chat_payload["visual_card"]["life_example"]
    assert lesson_payload["practice_question"]["correct_answer"] == "3"
    assert chat_payload["practice_question"]["options"][1] == "3"
