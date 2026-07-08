import random
import re
import unicodedata
from time import perf_counter
from uuid import uuid4

from src.agents.guardrails import guard_message
from src.agents.schemas import AgentResponse
from src.agents.tutor_agent import TutorAgent
from src.core.config import settings
from src.core.logging import get_logger
from src.core.metrics import (
    record_cost_per_request,
    record_guardrail_block,
    record_pipeline_latency,
)
from src.models.chat import Topic
from src.services.context_detector import detect_context
from src.services.curriculum_adapter import (
    RUNTIME_TOPIC_BY_CURRICULUM_TOPIC,
    SCOPE_KEYWORDS_BY_CURRICULUM_TOPIC,
    build_grade1_curriculum_result,
)
from src.services.llm_audit import current_user_id
from src.services.memory_repository import MemoryRepository
from src.services.output_guard import validate_assistant_output
from src.services.practice_builder import build_practice_questions
from src.services.response_mapper import to_chat_response, to_lesson_response
from src.services.session_repository import SessionRepository
from src.services.types import (
    LearningContext,
    LearningCoreRequest,
    LearningCoreResult,
    LearningPersistencePayload,
    ResponseSource,
    SessionMetadata,
)
from src.services.validation import (
    validate_final_response_contract,
    validate_learning_core_result,
    validate_lesson_response,
)
from src.services.visual_builder import build_visual_bundle
from src.tools.registry import ToolRegistry


def _normalize_text_legacy_keyword_v0(text: str) -> str:
    """Normalize Vietnamese text: lowercase, strip accents, replace đ→d."""
    nfkd = unicodedata.normalize("NFKD", text.lower())
    stripped = "".join(ch for ch in nfkd if unicodedata.category(ch) != "Mn")
    return stripped.replace("đ", "d")


def detect_curriculum_topic_legacy_keyword_v0(message: str, grade: int) -> str | None:
    """Auto-detect which curriculum topic a message belongs to for a grade.

    Uses keyword matching with heuristic scoring to pick the best topic.
    Returns a G1-* or G2-* topic ID or None if no topic matches.
    """
    normalized = _normalize_text(message)
    scores: dict[str, int] = {}
    topic_prefix = f"G{grade}-"

    for topic_id, keywords in SCOPE_KEYWORDS_BY_CURRICULUM_TOPIC.items():
        if not topic_id.startswith(topic_prefix):
            continue
        score = sum(1 for kw in keywords if kw in normalized)
        if score > 0:
            scores[topic_id] = score

    if not scores:
        return None

    # ── Heuristic exclusions (override when keywords overlap) ──────
    # "tinh nham" / "nhanh" → G1-OPS-02 takes priority over G1-OPS-01
    if "tinh nham" in normalized or "khung 10" in normalized or "nhanh" in normalized:
        scores["G1-OPS-02"] = scores.get("G1-OPS-02", 0) + 3
        scores["G1-OPS-01"] = max(0, scores.get("G1-OPS-01", 0) - 1)

    # "so sanh" / "lon hon" / "be hon" → G1-NUM-02 takes priority
    if "so sanh" in normalized or "lon hon" in normalized or "be hon" in normalized:
        scores["G1-NUM-02"] = scores.get("G1-NUM-02", 0) + 3
        scores["G1-NUM-01"] = max(0, scores.get("G1-NUM-01", 0) - 1)

    # "bai toan" / "loi van" / story patterns → G1-WORD-01 priority
    if "bai toan" in normalized or "loi van" in normalized:
        scores["G1-WORD-01"] = scores.get("G1-WORD-01", 0) + 3
    # Story pattern: "co ... me cho" / "co ... ban cho" / "co ... con lai"
    if (
        "me cho" in normalized
        or "ban cho" in normalized
        or "con lai" in normalized
        or "tom tat" in normalized
        or "so do" in normalized
    ):
        scores["G1-WORD-01"] = scores.get("G1-WORD-01", 0) + 2
        scores["G1-OPS-01"] = max(0, scores.get("G1-OPS-01", 0) - 1)

    # "ghep hinh" / "xep hinh" → G1-GEO-03 over G1-GEO-02
    if "ghep" in normalized or "xep" in normalized:
        scores["G1-GEO-03"] = scores.get("G1-GEO-03", 0) + 2
        scores["G1-GEO-02"] = max(0, scores.get("G1-GEO-02", 0) - 1)

    # "do dai" / "thuoc" / "cm" → G1-MEAS-02 over G1-MEAS-01
    if "do dai" in normalized or "thuoc" in normalized or "cm" in normalized:
        scores["G1-MEAS-02"] = scores.get("G1-MEAS-02", 0) + 2
        scores["G1-MEAS-01"] = max(0, scores.get("G1-MEAS-01", 0) - 1)

    # "dong ho" / "gio dung" / "thu" / "tuan" → G1-MEAS-01 (time/calendar)
    if (
        "dong ho" in normalized
        or "gio dung" in normalized
        or "thu " in normalized
        or "tuan" in normalized
    ):
        scores["G1-MEAS-01"] = scores.get("G1-MEAS-01", 0) + 2
        scores["G1-MEAS-02"] = max(0, scores.get("G1-MEAS-02", 0) - 1)

    # "tia so" alone → G1-NUM-02 or G1-OPS-02, not G1-NUM-01
    if "tia so" in normalized:
        scores["G1-NUM-02"] = scores.get("G1-NUM-02", 0) + 1
        scores["G1-OPS-02"] = scores.get("G1-OPS-02", 0) + 1

    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else None


def _normalize_text_legacy_g1(text: str) -> str:
    """Normalize Vietnamese text for keyword matching."""
    lowered = text.lower().replace("đ", "d").replace("Đ", "d")
    nfkd = unicodedata.normalize("NFKD", lowered)
    return "".join(ch for ch in nfkd if unicodedata.category(ch) != "Mn")


def detect_curriculum_topic_legacy_g1(message: str, grade: int) -> str | None:
    """Auto-detect which curriculum topic a message belongs to for a grade."""
    normalized = _normalize_text_legacy_g1(message)
    scores: dict[str, int] = {}
    topic_prefix = f"G{grade}-"

    for topic_id, keywords in SCOPE_KEYWORDS_BY_CURRICULUM_TOPIC.items():
        if not topic_id.startswith(topic_prefix):
            continue
        score = sum(1 for kw in keywords if kw in normalized)
        if score > 0:
            scores[topic_id] = score

    if not scores:
        return None

    fast_ops_topic = "G2-OPS-03" if grade == 2 else "G1-OPS-02"
    base_ops_topic = f"G{grade}-OPS-01"
    compare_topic = f"G{grade}-NUM-02"
    build_number_topic = f"G{grade}-NUM-01"
    word_topic = f"G{grade}-WORD-01"
    compose_topic = "G2-GEO-02" if grade == 2 else "G1-GEO-03"
    shape_topic = "G2-GEO-01" if grade == 2 else "G1-GEO-02"
    time_topic = "G2-MEAS-01" if grade == 2 else "G1-MEAS-01"
    length_topic = "G2-MEAS-02" if grade == 2 else "G1-MEAS-02"

    if "tinh nham" in normalized or "khung 10" in normalized or "nhanh" in normalized:
        scores[fast_ops_topic] = scores.get(fast_ops_topic, 0) + 3
        scores[base_ops_topic] = max(0, scores.get(base_ops_topic, 0) - 1)

    if "so sanh" in normalized or "lon hon" in normalized or "be hon" in normalized:
        scores[compare_topic] = scores.get(compare_topic, 0) + 3
        scores[build_number_topic] = max(0, scores.get(build_number_topic, 0) - 1)

    if "bai toan" in normalized or "loi van" in normalized:
        scores[word_topic] = scores.get(word_topic, 0) + 3
    if (
        "me cho" in normalized
        or "ban cho" in normalized
        or "con lai" in normalized
        or "tom tat" in normalized
        or "so do" in normalized
    ):
        scores[word_topic] = scores.get(word_topic, 0) + 2
        scores[base_ops_topic] = max(0, scores.get(base_ops_topic, 0) - 1)

    if "ghep" in normalized or "xep" in normalized:
        scores[compose_topic] = scores.get(compose_topic, 0) + 2
        scores[shape_topic] = max(0, scores.get(shape_topic, 0) - 1)

    if "do dai" in normalized or "thuoc" in normalized or "cm" in normalized:
        scores[length_topic] = scores.get(length_topic, 0) + 2
        scores[time_topic] = max(0, scores.get(time_topic, 0) - 1)

    if (
        "dong ho" in normalized
        or "gio dung" in normalized
        or "thu " in normalized
        or "tuan" in normalized
    ):
        scores[time_topic] = scores.get(time_topic, 0) + 2
        scores[length_topic] = max(0, scores.get(length_topic, 0) - 1)

    if "tia so" in normalized:
        scores[compare_topic] = scores.get(compare_topic, 0) + 1
        scores[fast_ops_topic] = scores.get(fast_ops_topic, 0) + 1

    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else None


def _normalize_text(text: str) -> str:
    """Normalize Vietnamese text for curriculum keyword matching."""
    text = text.replace("\u0111", "d").replace("\u0110", "d")
    lowered = text.lower().replace("đ", "d").replace("Đ", "d")
    nfkd = unicodedata.normalize("NFKD", lowered)
    stripped = "".join(ch for ch in nfkd if unicodedata.category(ch) != "Mn")
    return stripped.replace("đ", "d")


def _has_compare_signal(message: str, normalized: str, numbers: list[int]) -> bool:
    raw_lower = message.lower()
    compare_phrases = (
        "so sánh",
        "so sanh",
        "lớn hơn",
        "lon hon",
        "bé hơn",
        "be hon",
        "bằng nhau",
        "bang nhau",
    )
    if any(phrase in raw_lower for phrase in compare_phrases):
        return True
    if any(token in normalized for token in ("so sanh", "lon hon", "be hon", "bang nhau")):
        return True
    if len(numbers) >= 2 and re.search(r"\d+\s*(?:>=|<=|>|<|=)\s*\d+", raw_lower):
        return True
    if (
        len(numbers) >= 2
        and normalized.startswith("so ")
        and not _has_place_value_signal(normalized)
    ):
        return True
    return False


def _has_place_value_signal(normalized: str) -> bool:
    return any(
        token in normalized
        for token in ("may chuc", "may don vi", "may tram", "gom may", "chuc va don vi")
    )


def detect_curriculum_topic(message: str, grade: int) -> str | None:
    """Auto-detect which curriculum topic a message belongs to for a grade."""
    normalized = _normalize_text(message)
    scores: dict[str, int] = {}
    topic_prefix = f"G{grade}-"
    numbers = [int(item) for item in re.findall(r"\d+", normalized)]
    has_addition_or_subtraction = bool(re.search(r"\d+\s*[+-]\s*\d+", normalized))

    for topic_id, keywords in SCOPE_KEYWORDS_BY_CURRICULUM_TOPIC.items():
        if not topic_id.startswith(topic_prefix):
            continue
        score = sum(1 for kw in keywords if kw in normalized)
        if score > 0:
            scores[topic_id] = score

    fast_ops_topic = "G2-OPS-03" if grade == 2 else "G1-OPS-02"
    base_ops_topic = f"G{grade}-OPS-01"
    compare_topic = f"G{grade}-NUM-02"
    build_number_topic = f"G{grade}-NUM-01"
    word_topic = f"G{grade}-WORD-01"
    compose_topic = "G2-GEO-02" if grade == 2 else "G1-GEO-03"
    shape_topic = "G2-GEO-01" if grade == 2 else "G1-GEO-02"
    time_topic = "G2-MEAS-01" if grade == 2 else "G1-MEAS-01"
    length_topic = "G2-MEAS-02" if grade == 2 else "G1-MEAS-02"

    if "tinh nham" in normalized or "khung 10" in normalized or "nhanh" in normalized:
        scores[fast_ops_topic] = scores.get(fast_ops_topic, 0) + 3
        scores[base_ops_topic] = max(0, scores.get(base_ops_topic, 0) - 1)

    if _has_compare_signal(message, normalized, numbers):
        scores[compare_topic] = scores.get(compare_topic, 0) + 3
        scores[build_number_topic] = max(0, scores.get(build_number_topic, 0) - 1)

    if _has_place_value_signal(normalized):
        scores[build_number_topic] = scores.get(build_number_topic, 0) + 3
        scores[compare_topic] = max(0, scores.get(compare_topic, 0) - 1)

    if "bai toan" in normalized or "loi van" in normalized:
        scores[word_topic] = scores.get(word_topic, 0) + 3
    if any(token in normalized for token in ("me cho", "ban cho", "con lai", "tom tat", "so do")):
        scores[word_topic] = scores.get(word_topic, 0) + 2
        scores[base_ops_topic] = max(0, scores.get(base_ops_topic, 0) - 1)

    if "ghep" in normalized or "xep" in normalized:
        scores[compose_topic] = scores.get(compose_topic, 0) + 2
        scores[shape_topic] = max(0, scores.get(shape_topic, 0) - 1)

    if "do dai" in normalized or "thuoc" in normalized or "cm" in normalized:
        scores[length_topic] = scores.get(length_topic, 0) + 2
        scores[time_topic] = max(0, scores.get(time_topic, 0) - 1)

    if (
        "dong ho" in normalized
        or "gio dung" in normalized
        or "thu " in normalized
        or "tuan" in normalized
    ):
        scores[time_topic] = scores.get(time_topic, 0) + 2
        scores[length_topic] = max(0, scores.get(length_topic, 0) - 1)

    if "tia so" in normalized:
        scores[compare_topic] = scores.get(compare_topic, 0) + 1
        scores[fast_ops_topic] = scores.get(fast_ops_topic, 0) + 1

    if has_addition_or_subtraction and len(numbers) >= 2:
        larger_operand = max(numbers[:2])
        if grade == 1 and larger_operand <= 20:
            scores[fast_ops_topic] = scores.get(fast_ops_topic, 0) + 3
        elif grade == 2 and larger_operand <= 100:
            scores[fast_ops_topic] = scores.get(fast_ops_topic, 0) + 2
        else:
            scores[base_ops_topic] = scores.get(base_ops_topic, 0) + 2

    if not scores:
        return None

    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else None


logger = get_logger("toan_truc_quan.learning_core")
RECENT_SESSION_WINDOW = 5
TOPIC_TOOL_DATA_TYPE: dict[Topic, str] = {
    "multiplication": "candy_multiplication",
    "division": "equal_division",
    "fraction_basic": "fraction_pizza",
    "perimeter_area_basic": "rectangle_measurement",
    "data_representation": "bar_chart",
    "addition_subtraction": "addition_subtraction",
    "comparison_numbers": "number_comparison",
    "time_clock": "clock_reading",
    "measurement_length": "length_comparison",
}
FOLLOW_UP_EXAMPLE_LABELS: dict[Topic, dict[str, int | str]] = {
    "multiplication": {
        "item_name": "cái kẹo",
        "group_name": "chiếc đĩa",
    },
    "division": {
        "item_name": "quả táo",
        "group_name": "bạn",
    },
    "fraction_basic": {
        "whole_name": "chiếc pizza",
    },
}


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

    async def _persist_turn_if_needed(
        self,
        *,
        session_id: str | None,
        user_message: str,
        assistant_message: str,
    ) -> None:
        if session_id is None:
            return
        await self.memory_repository.append_turn(
            session_id=session_id,
            user_message=user_message,
            assistant_message=assistant_message,
        )

    async def _load_recent_session_turns(
        self,
        *,
        session_id: str | None,
        user_id: str,
    ) -> list[dict]:
        if session_id is None:
            return []
        try:
            return await self.session_repository.get_recent_turns(
                session_id,
                user_id,
                limit=RECENT_SESSION_WINDOW,
            )
        except RuntimeError:
            logger.info(
                "recent_turns_unavailable",
                session_id=session_id,
                user_id=user_id,
            )
            return []

    def _pick_continuity_turn(self, recent_turns: list[dict]) -> dict | None:
        for turn in recent_turns:
            if turn.get("detected_topic") or turn.get("selected_topic"):
                return turn
        for turn in recent_turns:
            if turn.get("visual_snapshot"):
                return turn
        return None

    async def _build_guardrail_result(
        self,
        *,
        request: LearningCoreRequest,
        context: LearningContext,
        session_id: str,
        category: str,
        assistant_message: str,
        log_reason: str,
        severity: str,
    ) -> LearningCoreResult:
        record_guardrail_block()
        logger.warning(
            "guardrail_blocked",
            category=category,
            severity=severity,
            log_reason=log_reason,
            grade=request.grade,
        )
        result = self._build_clarification_result(
            request=request,
            context=context,
            assistant_message=assistant_message,
            session_id=session_id,
            response_source="fallback",
            agent_metadata={
                "guardrail": category,
                "guardrail_reason": log_reason,
                "guardrail_severity": severity,
                "guardrail_stage": "input",
            },
        )
        await self._persist_turn_if_needed(
            session_id=session_id,
            user_message=request.message,
            assistant_message=result.assistant_message,
        )
        await self._persist(request, result)
        return result

    def _build_missing_topic_result(
        self,
        *,
        request: LearningCoreRequest,
        context: LearningContext,
        session_id: str,
        agent_metadata: dict | None = None,
    ) -> LearningCoreResult:
        metadata = dict(agent_metadata or {})
        metadata.setdefault("context_resolution", "missing_topic")
        return self._build_clarification_result(
            request=request,
            context=context,
            assistant_message=(
                "Con hãy nói rõ hơn bài toán hoặc chủ đề toán học con muốn học nhé."
            ),
            session_id=session_id,
            response_source="fallback",
            agent_metadata=metadata,
        )

    def _build_follow_up_tool_args(self, topic: Topic, old_data: dict) -> dict[str, int | str]:
        if topic == "multiplication":
            old_groups = int(old_data.get("primary_count") or old_data.get("groups") or 3)
            old_items = int(old_data.get("secondary_count") or old_data.get("items_per_group") or 4)
            return {
                "groups": old_groups + 1 if old_groups < 6 else 2,
                "items_per_group": old_items - 1 if old_items > 2 else 5,
                **FOLLOW_UP_EXAMPLE_LABELS["multiplication"],
            }
        if topic == "division":
            return {
                "total_items": 16,
                "groups": 4,
                **FOLLOW_UP_EXAMPLE_LABELS["division"],
            }
        if topic == "fraction_basic":
            return {
                "numerator": 3,
                "denominator": 8,
                **FOLLOW_UP_EXAMPLE_LABELS["fraction_basic"],
            }
        if topic == "perimeter_area_basic":
            return {
                "length": 6,
                "width": 4,
                "unit": "cm",
                "mode": "area_grid",
            }
        return build_random_tool_args(topic)

    def _apply_follow_up_context(
        self,
        *,
        request: LearningCoreRequest,
        prev_turn: dict | None,
        context: LearningContext,
    ) -> LearningContext:
        if not prev_turn:
            return context

        follow_up_intent = classify_follow_up_intent(request.message)
        if follow_up_intent is None:
            return context

        prev_topic = prev_turn.get("detected_topic") or prev_turn.get("selected_topic")
        if prev_topic and context.topic is None:
            context = build_default_context(prev_topic)

        if context.topic is None:
            return context

        if follow_up_intent == "new_example":
            old_visual = prev_turn.get("visual_snapshot") or {}
            old_data = old_visual.get("visual_data") or {}
            context.intent = "give_example"
            context.tool_args = self._build_follow_up_tool_args(context.topic, old_data)
        elif follow_up_intent == "contextual_explain":
            context.intent = "compare_or_why"

        logger.info(
            "follow_up_context_applied",
            follow_up_intent=follow_up_intent,
            topic=context.topic,
            session_id=request.session_id,
        )
        return context

    def _validate_or_fallback_result(
        self,
        *,
        request: LearningCoreRequest,
        context: LearningContext,
        tool_data: dict,
        assistant_message: str,
        response_source: str,
        response_mode: str,
        follow_up_suggestions: list[str],
        session_id: str,
        agent_metadata: dict | None,
    ) -> LearningCoreResult:
        result = self._build_result(
            request=request,
            context=context,
            tool_data=tool_data,
            assistant_message=assistant_message,
            response_source=response_source,
            response_mode=response_mode,
            follow_up_suggestions=follow_up_suggestions,
            session_id=session_id,
            agent_metadata=agent_metadata,
        )

        try:
            validate_final_response_contract(result)
            validate_learning_core_result(result)
            lesson_resp = to_lesson_response(result)
            if lesson_resp is not None:
                validate_lesson_response(lesson_resp, result.curriculum_topic_id)
            return result
        except ValueError as exc:
            logger.warning(
                "format_validation_failed",
                error_message=str(exc),
                topic=context.topic,
                response_mode=response_mode,
            )
            fallback_result = self._build_result(
                request=request,
                context=context,
                tool_data=tool_data,
                assistant_message=build_contextual_explanation(context.topic, tool_data),
                response_source="fallback",
                response_mode=response_mode,
                follow_up_suggestions=follow_up_suggestions,
                session_id=session_id,
                agent_metadata=agent_metadata,
            )
            validate_final_response_contract(fallback_result)
            validate_learning_core_result(fallback_result)
            lesson_resp = to_lesson_response(fallback_result)
            if lesson_resp is not None:
                validate_lesson_response(lesson_resp, fallback_result.curriculum_topic_id)
            return fallback_result

    def _guard_answer_or_fallback(
        self,
        *,
        answer: str,
        context: LearningContext,
        tool_data: dict,
        response_source: str,
        agent_metadata: dict | None = None,
    ) -> tuple[str, str]:
        output_validation = validate_assistant_output(
            answer=answer,
            topic=context.topic,
            tool_data=tool_data,
            scope_restricted_to_math=True,
        )
        if output_validation.is_valid:
            return output_validation.sanitized_answer, response_source

        logger.warning(
            "output_validation_failed",
            topic=context.topic,
            error_count=len(output_validation.errors),
            errors=output_validation.errors,
        )
        if agent_metadata is not None:
            agent_metadata["output_guard"] = {
                "stage": "output",
                "error_count": len(output_validation.errors),
                "errors": output_validation.errors,
            }
        return build_contextual_explanation(context.topic, tool_data), "fallback"

    async def generate(self, request: LearningCoreRequest) -> LearningCoreResult:
        current_user_id.set(request.user_id)
        session_id = request.session_id or uuid4().hex

        # 1. Đọc lượt chat trước đó để thừa kế context (Topic, Bộ số cũ)
        recent_turns = await self._load_recent_session_turns(
            session_id=session_id,
            user_id=request.user_id,
        )
        prev_turn = self._pick_continuity_turn(recent_turns)

        # 2. Khôi phục Topic nếu request hiện tại gửi lên trống (do tải lại session cũ)
        current_selected_topic = request.selected_topic
        if not current_selected_topic and prev_turn:
            current_selected_topic = prev_turn.get("detected_topic") or prev_turn.get(
                "selected_topic"
            )

        context = build_default_context(current_selected_topic or "multiplication")
        follow_up_intent = classify_follow_up_intent(request.message)

        guard_result = guard_message(request.message)
        if guard_result is not None:
            return await self._build_guardrail_result(
                request=request,
                context=context,
                session_id=session_id,
                category=guard_result.category,
                assistant_message=guard_result.response,
                log_reason=guard_result.log_reason,
                severity=guard_result.severity,
            )

        # ── AUTO-DETECT G1 TOPIC ──────────────────────────────────
        # If frontend did not send curriculum_topic_id, detect from message
        detected_curriculum_topic: str | None = None
        if request.grade in (1, 2):
            detected_curriculum_topic = detect_curriculum_topic(request.message, request.grade)
            if detected_curriculum_topic is not None and request.curriculum_topic_id is None:
                request.curriculum_topic_id = detected_curriculum_topic
                request.selected_topic = RUNTIME_TOPIC_BY_CURRICULUM_TOPIC.get(
                    detected_curriculum_topic
                )

        curriculum_result = build_grade1_curriculum_result(request, session_id)
        if curriculum_result is not None:
            validate_final_response_contract(curriculum_result)
            validate_learning_core_result(curriculum_result)
            lesson_resp = to_lesson_response(curriculum_result)
            if lesson_resp is not None:
                validate_lesson_response(lesson_resp, curriculum_result.curriculum_topic_id)
            await self._persist_turn_if_needed(
                session_id=session_id,
                user_message=request.message,
                assistant_message=curriculum_result.assistant_message,
            )
            await self._persist(request, curriculum_result)
            return curriculum_result

        context = detect_context(
            request.message,
            current_selected_topic,
        )

        context = self._apply_follow_up_context(
            request=request,
            prev_turn=prev_turn,
            context=context,
        )

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
                allowed_tool_names=allowed_tool_names_for_context(context),
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
                    response_source="llm",
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
                default_topic = request.selected_topic or current_selected_topic
                if default_topic is None:
                    result = self._build_missing_topic_result(
                        request=request,
                        context=context,
                        session_id=session_id,
                        agent_metadata=agent_metadata,
                    )
                    await self._persist_turn_if_needed(
                        session_id=session_id,
                        user_message=request.message,
                        assistant_message=result.assistant_message,
                    )
                    await self._persist(request, result)
                    return result
                context = build_default_context(default_topic)
                if is_visual_data_for_topic(agent_response.visual_data, context.topic):
                    tool_data = agent_response.visual_data
                    agent_metadata["visual_source"] = "agent"
                else:
                    tool_data = build_default_tool_data(default_topic, context.tool_args)
                    agent_metadata["visual_source"] = "fallback"
                if is_low_signal_answer(answer):
                    answer = build_contextual_explanation(context.topic, tool_data)
                    response_source = "fallback"
                    logger.info(
                        "tool_answer_fallback_used",
                        topic=context.topic,
                        session_id=session_id,
                        source="contextless_low_signal",
                    )
                answer, response_source = self._guard_answer_or_fallback(
                    answer=answer,
                    context=context,
                    tool_data=tool_data,
                    response_source=response_source,
                    agent_metadata=agent_metadata,
                )
                result = self._validate_or_fallback_result(
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
                await self._persist_turn_if_needed(
                    session_id=session_id,
                    user_message=request.message,
                    assistant_message=result.assistant_message,
                )
                await self._persist(request, result)
                return result

        agent_response = await self.tutor_agent.chat(
            message=build_tutor_message(request.message, context.topic, request.grade, context.tool_args),
            level=grade_to_level(request.grade),
            use_tools=True,
            history=history_payload,
            allowed_tool_names=allowed_tool_names_for_context(context),
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

        if is_visual_data_for_topic(agent_response.visual_data, context.topic):
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

        answer, response_source = self._guard_answer_or_fallback(
            answer=answer,
            context=context,
            tool_data=tool_data,
            response_source=response_source,
            agent_metadata=agent_metadata,
        )

        result = self._validate_or_fallback_result(
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

        await self._persist_turn_if_needed(
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
        current_user_id.set(request.user_id)
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

        recent_turns = await self._load_recent_session_turns(
            session_id=session_id,
            user_id=request.user_id,
        )
        prev_turn = self._pick_continuity_turn(recent_turns)

        current_selected_topic = request.selected_topic
        if not current_selected_topic and prev_turn:
            current_selected_topic = prev_turn.get("detected_topic") or prev_turn.get(
                "selected_topic"
            )

        context = build_default_context(current_selected_topic or "multiplication")
        follow_up_intent = classify_follow_up_intent(request.message)

        guard_result = guard_message(request.message)
        if guard_result is not None:
            result = await self._build_guardrail_result(
                request=request,
                context=context,
                session_id=session_id,
                category=guard_result.category,
                assistant_message=guard_result.response,
                log_reason=guard_result.log_reason,
                severity=guard_result.severity,
            )
            _record_stream_metrics(agent_metadata)
            yield ("chunk", result.assistant_message)
            yield ("done", result)
            return

        detected_curriculum_topic: str | None = None
        if request.grade in (1, 2):
            detected_curriculum_topic = detect_curriculum_topic(request.message, request.grade)
            if detected_curriculum_topic is not None and request.curriculum_topic_id is None:
                request.curriculum_topic_id = detected_curriculum_topic
                request.selected_topic = RUNTIME_TOPIC_BY_CURRICULUM_TOPIC.get(
                    detected_curriculum_topic
                )

        curriculum_result = build_grade1_curriculum_result(request, session_id)
        if curriculum_result is not None:
            validate_final_response_contract(curriculum_result)
            validate_learning_core_result(curriculum_result)
            lesson_resp = to_lesson_response(curriculum_result)
            if lesson_resp is not None:
                validate_lesson_response(lesson_resp, curriculum_result.curriculum_topic_id)
            await self._persist_turn_if_needed(
                session_id=session_id,
                user_message=request.message,
                assistant_message=curriculum_result.assistant_message,
            )
            await self._persist(request, curriculum_result)
            yield ("done", curriculum_result)
            return

        context = detect_context(request.message, current_selected_topic)

        context = self._apply_follow_up_context(
            request=request,
            prev_turn=prev_turn,
            context=context,
        )

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
            context.tool_args,
        )
        level = grade_to_level(request.grade)

        agent_response_holder: list = []
        async for event_type, payload in self.tutor_agent.chat_stream(
            message=tutor_message,
            level=level,
            use_tools=True,
            history=history_payload,
            allowed_tool_names=allowed_tool_names_for_context(context),
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

            default_topic = request.selected_topic or current_selected_topic
            if default_topic is None:
                result = self._build_missing_topic_result(
                    request=request,
                    context=context,
                    session_id=session_id,
                    agent_metadata=agent_metadata,
                )
                await self._persist_turn_if_needed(
                    session_id=session_id,
                    user_message=request.message,
                    assistant_message=result.assistant_message,
                )
                await self._persist(request, result)
                _record_stream_metrics(agent_metadata)
                yield ("done", result)
                return
            context = build_default_context(default_topic)
            if is_visual_data_for_topic(agent_response.visual_data, context.topic):
                tool_data = agent_response.visual_data
                agent_metadata["visual_source"] = "agent"
            else:
                tool_data = build_default_tool_data(default_topic, context.tool_args)
                agent_metadata["visual_source"] = "fallback"
            if is_low_signal_answer(answer):
                answer = build_contextual_explanation(context.topic, tool_data)
                response_source = "fallback"
                logger.info(
                    "tool_answer_fallback_used",
                    topic=context.topic,
                    session_id=session_id,
                    source="stream_contextless_low_signal",
                )
            answer, response_source = self._guard_answer_or_fallback(
                answer=answer,
                context=context,
                tool_data=tool_data,
                response_source=response_source,
                agent_metadata=agent_metadata,
            )
            result = self._validate_or_fallback_result(
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
            await self._persist_turn_if_needed(
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

        if is_visual_data_for_topic(agent_response.visual_data, context.topic):
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

        answer, response_source = self._guard_answer_or_fallback(
            answer=answer,
            context=context,
            tool_data=tool_data,
            response_source=response_source,
            agent_metadata=agent_metadata,
        )

        result = self._validate_or_fallback_result(
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

        await self._persist_turn_if_needed(
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
        response_source: ResponseSource = "llm",
        agent_metadata: dict | None = None,
        follow_up_suggestions: list[str] | None = None,
    ) -> LearningCoreResult:
        topic = context.topic or "multiplication"
        return LearningCoreResult(
            topic=topic,
            curriculum_topic_id=request.curriculum_topic_id,
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
            follow_up_suggestions=follow_up_suggestions
            or [
                "Con muốn học phép nhân.",
                "Con muốn học phép chia.",
                "Con muốn học phân số.",
                "Con muốn học chu vi và diện tích.",
            ],
            session_metadata=SessionMetadata(
                session_id=session_id or uuid4().hex,
                provider=settings.llm_provider,
                response_source=response_source,
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
            curriculum_visual_template=getattr(request, "curriculum_visual_template", None),
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
            lesson_response = to_lesson_response(result)
            await self.session_repository.save(
                LearningPersistencePayload(
                    request=request,
                    result=result,
                    lesson_snapshot=lesson_response.model_dump()
                    if lesson_response is not None
                    else {},
                    chat_snapshot=to_chat_response(result),
                )
            )
        except Exception:
            logger.exception(
                "session_persist_failed",
                session_id=result.session_metadata.session_id,
                topic=result.topic,
                response_mode=result.response_mode,
                has_visual=result.visual_card is not None,
                has_practice=result.practice_question_chat is not None,
            )
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
    if topic == "addition_subtraction":
        operation = random.choice(["+", "-"])
        operand_a = random.randint(5, 50)
        operand_b = random.randint(1, operand_a if operation == "-" else 50)
        item = random.choice(["quả cam", "cái kẹo", "quyển vở", "bông hoa"])
        return {
            "operation": operation,
            "operand_a": operand_a,
            "operand_b": operand_b,
            "item_name": item,
        }
    if topic == "comparison_numbers":
        number_a = random.randint(1, 100)
        number_b = random.randint(1, 100)
        return {"number_a": number_a, "number_b": number_b}
    if topic == "time_clock":
        hour = random.randint(1, 12)
        minute = random.choice([0, 15, 30, 45])
        return {"hour": hour, "minute": minute}
    if topic == "measurement_length":
        length_a = random.randint(3, 20)
        length_b = random.randint(3, 20)
        object_a = random.choice(["cây bút", "sợi dây", "chiếc bàn"])
        object_b = random.choice(["cây thước", "quyển sách", "cái ghế"])
        return {
            "length_a": length_a,
            "length_b": length_b,
            "unit": "cm",
            "object_a": object_a,
            "object_b": object_b,
        }
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
    if topic == "data_representation":
        labels_csv = str(tool_args.get("labels_csv") or "To 1|To 2|To 3")
        values_csv = str(tool_args.get("values_csv") or "6|9|7")
        labels = [label.strip() for label in labels_csv.split("|") if label.strip()]
        values = [int(value.strip()) for value in values_csv.split("|") if value.strip()]
        if not labels or len(labels) != len(values):
            labels = ["To 1", "To 2", "To 3"]
            values = [6, 9, 7]
        return {
            "type": "bar_chart",
            "labels": labels,
            "values": values,
            "bar_count": len(values),
            "max_value": max(values),
            "total_value": sum(values),
        }
    if topic == "addition_subtraction":
        operation = str(tool_args.get("operation") or "+")
        operand_a = int(tool_args.get("operand_a") or 5)
        operand_b = int(tool_args.get("operand_b") or 3)
        result = operand_a - operand_b if operation == "-" else operand_a + operand_b
        return {
            "type": "addition_subtraction",
            "operation": operation,
            "operand_a": operand_a,
            "operand_b": operand_b,
            "result": result,
            "item_name": tool_args.get("item_name") or "quả cam",
        }
    if topic == "comparison_numbers":
        number_a = int(tool_args.get("number_a") or 37)
        number_b = int(tool_args.get("number_b") or 42)
        symbol = ">" if number_a > number_b else "<" if number_a < number_b else "="
        return {
            "type": "number_comparison",
            "number_a": number_a,
            "number_b": number_b,
            "comparison_symbol": symbol,
            "larger": max(number_a, number_b),
            "smaller": min(number_a, number_b),
        }
    if topic == "time_clock":
        hour = int(tool_args.get("hour") or 7)
        minute = int(tool_args.get("minute") or 0)
        time_label = f"{hour} giờ" if minute == 0 else f"{hour} giờ {minute} phút"
        return {
            "type": "clock_reading",
            "hour": hour,
            "minute": minute,
            "time_label": time_label,
        }
    if topic == "measurement_length":
        length_a = int(tool_args.get("length_a") or 9)
        length_b = int(tool_args.get("length_b") or 6)
        object_a = tool_args.get("object_a") or "cây bút"
        object_b = tool_args.get("object_b") or "cây thước"
        return {
            "type": "length_comparison",
            "length_a": length_a,
            "length_b": length_b,
            "unit": tool_args.get("unit") or "cm",
            "object_a": object_a,
            "object_b": object_b,
            "longer_object": object_a if length_a >= length_b else object_b,
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


def allowed_tool_names_for_context(context: LearningContext) -> list[str]:
    """Compute which tool(s) the LLM is allowed to call for this context.

    Returns a single-element list with ``context.tool_name`` when the topic
    is known and has a matching tool; otherwise an empty list, which tells
    ``AgentRunConfig``/``AgentLoop`` to pass no tools at all so the LLM must
    answer with text or rely on already-available data instead of picking a
    tool for a different topic.
    """
    if context.topic and context.tool_name:
        return [context.tool_name]
    return []


def is_visual_data_for_topic(visual_data: dict | None, topic: Topic | None) -> bool:
    """Check that agent-produced visual_data actually belongs to *topic*.

    The agent is allowed at most one tool per call, but this is a defensive
    check against stale/mismatched data (e.g. carried over from a follow-up
    context) before it gets treated as trustworthy visual data.
    """
    if not visual_data or not isinstance(visual_data, dict) or topic is None:
        return False
    expected_type = TOPIC_TOOL_DATA_TYPE.get(topic)
    return expected_type is not None and visual_data.get("type") == expected_type


def build_tutor_message(message: str, topic: Topic | None, grade: int, tool_args: dict | None = None) -> str:
    topic_hint = f" chủ đề '{topic}'" if topic else ""
    if topic:
        vague_hint = "nếu câu hỏi không có số liệu cụ thể, hãy tự chọn số ngẫu nhiên phù hợp và giải thích ngay"
        tool_scope_hint = (
            f" CHỈ được dùng tool khớp đúng chủ đề '{topic}', "
            "tuyệt đối không dùng tool thuộc chủ đề khác."
        )
    else:
        vague_hint = "nếu câu hỏi còn mơ hồ về chủ đề, hãy hỏi lại một câu ngắn gọn"
        tool_scope_hint = ""

    tool_args_hint = ""
    if tool_args:
        import json
        tool_args_hint = f" Tham số tool: {json.dumps(tool_args, ensure_ascii=False)}."

    return (
        f"Học sinh lớp {grade} đang hỏi về{topic_hint}. "
        "Hãy đọc kỹ yêu cầu và trả lời đúng theo đó: "
        "nếu câu hỏi rõ, hãy giải thích ngắn gọn, thân thiện, dễ hiểu; "
        f"{vague_hint}.{tool_scope_hint}{tool_args_hint} "
        f"Câu hỏi: {message}"
    )


def normalize_answer(answer: str) -> str:
    cleaned = (answer or "").strip()
    if not cleaned:
        return "Cô chưa hiểu rõ câu hỏi của con. Con có thể nói cụ thể hơn không?"
    return cleaned


def classify_follow_up_intent(message: str) -> str | None:
    normalized = _normalize_text(message)
    if any(
        phrase in normalized
        for phrase in (
            "them vi du",
            "vi du khac",
            "vi du moi",
            "vi du nua",
            "cho them vi du",
            "cho con them vi du",
            "them mot vi du",
            "them vi du nua",
            "cho vi du khac",
            "lam vi du khac",
            "so khac",
            "so khac di",
            "doi so",
            "doi so khac",
        )
    ):
        return "new_example"
    if any(
        phrase in normalized
        for phrase in (
            "vi sao day la phep nhan",
            "vi sao la phep nhan",
            "giai thich lai",
            "giai thich de hon",
            "noi ro hon",
            "tai sao lai nhu vay",
        )
    ):
        return "contextual_explain"
    return None


def is_low_signal_answer(answer: str) -> bool:
    lowered = answer.strip().lower()
    retry_phrases = (
        "thử hỏi lại ngắn hơn",
        "thá»­ há»i láº¡i ngáº¯n hÆ¡n",
    )
    low_signal_prefixes = (
        "mình gặp lỗi khi xử lý câu hỏi",
        "mã¬nh gáº·p lá»—i khi xá»­ lÃ½ cÃ¢u há»i",
        "hiện tại mình chưa xử lý được câu hỏi này",
        "hiá»‡n táº¡i mÃ¬nh chÆ°a xá»­ lÃ½ Ä‘Æ°á»£c cÃ¢u há»i nÃ y",
    )
    return any(prefix in lowered for prefix in low_signal_prefixes) and any(
        phrase in lowered for phrase in retry_phrases
    )


def grade_to_level(grade: int) -> str:
    mapping = {1: "L1", 2: "L2", 3: "L3", 4: "L4", 5: "L5"}
    return mapping.get(grade, "L3")


def is_clarification_response(answer: str) -> bool:
    stripped = answer.strip()
    if not stripped:
        return False
    lines = [line.strip() for line in stripped.splitlines() if line.strip()]
    # A real clarification turn is ONLY the one short question the prompt asks
    # for ("hỏi lại ĐÚNG MỘT CÂU"). A full explanation that happens to end
    # with a friendly follow-up question (common LLM tutoring style) must not
    # be mistaken for a clarification request and thrown away.
    if len(lines) != 1:
        return False
    last_line = lines[0]
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
    if topic == "data_representation":
        labels = tool_data.get("labels", ["To 1", "To 2", "To 3"])
        values = tool_data.get("values", [6, 9, 7])
        pairs = ", ".join(f"{label}: {value}" for label, value in zip(labels, values))
        return (
            f"Biểu đồ cột giúp so sánh dữ liệu nhanh hơn. Ở đây ta có {pairs}. "
            "Cột cao hơn nghĩa là số lượng lớn hơn."
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
    if topic == "data_representation":
        return [
            "To nao dong nhat?",
            "To nao it hoc sinh nhat?",
            "Cho con mot bieu do tranh tuong tu.",
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
