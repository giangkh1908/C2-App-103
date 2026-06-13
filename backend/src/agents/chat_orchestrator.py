import re
from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import uuid4

from src.agents.tutor_agent import TutorAgent
from src.core.database import get_db
from src.models.chat import (
    ChatTurnRequest,
    ChatTurnResponse,
    PracticeQuestion,
    ResponseMode,
    SimulationConfig,
    VisualCard,
    VisualData,
)
from src.tools.registry import ToolRegistry


@dataclass
class LearningContext:
    topic: str | None
    intent: str
    tool_name: str | None
    tool_args: dict


class TutorChatOrchestrator:
    def __init__(self, tutor_agent: TutorAgent, tool_registry: ToolRegistry) -> None:
        self.tutor_agent = tutor_agent
        self.tool_registry = tool_registry

    async def handle_turn(self, request: ChatTurnRequest) -> ChatTurnResponse:
        context = infer_learning_context(request.message, request.selected_topic)
        level = grade_to_level(request.grade)

        agent_response = await self.tutor_agent.chat(
            message=request.message,
            level=level,
            use_tools=False,
        )
        assistant_message = normalize_answer(agent_response.answer)

        visual_card: VisualCard | None = None
        practice_question: PracticeQuestion | None = None
        detected_topic = context.topic

        if context.topic and context.tool_name and context.tool_args:
            tool_result = await self.tool_registry.call(context.tool_name, context.tool_args)
            if tool_result.success:
                if is_low_signal_answer(assistant_message):
                    assistant_message = build_contextual_explanation(context.topic, tool_result.data)
                visual_card = build_visual_card(
                    topic=context.topic,
                    assistant_message=assistant_message,
                    tool_data=tool_result.data,
                )
                practice_question = build_practice_question(context.topic, tool_result.data)

        response_mode: ResponseMode
        if visual_card and practice_question:
            response_mode = "explain_with_visual_and_practice"
        elif visual_card:
            response_mode = "explain_with_visual"
        else:
            response_mode = "explain_only"

        session_id = request.session_id or uuid4().hex
        response = ChatTurnResponse(
            session_id=session_id,
            assistant_message=assistant_message,
            detected_topic=detected_topic,  # type: ignore[arg-type]
            intent=context.intent,  # type: ignore[arg-type]
            response_mode=response_mode,
            visual_card=visual_card,
            practice_question=practice_question,
            follow_up_suggestions=build_follow_up_suggestions(context.topic, context.intent),
        )

        await self._persist_snapshot(request=request, response=response)
        return response

    async def _persist_snapshot(self, request: ChatTurnRequest, response: ChatTurnResponse) -> None:
        try:
            db = get_db()
            await db.learning_sessions.insert_one(
                {
                    "session_id": response.session_id,
                    "user_id": request.user_id,
                    "grade": request.grade,
                    "message": request.message,
                    "selected_topic": request.selected_topic,
                    "detected_topic": response.detected_topic,
                    "intent": response.intent,
                    "response_mode": response.response_mode,
                    "assistant_message": response.assistant_message,
                    "visual_snapshot": response.visual_card.model_dump() if response.visual_card else None,
                    "practice_snapshot": response.practice_question.model_dump() if response.practice_question else None,
                    "provider": "openai",
                    "created_at": datetime.now(timezone.utc),
                }
            )
        except Exception:
            # Persistence should not break the chat flow.
            return


def normalize_answer(answer: str) -> str:
    cleaned = (answer or "").strip()
    if not cleaned:
        return "Minh se giai thich ngan gon de con hieu bai toan nay nhe."
    return cleaned


def is_low_signal_answer(answer: str) -> bool:
    normalized = answer.strip().lower()
    return normalized in {
        "hiện tại mình chưa xử lý được câu hỏi này. bạn thử hỏi lại ngắn hơn nhé.",
        "mình gặp lỗi khi xử lý câu hỏi. bạn thử hỏi lại ngắn hơn nhé.",
        "mình sẽ giải thích ngắn gọn để con hiểu bài toán này nhé.",
        "hien tai minh chua xu ly duoc cau hoi nay. ban thu hoi lai ngan hon nhe.",
        "minh gap loi khi xu ly cau hoi. ban thu hoi lai ngan hon nhe.",
        "minh se giai thich ngan gon de con hieu bai toan nay nhe.",
    }


def grade_to_level(grade: int) -> str:
    mapping = {1: "L1", 2: "L2", 3: "L3", 4: "L4", 5: "L5"}
    return mapping.get(grade, "L3")


def infer_learning_context(message: str, selected_topic: str | None) -> LearningContext:
    normalized = message.lower()
    topic = selected_topic or infer_topic(normalized)
    intent = infer_intent(normalized)

    if topic == "fraction_basic":
        operands = parse_fraction_operands(normalized)
        if operands:
            return LearningContext(
                topic=topic,
                intent=intent,
                tool_name="fraction_pizza",
                tool_args=operands,
            )
    elif topic == "division":
        operands = parse_division_operands(normalized)
        if operands:
            return LearningContext(
                topic=topic,
                intent=intent,
                tool_name="equal_division",
                tool_args=operands,
            )
    elif topic == "perimeter_area_basic":
        operands = parse_rectangle_operands(normalized)
        if operands:
            return LearningContext(
                topic=topic,
                intent=intent,
                tool_name="rectangle_measurement",
                tool_args=operands,
            )
    elif topic == "multiplication":
        operands = parse_multiplication_operands(normalized)
        if operands:
            return LearningContext(
                topic=topic,
                intent=intent,
                tool_name="candy_multiplication",
                tool_args=operands,
            )

    return LearningContext(topic=topic, intent=intent, tool_name=None, tool_args={})


def infer_topic(normalized: str) -> str | None:
    if any(token in normalized for token in ["phan so", "pizza", "/"]):
        return "fraction_basic"
    if any(token in normalized for token in ["chu vi", "dien tich", "hinh chu nhat", "o vuong"]):
        return "perimeter_area_basic"
    if any(token in normalized for token in ["chia", "chia deu", ":"]):
        return "division"
    if any(token in normalized for token in ["nhan", "x", "dia keo", "moi nhom"]):
        return "multiplication"
    return None


def infer_intent(normalized: str) -> str:
    if any(token in normalized for token in ["vi sao", "tai sao", "why"]):
        return "compare_or_why"
    if any(token in normalized for token in ["vi du", "cho con them"]):
        return "give_example"
    if any(token in normalized for token in ["de hon", "ngan hon", "giai thich lai"]):
        return "change_difficulty"
    if any(token in normalized for token in ["hinh", "minh hoa", "visual"]):
        return "show_visual"
    if any(token in normalized for token in ["on tap", "bai tap", "practice"]):
        return "generate_quick_practice"
    return "explain_concept"


def parse_multiplication_operands(normalized: str) -> dict | None:
    match = re.search(r"(\d+)\s*[x×*]\s*(\d+)", normalized)
    if match:
        groups, items = int(match.group(1)), int(match.group(2))
        return {"groups": groups, "items_per_group": items, "item_name": "keo", "group_name": "dia"}

    numbers = [int(number) for number in re.findall(r"\d+", normalized)]
    if len(numbers) >= 2:
        return {"groups": numbers[0], "items_per_group": numbers[1], "item_name": "keo", "group_name": "dia"}
    return None


def parse_division_operands(normalized: str) -> dict | None:
    match = re.search(r"(\d+)\s*(?::|chia)\s*(\d+)", normalized)
    if match:
        total_items, groups = int(match.group(1)), int(match.group(2))
        return {"total_items": total_items, "groups": groups, "item_name": "qua tao", "group_name": "ban"}

    numbers = [int(number) for number in re.findall(r"\d+", normalized)]
    if len(numbers) >= 2:
        return {"total_items": numbers[0], "groups": numbers[1], "item_name": "qua tao", "group_name": "ban"}
    return None


def parse_fraction_operands(normalized: str) -> dict | None:
    match = re.search(r"(\d+)\s*/\s*(\d+)", normalized)
    if not match:
        return None

    numerator, denominator = int(match.group(1)), int(match.group(2))
    return {"numerator": numerator, "denominator": denominator, "whole_name": "pizza"}


def parse_rectangle_operands(normalized: str) -> dict | None:
    match = re.search(r"dai\s*(\d+).{0,20}rong\s*(\d+)", normalized)
    if match:
        length, width = int(match.group(1)), int(match.group(2))
        return {"length": length, "width": width, "unit": "o", "mode": "both"}

    numbers = [int(number) for number in re.findall(r"\d+", normalized)]
    if len(numbers) >= 2:
        return {"length": numbers[0], "width": numbers[1], "unit": "o", "mode": "both"}
    return None


def build_visual_card(topic: str, assistant_message: str, tool_data: dict) -> VisualCard:
    if topic == "multiplication":
        return VisualCard(
            topic="multiplication",
            title=f"Phep nhan {tool_data['groups']} x {tool_data['items_per_group']} bang nhom deu",
            short_explanation=assistant_message,
            life_example=f"Co {tool_data['groups']} dia, moi dia co {tool_data['items_per_group']} keo.",
            visual_data=VisualData(
                type="candy",
                primary_count=tool_data["groups"],
                secondary_count=tool_data["items_per_group"],
                total_count=tool_data["total"],
                groups_label="So nhom",
                items_label="So vat moi nhom",
            ),
            simulation_config=SimulationConfig(
                type="groups",
                min_x=1,
                max_x=12,
                min_y=1,
                max_y=20,
                default_x=tool_data["groups"],
                default_y=tool_data["items_per_group"],
                label_x="So nhom",
                label_y="So vat moi nhom",
            ),
        )

    if topic == "division":
        return VisualCard(
            topic="division",
            title=f"Phep chia {tool_data['total_items']} cho {tool_data['groups']}",
            short_explanation=assistant_message,
            life_example=f"Co {tool_data['total_items']} qua tao chia deu cho {tool_data['groups']} ban.",
            visual_data=VisualData(
                type="apple",
                primary_count=tool_data["total_items"],
                secondary_count=tool_data["groups"],
                total_count=tool_data["items_per_group"],
                groups_label="Tong so tao",
                items_label="So ban",
            ),
            simulation_config=SimulationConfig(
                type="division",
                min_x=1,
                max_x=30,
                min_y=1,
                max_y=10,
                default_x=tool_data["total_items"],
                default_y=tool_data["groups"],
                label_x="Tong so tao",
                label_y="So ban",
            ),
        )

    if topic == "fraction_basic":
        return VisualCard(
            topic="fraction_basic",
            title=f"Phan so {tool_data['fraction_text']} bang pizza",
            short_explanation=assistant_message,
            life_example=f"Pizza duoc chia thanh {tool_data['denominator']} phan, minh lay {tool_data['numerator']} phan.",
            visual_data=VisualData(
                type="pizza",
                primary_count=tool_data["numerator"],
                secondary_count=tool_data["denominator"],
                total_count=tool_data["numerator"] / tool_data["denominator"],
                groups_label="So phan da lay",
                items_label="Tong so phan",
            ),
            simulation_config=SimulationConfig(
                type="pizza_slices",
                min_x=0,
                max_x=12,
                min_y=1,
                max_y=12,
                default_x=tool_data["numerator"],
                default_y=tool_data["denominator"],
                label_x="So mieng duoc to",
                label_y="Tong so mieng",
            ),
        )

    return VisualCard(
        topic="perimeter_area_basic",
        title=f"Hinh chu nhat {tool_data['length']} x {tool_data['width']}",
        short_explanation=assistant_message,
        life_example=f"Hinh chu nhat dai {tool_data['length']} o va rong {tool_data['width']} o.",
        visual_data=VisualData(
            type="grid",
            primary_count=tool_data["length"],
            secondary_count=tool_data["width"],
            total_count=tool_data["area"],
            groups_label="Chieu dai",
            items_label="Chieu rong",
        ),
        simulation_config=SimulationConfig(
            type="rectangle_grid",
            min_x=1,
            max_x=20,
            min_y=1,
            max_y=20,
            default_x=tool_data["length"],
            default_y=tool_data["width"],
            label_x="Chieu dai",
            label_y="Chieu rong",
        ),
    )


def build_contextual_explanation(topic: str, tool_data: dict) -> str:
    if topic == "multiplication":
        return (
            f"Con co {tool_data['groups']} nhom va moi nhom co {tool_data['items_per_group']} vat. "
            f"Minh cong {tool_data['items_per_group']} lap lai {tool_data['groups']} lan, "
            f"nen duoc {tool_data['total']}."
        )
    if topic == "division":
        return (
            f"Con lay {tool_data['total_items']} vat chia deu cho {tool_data['groups']} nhom. "
            f"Moi nhom nhan {tool_data['items_per_group']} vat"
            + (
                f" va con du {tool_data['remainder']} vat."
                if tool_data["remainder"]
                else "."
            )
        )
    if topic == "fraction_basic":
        return (
            f"Phan so {tool_data['fraction_text']} nghia la lay {tool_data['numerator']} phan "
            f"trong tong {tool_data['denominator']} phan bang nhau."
        )
    return (
        f"Hinh chu nhat dai {tool_data['length']} va rong {tool_data['width']}. "
        f"Dien tich la {tool_data['area']} o vuong, con chu vi la {tool_data['perimeter']} don vi."
    )


def build_practice_question(topic: str, tool_data: dict) -> PracticeQuestion:
    if topic == "multiplication":
        return PracticeQuestion(
            id=f"practice_mult_{tool_data['groups']}_{tool_data['items_per_group']}",
            question_text=f"Neu co {tool_data['groups']} nhom, moi nhom co {tool_data['items_per_group']} vat thi co tat ca bao nhieu vat?",
            options=[
                str(tool_data["total"] - tool_data["items_per_group"]),
                str(tool_data["total"]),
                str(tool_data["total"] + tool_data["items_per_group"]),
                str(tool_data["groups"] + tool_data["items_per_group"]),
            ],
            correct_answer_index=1,
            success_message="Dung roi. Day la cach cong nhieu nhom bang nhau that gon.",
            fail_message="Con thu cong lap lai so vat moi nhom de tim tong nhe.",
            hint="So nhom nhan voi so vat moi nhom.",
        )
    if topic == "division":
        return PracticeQuestion(
            id=f"practice_div_{tool_data['total_items']}_{tool_data['groups']}",
            question_text=f"Neu co {tool_data['total_items']} vat chia deu cho {tool_data['groups']} ban thi moi ban duoc may vat?",
            options=[
                str(tool_data["items_per_group"]),
                str(tool_data["groups"]),
                str(tool_data["total_items"]),
                str(tool_data["remainder"]),
            ],
            correct_answer_index=0,
            success_message="Dung roi. Chia deu se cho moi nhom so luong bang nhau.",
            fail_message="Con thu chia tong so vat thanh cac nhom bang nhau nhe.",
            hint="Tong so vat chia cho so nhom.",
        )
    if topic == "fraction_basic":
        return PracticeQuestion(
            id=f"practice_frac_{tool_data['numerator']}_{tool_data['denominator']}",
            question_text=f"Lay {tool_data['numerator']} phan trong tong {tool_data['denominator']} phan bang nhau thi duoc phan so nao?",
            options=[
                tool_data["fraction_text"],
                f"{tool_data['denominator']}/{tool_data['numerator']}",
                f"{tool_data['numerator']}/{tool_data['numerator']}",
                f"1/{tool_data['denominator']}",
            ],
            correct_answer_index=0,
            success_message="Dung roi. Tu so la so phan da lay, mau so la tong so phan.",
            fail_message="Con nhin lai pizza de xem da lay may phan trong tong may phan nhe.",
            hint="Tu so o tren, mau so o duoi.",
        )
    return PracticeQuestion(
        id=f"practice_rect_{tool_data['length']}_{tool_data['width']}",
        question_text=f"Hinh chu nhat dai {tool_data['length']} o, rong {tool_data['width']} o co dien tich bao nhieu?",
        options=[
            str(tool_data["length"] + tool_data["width"]),
            str(tool_data["perimeter"]),
            str(tool_data["area"]),
            str(tool_data["width"]),
        ],
        correct_answer_index=2,
        success_message="Dung roi. Dien tich bang chieu dai nhan chieu rong.",
        fail_message="Con thu dem tong so o vuong ben trong hinh nhe.",
        hint="Dien tich = dai x rong.",
    )


def build_follow_up_suggestions(topic: str | None, intent: str) -> list[str]:
    if topic == "division":
        return ["Vi sao chia deu lai ra dap an nay?", "Cho con them mot vi du chia.", "Cho con xem hinh minh hoa."]
    if topic == "fraction_basic":
        return ["Vi sao phan so nay lon hon?", "Cho con vi du khac ve pizza.", "Giai thich ngan hon duoc khong?"]
    if topic == "perimeter_area_basic":
        return ["Phan biet chu vi va dien tich.", "Cho con hinh minh hoa khac.", "Vi sao phai nhan chieu dai voi chieu rong?"]
    if topic == "multiplication":
        return ["Vi sao day la phep nhan?", "Cho con them mot vi du nhom deu.", "Giai thich de hon duoc khong?"]
    if intent == "show_visual":
        return ["Cho con hinh minh hoa nhe.", "Giai thich bang do vat quen thuoc.", "Cho con mot bai tap nhanh."]
    return ["Giai thich de hon duoc khong?", "Cho con mot vi du khac.", "Cho con mot bai tap nho nhe."]
