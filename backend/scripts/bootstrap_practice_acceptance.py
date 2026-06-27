#!/usr/bin/env python3
import argparse
import asyncio
import os
from pathlib import Path
import sys
from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.core.config import settings  # noqa: E402
from src.core.database import ensure_indexes  # noqa: E402


DEFAULT_ACCEPTANCE_DB_NAME = os.getenv(
    "PRACTICE_ACCEPTANCE_MONGODB_DB_NAME", "toan_truc_quan_practice_acceptance"
)


async def copy_collection(
    source_db: Any,
    target_db: Any,
    collection_name: str,
    *,
    filter_query: dict[str, Any] | None = None,
    key_field: str,
) -> int:
    copied = 0
    cursor = source_db[collection_name].find(filter_query or {})
    async for document in cursor:
        await target_db[collection_name].replace_one(
            {key_field: document[key_field]}, document, upsert=True
        )
        copied += 1
    return copied


async def main() -> None:
    parser = argparse.ArgumentParser(
        description="Bootstrap a dedicated Mongo acceptance database for /practice without touching shared dev data"
    )
    parser.add_argument("--source-uri", default=settings.mongodb_uri, help="Source MongoDB URI")
    parser.add_argument(
        "--source-db", default=settings.mongodb_db_name, help="Source MongoDB database name"
    )
    parser.add_argument("--target-uri", default=settings.mongodb_uri, help="Target MongoDB URI")
    parser.add_argument(
        "--target-db", default=DEFAULT_ACCEPTANCE_DB_NAME, help="Target acceptance database name"
    )
    parser.add_argument(
        "--user-email",
        action="append",
        default=[],
        help="Optional user email to scope copied users; repeat to include multiple users",
    )
    parser.add_argument(
        "--skip-users", action="store_true", help="Do not copy users into the acceptance database"
    )
    parser.add_argument(
        "--copy-attempts",
        action="store_true",
        help="Opt in to copy practice_attempts instead of resetting them",
    )
    args = parser.parse_args()

    source_client = AsyncIOMotorClient(args.source_uri)
    target_client = AsyncIOMotorClient(args.target_uri)
    source_db = source_client[args.source_db]
    target_db = target_client[args.target_db]

    try:
        await ensure_indexes(target_db)

        copied_users = 0
        copied_attempts = 0
        user_filter: dict[str, Any] = {}
        allowed_user_ids: list[str] | None = None

        if args.user_email:
            normalized_emails = [
                email.strip().lower() for email in args.user_email if email.strip()
            ]
            if normalized_emails:
                user_filter = {"email": {"$in": normalized_emails}}

        if not args.skip_users:
            users = await source_db.users.find(user_filter).to_list(length=None)
            for user_doc in users:
                await target_db.users.replace_one({"_id": user_doc["_id"]}, user_doc, upsert=True)
            copied_users = len(users)
            allowed_user_ids = [str(user_doc["_id"]) for user_doc in users]

        await target_db.practice_attempts.delete_many({})
        if args.copy_attempts:
            attempt_filter: dict[str, Any] = {}
            if allowed_user_ids is not None:
                attempt_filter = {"user_id": {"$in": allowed_user_ids}}
            copied_attempts = await copy_collection(
                source_db,
                target_db,
                "practice_attempts",
                filter_query=attempt_filter,
                key_field="attempt_id",
            )

        print(
            {
                "source_db": args.source_db,
                "target_db": args.target_db,
                "copied_users": copied_users,
                "copied_attempts": copied_attempts,
                "practice_attempts_reset": not args.copy_attempts,
            }
        )
    finally:
        source_client.close()
        target_client.close()


if __name__ == "__main__":
    asyncio.run(main())
