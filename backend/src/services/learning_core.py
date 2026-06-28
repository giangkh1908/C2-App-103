import random
from time import perf_counter
from uuid import uuid4

from src.agents.guardrails import guard_message
from src.core.metrics import record_cost_per_request, record_pipeline_latency
from src.agents.schemas import AgentResponse
from src.agents.tutor_agent import TutorAgent
from src.core.config import settings
from src.core.logging import get_logger
from src.models.chat import Topic
from src.services.context_detector import detect_context
from src.services.memory_repository import MemoryRepository
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

logger = get_logger("toan_truc_quan.learning_core")


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
        self.memory_repository = MemoryRepository()

    async def _record_llm_cost(self, user_id: str, agent_response: AgentResponse) -> None:
        """Record LLM cost from agent response usage after a successful call."""
        usage = agent_response.usage or {}
        prompt_tokens = int(usage.get("prompt_tokens", 0) or 0)
        completion_tokens = int(usage.get("completion_tokens", 0) or 0)
        if prompt_tokens == 0 and completion_tokens == 0:
            logger.info(
                "llm_cost_skipped_zero_tokens",
                user_id=user_id,
            )
            return

        from src.core.database import get_db
        from src.services.usage_service import UsageService

        logger.info(
            "recording_llm_cost",
            user_id=user_id,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            model=settings.openrouter_model,
        )
        db = get_db()
        await UsageService(db=db).record_llm_cost(
            user_id=user_id,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            model=settings.openrouter_model,
        )

    async def generate(self, request: LearningCoreRequest) -> LearningCoreResult:
        session_id = request.session_id or uuid4().hex

        # 1. Đọc lượt chat trước đó để thừa kế context (Topic, Bộ số cũ)
        prev_turn = None
        if session_id is not None:
            prev_turn = await self.session_repository.get_latest_turn(
                session_id,
                request.user_id,
            )

        # 2. Khôi phục Topic nếu request hiện tại gửi lên trống (do tải lại session cũ)
        current_selected_topic = request.selected_topic
        if not current_selected_topic and prev_turn:
            current_selected_topic = prev_turn.get("detected_topic") or prev_turn.get(
                "selected_topic"
            )

        context = build_default_context(current_selected_topic or "multiplication")

        guard_result = guard_message(request.message)

        if guard_result is not None:
            result = self._build_clarification_result(
                request=request,
                context=context,
                assistant_message=guard_result.response,
                session_id=session_id,
                agent_metadata={"guardrail": guard_result.category},
            )
            if session_id is not None:
                await self.memory_repository.append_turn(
                    session_id=session_id,
                    user_message=request.message,
                    assistant_message=result.assistant_message,
                )
            await self._persist(request, result)
            return result

        context = detect_context(
            request.message,
            current_selected_topic,
        )

        # 3. Kế thừa & Thay đổi bộ số khi học sinh yêu cầu "Ví dụ khác"
        if prev_turn and any(
            kw in request.message.lower()
            for kw in ["ví dụ khác", "vi du khac", "ví dụ mới", "vi du moi"]
        ):
            if not context.topic and prev_turn.get("detected_topic"):
                context.topic = prev_turn.get("detected_topic")

            old_visual = prev_turn.get("visual_snapshot") or {}
            old_data = old_visual.get("visual_data") or {}

            # Nếu AI hoặc Detector chưa tự tạo bộ số mới, ta chủ động gán bộ số mới khác số cũ
            if not context.tool_args or len(context.tool_args) <= 1:
                if context.topic == "multiplication":
                    old_g = int(old_data.get("primary_count") or 3)
                    old_i = int(old_data.get("secondary_count") or 4)
                    context.tool_args = {
                        "groups": old_g + 1 if old_g < 6 else 2,
                        "items_per_group": old_i - 1 if old_i > 2 else 5,
                        "item_name": "cái kẹo",
                        "group_name": "chiếc đĩa",
                    }
                elif context.topic == "division":
                    context.tool_args = {
                        "total_items": 16,
                        "groups": 4,
                        "item_name": "quả táo",
                        "group_name": "bạn",
                    }
                elif context.topic == "fraction_basic":
                    context.tool_args = {
                        "numerator": 3,
                        "denominator": 8,
                        "whole_name": "chiếc pizza",
                    }
                elif context.topic == "perimeter_area_basic":
                    context.tool_args = {
                        "length": 6,
                        "width": 4,
                        "unit": "cm",
                        "mode": "area_grid",
                    }

        history_payload = None
        if session_id is not None:
            history_messages = await self.memory_repository.load_messages(session_id)
            history_payload = [
                {"role": msg.role, "content": msg.content} for msg in history_messages
            ]

        if context.topic is None:
            agent_response = await self.tutor_agent.chat(
                message=build_tutor_message(request.message, None, request.grade),
                level=grade_to_level(request.grade),
                use_tools=True,
                history=history_payload,
            )
            await self._record_llm_cost(request.user_id, agent_response)
            agent_metadata = {
                "tool_used": agent_response.tool_used,
                "step_count": len(agent_response.steps),
                "visual_source": None,
            }
            answer = normalize_answer(agent_response.answer)
            response_source = "llm"

            if is_clarification_response(answer):
                clarification_result = self._build_clarification_result(
                    request=request,
                    context=context,
                    assistant_message=answer,
                    session_id=session_id,
                    agent_metadata=agent_metadata,
                )
                if session_id is not None:
                    await self.memory_repository.append_turn(
                        session_id=session_id,
                        user_message=request.message,
                        assistant_message=clarification_result.assistant_message,
                    )
                await self._persist(request, clarification_result)
                return clarification_result
            else:
                default_topic = request.selected_topic or "multiplication"
                context = build_default_context(default_topic)
                if agent_response.visual_data:
                    tool_data = agent_response.visual_data
                    agent_metadata["visual_source"] = "agent"
                else:
                    tool_data = build_default_tool_data(default_topic, context.tool_args)
                    agent_metadata["visual_source"] = "fallback"
                result = self._build_result(
                    request=request,
                    context=context,
                    tool_data=tool_data,
                    assistant_message=answer,
                    response_source=response_source,
                    response_mode="explain_only",
                    follow_up_suggestions=[
                        "Con muốn học phép nhân.",
                        "Con muốn học phép chia.",
                        "Con muốn học phân số.",
                        "Con muốn học chu vi và diện tích.",
                    ],
                    session_id=session_id,
                    agent_metadata=agent_metadata,
                )
                if session_id is not None:
                    await self.memory_repository.append_turn(
                        session_id=session_id,
                        user_message=request.message,
                        assistant_message=result.assistant_message,
                    )
                await self._persist(request, result)
                return result

        agent_response = await self.tutor_agent.chat(
            message=build_tutor_message(request.message, context.topic, request.grade),
            level=grade_to_level(request.grade),
            use_tools=True,
            history=history_payload,
        )
        await self._record_llm_cost(request.user_id, agent_response)
        agent_metadata = {
            "tool_used": agent_response.tool_used,
            "step_count": len(agent_response.steps),
            "visual_source": None,
        }
        answer = normalize_answer(agent_response.answer)
        response_source = "llm"

        if is_clarification_response(answer):
            context.tool_args = build_random_tool_args(context.topic)
            tool_data = build_default_tool_data(context.topic, context.tool_args)
            result = self._build_result(
                request=request,
                context=context,
                tool_data=tool_data,
                assistant_message=build_contextual_explanation(context.topic, tool_data),
                response_source="fallback",
                response_mode="explain_with_visual_and_practice",
                follow_up_suggestions=build_follow_up_suggestions(context.topic, context.intent),
                session_id=session_id,
                agent_metadata=agent_metadata,
            )
            if session_id is not None:
                await self.memory_repository.append_turn(
                    session_id=session_id,
                    user_message=request.message,
                    assistant_message=result.assistant_message,
                )
            await self._persist(request, result)
            return result

        if (
            agent_response.visual_data
            and isinstance(agent_response.visual_data, dict)
            and len(agent_response.visual_data) > 0
        ):
            tool_data = agent_response.visual_data
            response_source = "agent"
            agent_metadata["visual_source"] = "agent"
        else:
            tool_result = await self.tool_registry.call(
                context.tool_name or "",
                context.tool_args,
            )
            if not tool_result.success:
                tool_data = build_default_tool_data(context.topic, context.tool_args)
                response_source = "fallback"
                agent_metadata["visual_source"] = "fallback"
            else:
                tool_data = tool_result.data
                agent_metadata["visual_source"] = "legacy"

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
            session_id=session_id,
            agent_metadata=agent_metadata,
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
                session_id=session_id,
                agent_metadata=agent_metadata,
            )
            validate_learning_core_result(result)
            lesson_resp = to_lesson_response(result)
            if lesson_resp is not None:
                validate_lesson_response(lesson_resp)

        if session_id is not None:
            await self.memory_repository.append_turn(
                session_id=session_id,
                user_message=request.message,
                assistant_message=result.assistant_message,
            )

        await self._persist(request, result)
        return result

    async def generate_stream(self, request: LearningCoreRequest):
        """Streaming variant of generate().

        Yields ("chunk", str) for each text token from the LLM, then
        ("done", LearningCoreResult) with the fully-assembled result.
        """
        pipeline_start = perf_counter()

        from src.core.metrics import get_metrics
        tokens_before = get_metrics()["llm"]["tokens_total"]

        agent_metadata: dict | None = None

        _COST_PER_1K: dict[str, float] = {
            "deepseek/deepseek-v4-flash": 0.00014,
            "openai/gpt-4o-mini": 0.00060,
            "openai/gpt-4o": 0.00500,
        }
        _model_name: str = settings.openrouter_model

        def _record_stream_metrics(meta: dict | None = None) -> None:
            pipeline_ms = round((perf_counter() - pipeline_start) * 1000, 2)
            record_pipeline_latency(pipeline_ms)
            tokens_now = get_metrics()["llm"]["tokens_total"]
            tokens_used = max(0, tokens_now - tokens_before)
            cost = (tokens_used / 1000.0) * _COST_PER_1K.get(_model_name, 0.0)
            record_cost_per_request(cost)

        session_id = request.session_id or uuid4().hex

        prev_turn = None
        if session_id is not None:
            prev_turn = await self.session_repository.get_latest_turn(session_id, request.user_id)

        current_selected_topic = request.selected_topic
        if not current_selected_topic and prev_turn:
            current_selected_topic = prev_turn.get("detected_topic") or prev_turn.get(
                "selected_topic"
            )

        context = build_default_context(current_selected_topic or "multiplication")

        guard_result = guard_message(request.message)
        if guard_result is not None:
            result = self._build_clarification_result(
                request=request,
                context=context,
                assistant_message=guard_result.response,
                session_id=session_id,
                agent_metadata={"guardrail": guard_result.category},
            )
            if session_id is not None:
                await self.memory_repository.append_turn(
                    session_id=session_id,
                    user_message=request.message,
                    assistant_message=result.assistant_message,
                )
            await self._persist(request, result)
            _record_stream_metrics(agent_metadata)
            yield ("chunk", result.assistant_message)
            yield ("done", result)
            return

        context = detect_context(request.message, current_selected_topic)

        if prev_turn and any(
            kw in request.message.lower()
            for kw in ["ví dụ khác", "vi du khac", "ví dụ mới", "vi du moi"]
        ):
            if not context.topic and prev_turn.get("detected_topic"):
                context.topic = prev_turn.get("detected_topic")

            old_visual = prev_turn.get("visual_snapshot") or {}
            old_data = old_visual.get("visual_data") or {}

            if not context.tool_args or len(context.tool_args) <= 1:
                if context.topic == "multiplication":
                    old_g = int(old_data.get("primary_count") or 3)
                    old_i = int(old_data.get("secondary_count") or 4)
                    context.tool_args = {
                        "groups": old_g + 1 if old_g < 6 else 2,
                        "items_per_group": old_i - 1 if old_i > 2 else 5,
                        "item_name": "cái kẹo",
                        "group_name": "chiếc đĩa",
                    }
                elif context.topic == "division":
                    context.tool_args = {
                        "total_items": 16,
                        "groups": 4,
                        "item_name": "quả táo",
                        "group_name": "bạn",
                    }
                elif context.topic == "fraction_basic":
                    context.tool_args = {
                        "numerator": 3,
                        "denominator": 8,
                        "whole_name": "chiếc pizza",
                    }
                elif context.topic == "perimeter_area_basic":
                    context.tool_args = {
                        "length": 6,
                        "width": 4,
                        "unit": "cm",
                        "mode": "area_grid",
                    }

        history_payload = None
        if session_id is not None:
            history_messages = await self.memory_repository.load_messages(session_id)
            history_payload = [
                {"role": msg.role, "content": msg.content} for msg in history_messages
            ]

        # ── Stream agent response ──────────────────────────────────────────────
        tutor_message = build_tutor_message(
            request.message,
            None if context.topic is None else context.topic,
            request.grade,
        )
        level = grade_to_level(request.grade)

        agent_response_holder: list = []
        async for event_type, payload in self.tutor_agent.chat_stream(
            message=tutor_message,
            level=level,
            use_tools=True,
            history=history_payload,
        ):
            if event_type == "chunk":
                yield ("chunk", payload)
            elif event_type == "done":
                agent_response_holder.append(payload)

        agent_response = (
            agent_response_holder[0] if agent_response_holder else AgentResponse(answer="")
        )
        await self._record_llm_cost(request.user_id, agent_response)
        agent_metadata = {
            "tool_used": agent_response.tool_used,
            "step_count": len(agent_response.steps),
            "visual_source": None,
        }
        answer = normalize_answer(agent_response.answer)
        response_source = "llm"

        # ── Post-processing (mirrors generate()) ───────────────────────────────
        if context.topic is None:
            if is_clarification_response(answer):
                clarification_result = self._build_clarification_result(
                    request=request,
                    context=context,
                    assistant_message=answer,
                    session_id=session_id,
                    agent_metadata=agent_metadata,
                )
                if session_id is not None:
                    await self.memory_repository.append_turn(
                        session_id=session_id,
                        user_message=request.message,
                        assistant_message=clarification_result.assistant_message,
                    )
                await self._persist(request, clarification_result)
                _record_stream_metrics(agent_metadata)
                yield ("done", clarification_result)
                return

            default_topic = request.selected_topic or "multiplication"
            context = build_default_context(default_topic)
            if agent_response.visual_data:
                tool_data = agent_response.visual_data
                agent_metadata["visual_source"] = "agent"
            else:
                tool_data = build_default_tool_data(default_topic, context.tool_args)
                agent_metadata["visual_source"] = "fallback"
            result = self._build_result(
                request=request,
                context=context,
                tool_data=tool_data,
                assistant_message=answer,
                response_source=response_source,
                response_mode="explain_only",
                follow_up_suggestions=[
                    "Con muốn học phép nhân.",
                    "Con muốn học phép chia.",
                    "Con muốn học phân số.",
                    "Con muốn học chu vi và diện tích.",
                ],
                session_id=session_id,
                agent_metadata=agent_metadata,
            )
            if session_id is not None:
                await self.memory_repository.append_turn(
                    session_id=session_id,
                    user_message=request.message,
                    assistant_message=result.assistant_message,
                )
            await self._persist(request, result)
            _record_stream_metrics(agent_metadata)
            yield ("done", result)
            return

        if is_clarification_response(answer):
            context.tool_args = build_random_tool_args(context.topic)
            tool_data = build_default_tool_data(context.topic, context.tool_args)
            result = self._build_result(
                request=request,
                context=context,
                tool_data=tool_data,
                assistant_message=build_contextual_explanation(context.topic, tool_data),
                response_source="fallback",
                response_mode="explain_with_visual_and_practice",
                follow_up_suggestions=build_follow_up_suggestions(context.topic, context.intent),
                session_id=session_id,
                agent_metadata=agent_metadata,
            )
            if session_id is not None:
                await self.memory_repository.append_turn(
                    session_id=session_id,
                    user_message=request.message,
                    assistant_message=result.assistant_message,
                )
            await self._persist(request, result)
            _record_stream_metrics(agent_metadata)
            yield ("done", result)
            return

        if (
            agent_response.visual_data
            and isinstance(agent_response.visual_data, dict)
            and len(agent_response.visual_data) > 0
        ):
            tool_data = agent_response.visual_data
            response_source = "agent"
            agent_metadata["visual_source"] = "agent"
        else:
            tool_result = await self.tool_registry.call(
                context.tool_name or "",
                context.tool_args,
            )
            if not tool_result.success:
                tool_data = build_default_tool_data(context.topic, context.tool_args)
                response_source = "fallback"
                agent_metadata["visual_source"] = "fallback"
            else:
                tool_data = tool_result.data
                agent_metadata["visual_source"] = "legacy"

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
            session_id=session_id,
            agent_metadata=agent_metadata,
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
                session_id=session_id,
                agent_metadata=agent_metadata,
            )
            validate_learning_core_result(result)
            lesson_resp = to_lesson_response(result)
            if lesson_resp is not None:
                validate_lesson_response(lesson_resp)

        if session_id is not None:
            await self.memory_repository.append_turn(
                session_id=session_id,
                user_message=request.message,
                assistant_message=result.assistant_message,
            )

        await self._persist(request, result)
        _record_stream_metrics(agent_metadata)
        yield ("done", result)

    def _build_clarification_result(
        self,
        request: LearningCoreRequest,
        context: LearningContext,
        assistant_message: str,
        session_id: str,
        agent_metadata: dict | None = None,
    ) -> LearningCoreResult:
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
                session_id=session_id or uuid4().hex,
                provider=settings.llm_provider,
                response_source="llm",
            ),
            agent_metadata=agent_metadata,
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
        session_id: str,
        agent_metadata: dict | None = None,
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
                session_id=session_id or uuid4().hex,
                provider=settings.llm_provider,
                response_source=response_source,
            ),
            agent_metadata=agent_metadata,
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


def build_random_tool_args(topic: Topic) -> dict[str, int | str]:
    if topic == "multiplication":
        groups = random.randint(2, 6)
        items = random.randint(2, 6)
        item = random.choice(["cái kẹo", "quả táo", "bông hoa", "chiếc bút"])
        group = random.choice(["chiếc đĩa", "chiếc rổ", "nhóm bạn", "chiếc hộp"])
        return {"groups": groups, "items_per_group": items, "item_name": item, "group_name": group}
    if topic == "division":
        groups = random.randint(2, 5)
        items_per_group = random.randint(2, 5)
        item = random.choice(["quả táo", "cái kẹo", "bông hoa"])
        group = random.choice(["bạn", "nhóm", "chiếc hộp"])
        return {
            "total_items": groups * items_per_group,
            "groups": groups,
            "item_name": item,
            "group_name": group,
        }
    if topic == "fraction_basic":
        denominator = random.randint(4, 8)
        numerator = random.randint(1, denominator - 1)
        whole = random.choice(["chiếc pizza", "chiếc bánh", "tờ giấy"])
        return {"numerator": numerator, "denominator": denominator, "whole_name": whole}
    if topic == "perimeter_area_basic":
        length = random.randint(3, 8)
        width = random.randint(2, min(length, 6))
        mode = random.choice(["area_grid", "perimeter_path"])
        return {"length": length, "width": width, "unit": "cm", "mode": mode}
    return {"groups": 3, "items_per_group": 4, "item_name": "vật", "group_name": "nhóm"}


def build_default_tool_data(topic: Topic, tool_args: dict[str, int | str]) -> dict:
    # Sử dụng .get() để tránh hoàn toàn lỗi KeyError khi sinh dữ liệu mặc định
    if topic == "multiplication":
        groups = int(tool_args.get("groups") or 3)
        items_per_group = int(tool_args.get("items_per_group") or 4)
        return {
            "type": "candy_multiplication",
            "groups": groups,
            "items_per_group": items_per_group,
            "item_name": tool_args.get("item_name") or "cái kẹo",
            "group_name": tool_args.get("group_name") or "chiếc đĩa",
            "total": groups * items_per_group,
        }
    if topic == "division":
        total_items = int(tool_args.get("total_items") or 12)
        groups = int(tool_args.get("groups") or 3)
        items_per_group = total_items // groups if groups else 4
        return {
            "type": "equal_division",
            "total_items": total_items,
            "groups": groups,
            "items_per_group": items_per_group,
            "remainder": total_items % groups if groups else 0,
            "item_name": tool_args.get("item_name") or "quả táo",
            "group_name": tool_args.get("group_name") or "bạn",
        }
    if topic == "fraction_basic":
        numerator = int(tool_args.get("numerator") or 1)
        denominator = int(tool_args.get("denominator") or 4)
        return {
            "type": "fraction_pizza",
            "numerator": numerator,
            "denominator": denominator,
            "whole_name": tool_args.get("whole_name") or "chiếc pizza",
            "fraction_text": f"{numerator}/{denominator}",
        }
    length = int(tool_args.get("length") or 5)
    width = int(tool_args.get("width") or 3)
    return {
        "type": "rectangle_measurement",
        "length": length,
        "width": width,
        "unit": tool_args.get("unit") or "cm",
        "mode": tool_args.get("mode") or "area_grid",
        "area": length * width,
        "perimeter": 2 * (length + width),
    }


def build_tutor_message(message: str, topic: Topic | None, grade: int) -> str:
    topic_hint = f" chủ đề '{topic}'" if topic else ""
    if topic:
        vague_hint = "nếu câu hỏi không có số liệu cụ thể, hãy tự chọn số ngẫu nhiên phù hợp và giải thích ngay"
    else:
        vague_hint = "nếu câu hỏi còn mơ hồ về chủ đề, hãy hỏi lại một câu ngắn gọn"
    return (
        f"Học sinh lớp {grade} đang hỏi về{topic_hint}. "
        "Hãy đọc kỹ yêu cầu và trả lời đúng theo đó: "
        "nếu câu hỏi rõ, hãy giải thích ngắn gọn, thân thiện, dễ hiểu; "
        f"{vague_hint}. "
        f"Câu hỏi: {message}"
    )


def normalize_answer(answer: str) -> str:
    cleaned = (answer or "").strip()
    if not cleaned:
        return "Cô chưa hiểu rõ câu hỏi của con. Con có thể nói cụ thể hơn không?"
    return cleaned


def is_low_signal_answer(answer: str) -> bool:
    error_phrases = {
        "hien tai minh chua xu ly duoc cau hoi nay. ban thu hoi lai ngan hon nhe.",
        "minh gap loi khi xu ly cau hoi. ban thu hoi lai ngan hon nhe.",
    }
    return answer.strip().lower() in error_phrases


def grade_to_level(grade: int) -> str:
    mapping = {1: "L1", 2: "L2", 3: "L3", 4: "L4", 5: "L5"}
    return mapping.get(grade, "L3")


def is_clarification_response(answer: str) -> bool:
    stripped = answer.strip()
    if not stripped:
        return False
    lines = [line.strip() for line in stripped.splitlines() if line.strip()]
    last_line = lines[-1] if lines else ""
    ends_with_question = last_line.endswith("?")
    is_short = len(stripped) < 250
    no_numbered_steps = not any(line[:2] in ("1.", "2.", "3.") for line in lines)
    return ends_with_question and is_short and no_numbered_steps


def build_contextual_explanation(topic: Topic, tool_data: dict) -> str:
    if topic == "multiplication":
        return (
            f"Con có {tool_data.get('groups', 3)} nhóm và mỗi nhóm có "
            f"{tool_data.get('items_per_group', 4)} vật. "
            f"Mình cộng {tool_data.get('items_per_group', 4)} lặp lại "
            f"{tool_data.get('groups', 3)} lần, "
            f"nên được {tool_data.get('total', 12)}."
        )
    if topic == "division":
        return (
            f"Con lấy {tool_data.get('total_items', 12)} vật chia đều cho "
            f"{tool_data.get('groups', 3)} nhóm. "
            f"Mỗi nhóm nhận {tool_data.get('items_per_group', 4)} vật"
            + (f" và còn dư {tool_data['remainder']} vật." if tool_data.get("remainder") else ".")
        )
    if topic == "fraction_basic":
        return (
            f"Phân số {tool_data.get('fraction_text', '1/4')} nghĩa là lấy "
            f"{tool_data.get('numerator', 1)} phần "
            f"trong tổng {tool_data.get('denominator', 4)} phần bằng nhau."
        )
    return (
        f"Hình chữ nhật dài {tool_data.get('length', 5)} và rộng {tool_data.get('width', 3)}. "
        f"Diện tích là {tool_data.get('area', 15)} ô vuông, còn chu vi là "
        f"{tool_data.get('perimeter', 16)} đơn vị."
    )


def build_follow_up_suggestions(topic: Topic, intent: str) -> list[str]:
    if topic == "division":
        return [
            "Vì sao chia đều lại ra đáp án này?",
            "Cho con thêm một ví dụ chia.",
            "Cho con xem hình minh họa.",
        ]
    if topic == "fraction_basic":
        return [
            "Vì sao phân số này lớn hơn?",
            "Cho con ví dụ khác về pizza.",
            "Giải thích ngắn hơn được không?",
        ]
    if topic == "perimeter_area_basic":
        return [
            "Phân biệt chu vi và diện tích.",
            "Cho con hình minh họa khác.",
            "Vì sao phải nhân chiều dài với chiều rộng?",
        ]
    if topic == "multiplication":
        return [
            "Vì sao đây là phép nhân?",
            "Cho con thêm một ví dụ nhóm đều.",
            "Giải thích dễ hơn được không?",
        ]
    if intent == "show_visual":
        return [
            "Cho con hình minh họa nhé.",
            "Giải thích bằng đồ vật quen thuộc.",
            "Cho con một bài tập nhanh.",
        ]
    return [
        "Giải thích dễ hơn được không?",
        "Cho con một ví dụ khác.",
        "Cho con một bài tập nhỏ nhé.",
    ]
