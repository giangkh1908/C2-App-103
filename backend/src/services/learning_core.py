from uuid import uuid4

from src.agents.tutor_agent import TutorAgent
from src.core.config import settings
from src.models.chat import Topic
from src.services.context_detector import DEFAULT_TOOL_ARGS, detect_context
from src.services.practice_builder import build_practice_questions
from src.services.response_mapper import to_chat_response, to_lesson_response
from src.services.session_repository import SessionRepository
from src.services.types import (
    LearningContext,
    LearningCoreRequest,
    LearningCoreResult,
    LearningPersistencePayload,
    SessionMetadata,
)
from src.services.validation import validate_learning_core_result, validate_lesson_response
from src.services.visual_builder import build_visual_bundle
from src.tools.registry import ToolRegistry


class LearningCoreService:
    def __init__(
        self,
        tutor_agent: TutorAgent,
        tool_registry: ToolRegistry,
        session_repository: SessionRepository | None = None,
    ) -> None:
        self.tutor_agent = tutor_agent
        self.tool_registry = tool_registry
        self.session_repository = session_repository or SessionRepository()

    async def generate(self, request: LearningCoreRequest) -> LearningCoreResult:
        context = detect_context(request.message, request.selected_topic)
        if context.topic is None:
            agent_response = await self.tutor_agent.chat(
                message=build_tutor_message(request.message, None, request.grade),
                level=grade_to_level(request.grade),
                use_tools=False,
            )
            answer = normalize_answer(agent_response.answer)
            response_source = "llm"

            if is_clarification_response(answer):
                clarification_result = self._build_clarification_result(
                    request=request,
                    context=context,
                    assistant_message=answer,
                )
                await self._persist(request, clarification_result)
                return clarification_result
            else:
                default_topic = request.selected_topic or "multiplication"
                context = build_default_context(default_topic)
                result = self._build_result(
                    request=request,
                    context=context,
                    tool_data=build_default_tool_data(default_topic, context.tool_args),
                    assistant_message=answer,
                    response_source=response_source,
                    response_mode="explain_only",
                    follow_up_suggestions=[
                        "Con muốn học phép nhân.",
                        "Con muốn học phép chia.",
                        "Con muốn học phân số.",
                        "Con muốn học chu vi và diện tích.",
                    ],
                )
                await self._persist(request, result)
                return result


        agent_response = await self.tutor_agent.chat(
            message=build_tutor_message(request.message, context.topic, request.grade),
            level=grade_to_level(request.grade),
            use_tools=False,
        )
        answer = normalize_answer(agent_response.answer)
        response_source = "llm"

        # Nếu LLM hỏi lại (clarification) → trả ngay, không cần visual
        if is_clarification_response(answer):
            clarification_result = self._build_clarification_result(
                request=request,
                context=context,
                assistant_message=answer,
            )
            await self._persist(request, clarification_result)
            return clarification_result

        tool_result = await self.tool_registry.call(context.tool_name or "", context.tool_args)
        if not tool_result.success:
            tool_data = build_default_tool_data(context.topic, context.tool_args)
            response_source = "fallback"
        else:
            tool_data = tool_result.data

        if is_low_signal_answer(answer):
            answer = build_contextual_explanation(context.topic, tool_data)
            response_source = "fallback"

        result = self._build_result(
            request=request,
            context=context,
            tool_data=tool_data,
            assistant_message=answer,
            response_source=response_source,
            response_mode="explain_with_visual_and_practice",
            follow_up_suggestions=build_follow_up_suggestions(context.topic, context.intent),
        )

        try:
            validate_learning_core_result(result)
            lesson_resp = to_lesson_response(result)
            if lesson_resp is not None:
                validate_lesson_response(lesson_resp)
        except ValueError:
            result = self._build_result(
                request=request,
                context=context,
                tool_data=tool_data,
                assistant_message=build_contextual_explanation(context.topic, tool_data),
                response_source="fallback",
                response_mode="explain_with_visual_and_practice",
                follow_up_suggestions=build_follow_up_suggestions(context.topic, context.intent),
            )
            validate_learning_core_result(result)
            lesson_resp = to_lesson_response(result)
            if lesson_resp is not None:
                validate_lesson_response(lesson_resp)

        await self._persist(request, result)
        return result

    def _build_clarification_result(
        self,
        request: LearningCoreRequest,
        context: LearningContext,
        assistant_message: str,
    ) -> LearningCoreResult:
        """Build kết quả khi agent cần hỏi lại người dùng."""
        topic = context.topic or "multiplication"
        return LearningCoreResult(
            topic=topic,
            grade=request.grade,
            intent=context.intent,
            assistant_message=assistant_message,
            title="",
            simple_explanation=assistant_message,
            real_life_example="",
            visual_spec=None,
            simulation_spec=None,
            visual_card=None,
            practice_question_spec=None,
            practice_question_chat=None,
            tts_text=assistant_message,
            response_mode="clarification_needed",
            follow_up_suggestions=[
                "Con muốn học phép nhân.",
                "Con muốn học phép chia.",
                "Con muốn học phân số.",
                "Con muốn học chu vi và diện tích.",
            ],
            session_metadata=SessionMetadata(
                session_id=request.session_id or uuid4().hex,
                provider=settings.llm_provider,
                response_source="llm",
            ),
        )


    def _build_result(
        self,
        request: LearningCoreRequest,
        context: LearningContext,
        tool_data: dict,
        assistant_message: str,
        response_source: str,
        response_mode: str,
        follow_up_suggestions: list[str],
    ) -> LearningCoreResult:
        topic = context.topic or "multiplication"
        visual_spec, simulation_spec, visual_card = build_visual_bundle(
            topic=topic,
            assistant_message=assistant_message,
            tool_data=tool_data,
            context=context,
        )
        practice_question_spec, practice_question_chat = build_practice_questions(topic, tool_data)
        return LearningCoreResult(
            topic=topic,
            grade=request.grade,
            intent=context.intent,
            assistant_message=assistant_message,
            title=visual_card.title,
            simple_explanation=assistant_message,
            real_life_example=visual_card.life_example,
            visual_spec=visual_spec,
            simulation_spec=simulation_spec,
            visual_card=visual_card,
            practice_question_spec=practice_question_spec,
            practice_question_chat=practice_question_chat,
            tts_text=f"{assistant_message} {visual_card.life_example}".strip(),
            response_mode=response_mode,
            follow_up_suggestions=follow_up_suggestions,
            session_metadata=SessionMetadata(
                session_id=request.session_id or uuid4().hex,
                provider=settings.llm_provider,
                response_source="fallback" if response_source == "fallback" else "llm",
            ),
        )

    async def _persist(self, request: LearningCoreRequest, result: LearningCoreResult) -> None:
        try:
            await self.session_repository.save(
                LearningPersistencePayload(
                    request=request,
                    result=result,
                    lesson_snapshot=to_lesson_response(result).model_dump(),
                    chat_snapshot=to_chat_response(result),
                )
            )
        except Exception:
            return


def build_default_context(topic: Topic) -> LearningContext:
    return detect_context("", topic)


def build_default_tool_data(topic: Topic, tool_args: dict[str, int | str]) -> dict:
    if topic == "multiplication":
        groups = int(tool_args["groups"])
        items_per_group = int(tool_args["items_per_group"])
        return {
            "type": "candy_multiplication",
            "groups": groups,
            "items_per_group": items_per_group,
            "item_name": tool_args["item_name"],
            "group_name": tool_args["group_name"],
            "total": groups * items_per_group,
        }
    if topic == "division":
        total_items = int(tool_args["total_items"])
        groups = int(tool_args["groups"])
        items_per_group = total_items // groups
        return {
            "type": "equal_division",
            "total_items": total_items,
            "groups": groups,
            "items_per_group": items_per_group,
            "remainder": total_items % groups,
            "item_name": tool_args["item_name"],
            "group_name": tool_args["group_name"],
        }
    if topic == "fraction_basic":
        numerator = int(tool_args["numerator"])
        denominator = int(tool_args["denominator"])
        return {
            "type": "fraction_pizza",
            "numerator": numerator,
            "denominator": denominator,
            "whole_name": tool_args["whole_name"],
            "fraction_text": f"{numerator}/{denominator}",
        }
    length = int(tool_args["length"])
    width = int(tool_args["width"])
    return {
        "type": "rectangle_measurement",
        "length": length,
        "width": width,
        "unit": tool_args["unit"],
        "mode": tool_args["mode"],
        "area": length * width,
        "perimeter": 2 * (length + width),
    }


def build_tutor_message(message: str, topic: Topic | None, grade: int) -> str:
    topic_hint = f" chủ đề '{topic}'" if topic else ""
    return (
        f"Học sinh lớp {grade} đang hỏi về{topic_hint}. "
        "Hãy đọc kỹ yêu cầu và trả lời đúng theo đó: "
        "nếu câu hỏi rõ, hãy giải thích ngắn gọn, thân thiện, dễ hiểu; "
        "nếu câu hỏi còn mơ hồ, hãy hỏi lại một câu ngắn gọn. "
        f"Câu hỏi: {message}"
    )


def normalize_answer(answer: str) -> str:
    cleaned = (answer or "").strip()
    if not cleaned:
        return "Cô chưa hiểu rõ câu hỏi của con. Con có thể nói cụ thể hơn không?"
    return cleaned


def is_low_signal_answer(answer: str) -> bool:
    """Chỉ bắt các error message của agent, để LLM answer thật sự đi qua."""
    error_phrases = {
        "hien tai minh chua xu ly duoc cau hoi nay. ban thu hoi lai ngan hon nhe.",
        "minh gap loi khi xu ly cau hoi. ban thu hoi lai ngan hon nhe.",
    }
    return answer.strip().lower() in error_phrases


def grade_to_level(grade: int) -> str:
    mapping = {1: "L1", 2: "L2", 3: "L3", 4: "L4", 5: "L5"}
    return mapping.get(grade, "L3")




def is_clarification_response(answer: str) -> bool:
    """Detect khi LLM đang hỏi lại học sinh (clarification)."""
    stripped = answer.strip()
    if not stripped:
        return False
    # LLM hỏi lại nếu: kết thúc bằng dấu ? và ngắn (< 200 ký tự)
    lines = [line.strip() for line in stripped.splitlines() if line.strip()]
    last_line = lines[-1] if lines else ""
    ends_with_question = last_line.endswith("?")
    is_short = len(stripped) < 250
    # Không có giải thích dài kèm theo
    no_numbered_steps = not any(line[:2] in ("1.", "2.", "3.") for line in lines)
    return ends_with_question and is_short and no_numbered_steps


def build_contextual_explanation(topic: Topic, tool_data: dict) -> str:
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
            + (f" va con du {tool_data['remainder']} vat." if tool_data["remainder"] else ".")
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


def build_follow_up_suggestions(topic: Topic, intent: str) -> list[str]:
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
