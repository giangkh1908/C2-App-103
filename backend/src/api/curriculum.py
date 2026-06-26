from fastapi import APIRouter, HTTPException, Query

from src.models.curriculum import CurriculumTopic
from src.services.curriculum_service import (
    get_all_topics,
    get_grade_summaries,
    get_topic_by_id,
    get_topics_for_grade,
    search_topics,
)
from src.services.curriculum_adapter import get_prompt_examples_for_curriculum_topic

router = APIRouter(prefix="/curriculum", tags=["curriculum"])


@router.get("/grades")
async def list_grades() -> dict:
    """Return grade-level summaries (1-5) with topic counts."""
    summaries = get_grade_summaries()
    return {"grades": [s.model_dump() for s in summaries]}


@router.get("/topics")
async def list_topics(
    grade: int = Query(ge=1, le=5, description="Filter by grade 1-5"),
) -> dict:
    """Return lightweight topic list for a specific grade."""
    topics = get_topics_for_grade(grade)
    return {"topics": [t.model_dump() for t in topics]}


@router.get("/topics/{topic_id}")
async def get_topic(topic_id: str) -> dict:
    """Return full topic detail by topic_id (e.g. G3-FRAC-01)."""
    topic = get_topic_by_id(topic_id)
    if topic is None:
        raise HTTPException(status_code=404, detail=f"Topic '{topic_id}' not found")
    payload = topic.model_dump()
    prompt_examples = get_prompt_examples_for_curriculum_topic(topic_id)
    if prompt_examples:
        payload["prompt_examples"] = prompt_examples
    return {"topic": payload}


@router.get("/search")
async def search(
    q: str = Query(min_length=1, description="Search query"),
    grade: int | None = Query(None, ge=1, le=5, description="Optional grade filter"),
) -> dict:
    """Keyword search across topic names and auto-generated keywords."""
    results = search_topics(q, grade=grade)
    return {"topics": [t.model_dump() for t in results]}


@router.get("/all")
async def all_topics() -> dict:
    """Return all curriculum topics (full detail)."""
    topics = get_all_topics()
    return {"topics": [t.model_dump() for t in topics], "count": len(topics)}
