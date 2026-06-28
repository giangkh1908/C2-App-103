#!/usr/bin/env python3
"""Import Vietnamese elementary math curriculum (GDPT 2018) from markdown to MongoDB.

Usage:
    python scripts/import_curriculum.py --md-path <path_to_md> [--replace]

The markdown file should follow the structure from
``data/curriculum/chuong_trinh_toan_tieu_hoc_visual_taxonomy.md``.
"""

from __future__ import annotations

import argparse
import asyncio
import re
import sys
import unicodedata
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorClient

# ---------------------------------------------------------------------------
# Markdown parser
# ---------------------------------------------------------------------------


def _strip_accents(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in nfkd if unicodedata.category(ch) != "Mn")


def _generate_keywords(topic_name: str, content: str, topic_id: str) -> list[str]:
    keywords: set[str] = set()
    for word in topic_name.lower().split():
        clean = re.sub(r"[^a-z0-9]", "", _strip_accents(word))
        if len(clean) >= 2:
            keywords.add(clean)
    snippet = content[:100].lower()
    for word in snippet.split():
        clean = re.sub(r"[^a-z0-9]", "", _strip_accents(word))
        if len(clean) >= 3:
            keywords.add(clean)
    id_match = re.search(r"[A-Z]+-([A-Z]+)", topic_id)
    if id_match:
        keywords.add(id_match.group(1).lower())
    return sorted(keywords)


def _parse_list_field(raw: str) -> list[str]:
    """Parse a comma-separated field, stripping backticks and whitespace."""
    items = []
    for item in raw.split(","):
        item = item.strip().strip("`").strip()
        if item:
            items.append(item)
    return items


def parse_curriculum_markdown(md_path: str) -> list[dict]:
    """Parse the curriculum markdown into a list of topic dicts."""
    content = Path(md_path).read_text(encoding="utf-8")
    topics: list[dict] = []

    # Split by grade headers: "# LỚP X"
    grade_sections = re.split(r"^# LỚP\s+(\d+)\s*$", content, flags=re.MULTILINE)

    # grade_sections[0] is preamble, then alternating grade_num, grade_content
    i = 1
    while i < len(grade_sections) - 1:
        grade_num = int(grade_sections[i])
        grade_text = grade_sections[i + 1]
        i += 2

        # Extract strand: "## Mạch: ..."
        strand_sections = re.split(r"^## Mạch:\s*(.+?)\s*$", grade_text, flags=re.MULTILINE)
        # strand_sections[0] is before first strand, then alternating strand_name, strand_content
        j = 1
        while j < len(strand_sections) - 1:
            strand_name = strand_sections[j].strip()
            strand_text = strand_sections[j + 1]
            j += 2

            # Extract topics: "### G{grade}-{STRAND}-{num} — Title"
            topic_blocks = re.split(
                r"^###\s+(G\d+-[A-Z]+-\d+)\s+[—–-]\s+(.+?)\s*$",
                strand_text,
                flags=re.MULTILINE,
            )
            k = 1
            while k < len(topic_blocks) - 1:
                topic_id = topic_blocks[k].strip()
                topic_title = topic_blocks[k + 1].strip()
                topic_body = topic_blocks[k + 2] if k + 2 < len(topic_blocks) else ""
                k += 3

                # Parse fields from topic body
                topic_data = {
                    "topic_id": topic_id,
                    "grade": grade_num,
                    "strand": strand_name,
                    "topic_name": topic_title,
                    "content": "",
                    "learning_outcomes": [],
                    "visual_templates": [],
                    "visual_intent": "",
                    "data_params": [],
                    "keywords": [],
                    "difficulty": 3,
                }

                # Content
                content_match = re.search(
                    r"\*\*Nội dung:\*\*\s*(.+?)(?=\n\s*-|\n\s*\*\*|\Z)",
                    topic_body,
                    re.DOTALL,
                )
                if content_match:
                    topic_data["content"] = content_match.group(1).strip()

                # Learning outcomes
                outcomes_match = re.search(
                    r"\*\*Yêu cầu cần đạt:\*\*\s*(.+?)(?=\n\s*-?\s*\*\*|\Z)",
                    topic_body,
                    re.DOTALL,
                )
                if outcomes_match:
                    raw_outcomes = outcomes_match.group(1)
                    outcomes = re.findall(r"-\s*(.+?)(?=\n\s*-|\Z)", raw_outcomes, re.DOTALL)
                    topic_data["learning_outcomes"] = [o.strip() for o in outcomes if o.strip()]

                # Visual templates
                vt_match = re.search(
                    r"\*\*visual_templates:\*\*\s*(.+?)(?=\n\s*-|\n\s*\*\*|\Z)",
                    topic_body,
                    re.DOTALL,
                )
                if vt_match:
                    topic_data["visual_templates"] = _parse_list_field(vt_match.group(1))

                # Visual intent
                vi_match = re.search(
                    r"\*\*visual_intent:\*\*\s*(.+?)(?=\n\s*-|\n\s*\*\*|\Z)",
                    topic_body,
                    re.DOTALL,
                )
                if vi_match:
                    topic_data["visual_intent"] = vi_match.group(1).strip()

                # Data params
                dp_match = re.search(
                    r"\*\*data_params:\*\*\s*(.+?)(?=\n\s*-|\n\s*\*\*|\Z)",
                    topic_body,
                    re.DOTALL,
                )
                if dp_match:
                    topic_data["data_params"] = _parse_list_field(dp_match.group(1))

                # Auto-generate keywords
                topic_data["keywords"] = _generate_keywords(
                    topic_data["topic_name"],
                    topic_data["content"],
                    topic_id,
                )

                topics.append(topic_data)

    return topics


# ---------------------------------------------------------------------------
# MongoDB import
# ---------------------------------------------------------------------------


async def import_to_mongodb(
    topics: list[dict],
    mongodb_uri: str,
    db_name: str,
    replace: bool = False,
) -> int:
    """Upsert parsed topics into MongoDB curriculum_topics collection."""
    client = AsyncIOMotorClient(mongodb_uri, tz_aware=True)
    db = client[db_name]
    collection = db["curriculum_topics"]

    if replace:
        result = await collection.delete_many({})
        logger.info("cleared_curriculum", deleted_count=result.deleted_count)

    count = 0
    for topic in topics:
        await collection.update_one(
            {"topic_id": topic["topic_id"]},
            {"$set": topic},
            upsert=True,
        )
        count += 1

    logger.info("import_complete", imported=count)
    client.close()
    return count


# ---------------------------------------------------------------------------
# Logging (minimal, no app logger dependency)
# ---------------------------------------------------------------------------

import logging

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("import_curriculum")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser(description="Import curriculum markdown to MongoDB")
    parser.add_argument(
        "--md-path",
        required=True,
        help="Path to curriculum markdown file",
    )
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Replace all existing curriculum data",
    )
    parser.add_argument(
        "--mongodb-uri",
        default=None,
        help="MongoDB URI (defaults to env MONGODB_URI)",
    )
    parser.add_argument(
        "--db-name",
        default=None,
        help="Database name (defaults to env MONGODB_DB_NAME or 'toan_truc_quan')",
    )
    args = parser.parse_args()

    # Parse markdown
    md_path = Path(args.md_path)
    if not md_path.exists():
        logger.error("file_not_found: %s", md_path)
        sys.exit(1)

    logger.info("parsing_markdown: %s", md_path)
    topics = parse_curriculum_markdown(str(md_path))
    logger.info("parsed_topics", count=len(topics))

    if not topics:
        logger.warning("no_topics_found")
        sys.exit(0)

    # Load env for MongoDB connection
    import os

    mongodb_uri = args.mongodb_uri or os.environ.get("MONGODB_URI", "")
    db_name = args.db_name or os.environ.get("MONGODB_DB_NAME", "toan_truc_quan")

    if not mongodb_uri:
        logger.error("MONGODB_URI not set and --mongodb-uri not provided")
        sys.exit(1)

    # Import
    count = asyncio.run(import_to_mongodb(topics, mongodb_uri, db_name, replace=args.replace))
    logger.info("done: imported %d topics", count)


if __name__ == "__main__":
    main()
