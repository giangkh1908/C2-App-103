"""Curriculum service — loads Vietnamese elementary math curriculum (GDPT 2018) from MongoDB.

On app startup, ``load_curriculum_from_db`` fetches all topics and caches
them in module-level state.  Subsequent queries use the in-memory cache.
If MongoDB has no curriculum data the cache is empty — the API still
returns empty lists without crashing.
"""

from __future__ import annotations

import re
import unicodedata
from typing import TYPE_CHECKING

from src.core.logging import get_logger
from src.models.curriculum import (
    CurriculumGradeSummary,
    CurriculumTopic,
    CurriculumTopicListItem,
)

if TYPE_CHECKING:
    from motor.motor_asyncio import AsyncIOMotorDatabase

logger = get_logger("toan_truc_quan.curriculum")

# ---------------------------------------------------------------------------
# Module-level cache (populated at startup)
# ---------------------------------------------------------------------------

_topics_by_id: dict[str, CurriculumTopic] = {}
_topics_by_grade: dict[int, list[CurriculumTopic]] = {}


def _strip_accents(text: str) -> str:
    """Remove Vietnamese diacritics for keyword matching."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in nfkd if unicodedata.category(ch) != "Mn")


def _generate_keywords(topic_name: str, content: str, topic_id: str) -> list[str]:
    """Auto-generate searchable Vietnamese keywords from topic metadata."""
    keywords: set[str] = set()

    # Topic name tokens
    for word in topic_name.lower().split():
        clean = re.sub(r"[^a-z0-9]", "", _strip_accents(word))
        if len(clean) >= 2:
            keywords.add(clean)

    # Content tokens (first 100 chars)
    snippet = content[:100].lower()
    for word in snippet.split():
        clean = re.sub(r"[^a-z0-9]", "", _strip_accents(word))
        if len(clean) >= 3:
            keywords.add(clean)

    # Topic ID prefix as keyword (e.g. "G3-FRAC" → "frac")
    id_match = re.search(r"[A-Z]+-([A-Z]+)", topic_id)
    if id_match:
        keywords.add(id_match.group(1).lower())

    return sorted(keywords)


# ---------------------------------------------------------------------------
# DB operations
# ---------------------------------------------------------------------------


async def load_curriculum_from_db(database: AsyncIOMotorDatabase) -> None:
    """Load all curriculum topics from MongoDB into module-level cache."""
    global _topics_by_id, _topics_by_grade

    collection = database["curriculum_topics"]
    cursor = collection.find({}, {"_id": 0})

    topics_by_id: dict[str, CurriculumTopic] = {}
    topics_by_grade: dict[int, list[CurriculumTopic]] = {}

    async for doc in cursor:
        try:
            topic = CurriculumTopic(**doc)
        except Exception:
            logger.warning("invalid_curriculum_doc", extra={"doc": doc})
            continue

        # Auto-generate keywords if missing
        if not topic.keywords:
            topic.keywords = _generate_keywords(
                topic.topic_name, topic.content, topic.topic_id
            )

        topics_by_id[topic.topic_id] = topic
        topics_by_grade.setdefault(topic.grade, []).append(topic)

    _topics_by_id = topics_by_id
    _topics_by_grade = topics_by_grade

    total = len(_topics_by_id)
    grades = sorted(_topics_by_grade.keys())
    logger.info(
        "curriculum_loaded",
        total_topics=total,
        grades=grades,
    )


# ---------------------------------------------------------------------------
# Query helpers (use module-level cache)
# ---------------------------------------------------------------------------


def get_all_topics() -> list[CurriculumTopic]:
    return list(_topics_by_id.values())


def get_topics_for_grade(grade: int) -> list[CurriculumTopicListItem]:
    topics = _topics_by_grade.get(grade, [])
    return [
        CurriculumTopicListItem(
            topic_id=t.topic_id,
            topic_name=t.topic_name,
            strand=t.strand,
            visual_templates=t.visual_templates,
            difficulty=t.difficulty,
        )
        for t in topics
    ]


def get_topic_by_id(topic_id: str) -> CurriculumTopic | None:
    return _topics_by_id.get(topic_id)


def search_topics(query: str, grade: int | None = None) -> list[CurriculumTopicListItem]:
    """Simple keyword search across topic names and keywords."""
    q = _strip_accents(query.lower().strip())
    if not q:
        return []

    candidates = _topics_by_id.values()
    if grade is not None:
        candidates = _topics_by_grade.get(grade, [])

    results: list[CurriculumTopic] = []
    for topic in candidates:
        # Match against topic name
        name_normalized = _strip_accents(topic.topic_name.lower())
        if q in name_normalized:
            results.append(topic)
            continue
        # Match against keywords
        if any(q in kw for kw in topic.keywords):
            results.append(topic)

    return [
        CurriculumTopicListItem(
            topic_id=t.topic_id,
            topic_name=t.topic_name,
            strand=t.strand,
            visual_templates=t.visual_templates,
            difficulty=t.difficulty,
        )
        for t in results
    ]


def get_grade_summaries() -> list[CurriculumGradeSummary]:
    summaries: list[CurriculumGradeSummary] = []
    for grade in sorted(_topics_by_grade.keys()):
        topics = _topics_by_grade[grade]
        strands = sorted({t.strand for t in topics})
        summaries.append(
            CurriculumGradeSummary(
                grade=grade,
                topic_count=len(topics),
                strands=strands,
            )
        )
    return summaries


def get_curriculum_context_for_grade(grade: int) -> str:
    """Build a compact curriculum context string for the LLM system prompt."""
    topics = _topics_by_grade.get(grade, [])
    if not topics:
        return ""

    lines = [f"Lớp {grade}:"]
    for t in topics:
        lines.append(f"- {t.topic_name} ({t.topic_id}): {t.content}")
    return "\n".join(lines)
