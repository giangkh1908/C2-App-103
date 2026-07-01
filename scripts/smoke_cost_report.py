#!/usr/bin/env python3
"""Smoke test — end-to-end cost report pipeline.

Steps:
  1. Register a test user via POST /api/v1/auth/register
  2. Promote the user to admin role directly in MongoDB
  3. Log in to obtain a JWT access token
  4. Insert a sample cost_log document directly into MongoDB (no OpenRouter call)
  5. Call GET /api/v1/admin/costs?month=YYYY-MM with the admin JWT
  6. Assert total_cost_usd > 0 and the test user's email appears in top_users
  7. Clean up: delete test user and inserted cost_log entry

Usage:
    python scripts/smoke_cost_report.py
    python scripts/smoke_cost_report.py --backend-url http://localhost:8000 --mongodb-uri mongodb://localhost:27017

Environment variables (loaded from backend/.env or env):
    MONGODB_URI, MONGODB_DB_NAME
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import UTC, datetime
from typing import Any

try:
    from dotenv import load_dotenv
except ImportError:
    print("FAIL: Missing `python-dotenv`. Run: pip install python-dotenv")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("FAIL: Missing `requests`. Run: pip install requests")
    sys.exit(1)

try:
    from bson import ObjectId
    from pymongo import MongoClient
    from pymongo.errors import PyMongoError
except ImportError:
    print("FAIL: Missing `pymongo`. Run: pip install pymongo")
    sys.exit(1)


def _require_ok(response: requests.Response, action: str) -> dict[str, Any]:
    """Return parsed JSON on 2xx, or raise with status+body."""
    if not response.ok:
        raise RuntimeError(
            f"{action} failed: {response.status_code} {response.text[:500]}"
        )
    return response.json()


def _current_month() -> str:
    now = datetime.now(UTC)
    return f"{now.year}-{now.month:02d}"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Smoke test the admin cost report pipeline"
    )
    parser.add_argument(
        "--backend-url",
        default="http://localhost:8000",
        help="Backend base URL (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--mongodb-uri",
        help="MongoDB connection string (default: from env MONGODB_URI)",
    )
    args = parser.parse_args()

    # ── Load environment ──────────────────────────────────────────────
    env_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "backend",
        ".env",
    )
    if os.path.isfile(env_path):
        load_dotenv(env_path)

    mongo_uri = args.mongodb_uri or os.getenv("MONGODB_URI") or ""
    db_name = os.getenv("MONGODB_DB_NAME") or ""
    if not mongo_uri:
        print("FAIL: MONGODB_URI not set. Pass --mongodb-uri or set env.")
        sys.exit(1)
    if not db_name:
        print("FAIL: MONGODB_DB_NAME not set in environment.")
        sys.exit(1)

    api_prefix = f"{args.backend_url.rstrip('/')}/api/v1"

    # ── Setup MongoDB client ──────────────────────────────────────────
    client: MongoClient | None = None
    test_user_id: str | None = None
    test_email: str | None = None

    try:
        client = MongoClient(mongo_uri)
        db = client[db_name]
        users_coll = db["users"]
        cost_logs_coll = db["cost_logs"]

        # ── Step 1: Register test user ─────────────────────────────────
        timestamp = int(datetime.now(UTC).timestamp())
        test_email = f"smoke_cost_{timestamp}@test.com"
        test_password = "SmokeTest123!"
        test_name = "Smoke Cost User"

        reg_resp = requests.post(
            f"{api_prefix}/auth/register",
            json={
                "name": test_name,
                "email": test_email,
                "password": test_password,
            },
            timeout=30,
        )
        reg_data = _require_ok(reg_resp, "register user")
        test_user_id = reg_data["user"]["id"]
        print(f"  [1] Registered test user: {test_email} (id={test_user_id})")

        # ── Step 2: Promote to admin directly in MongoDB ───────────────
        users_coll.update_one(
            {"_id": ObjectId(test_user_id)},
            {"$set": {"role": "admin"}},
        )
        print("  [2] Promoted user to admin role in MongoDB")

        # ── Step 3: Login to get JWT ───────────────────────────────────
        login_resp = requests.post(
            f"{api_prefix}/auth/login",
            json={"email": test_email, "password": test_password},
            timeout=30,
        )
        login_data = _require_ok(login_resp, "login")
        access_token = login_data["accessToken"]
        admin_headers = {"Authorization": f"Bearer {access_token}"}
        print("  [3] Logged in, got JWT access token")

        # ── Step 4: Insert a cost_log entry for the current month ──────
        month = _current_month()
        prompt_tokens = 1000
        completion_tokens = 500
        cost_usd = (
            prompt_tokens * 0.09 / 1_000_000 + completion_tokens * 0.18 / 1_000_000
        )

        cost_logs_coll.insert_one(
            {
                "user_id": test_user_id,
                "model": "deepseek/deepseek-v4-flash",
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "cost_usd": cost_usd,
                "timestamp": datetime.now(UTC),
            }
        )
        print(f"  [4] Inserted cost_log: ${cost_usd:.6f} for month {month}")

        # ── Step 5: Call admin costs endpoint ──────────────────────────
        costs_resp = requests.get(
            f"{api_prefix}/admin/costs",
            params={"month": month},
            headers=admin_headers,
            timeout=30,
        )
        costs_data = _require_ok(costs_resp, "get admin costs")
        print(f"  [5] GET /admin/costs?month={month} → 200 OK")

        # ── Step 6: Assertions ─────────────────────────────────────────
        # Verify total_cost_usd > 0
        total_cost_usd = costs_data.get("total_cost_usd", 0.0)
        if total_cost_usd <= 0:
            raise AssertionError(f"Expected total_cost_usd > 0, got {total_cost_usd}")
        print(f"  [6a] total_cost_usd = {total_cost_usd} > 0  ✓")

        # Verify the test user appears in the top_users list
        top_users = costs_data.get("top_users", [])
        found = any(u.get("email") == test_email for u in top_users)
        if not found:
            raise AssertionError(
                f"Test email {test_email!r} not found in top users. "
                f"Top users: {[u.get('email') for u in top_users]}"
            )
        print("  [6b] Test user found in top_users list  ✓")

        # Verify response shape
        expected_keys = {
            "total_cost_usd",
            "total_prompt_tokens",
            "total_completion_tokens",
            "total_users",
            "month",
            "previous_month",
            "top_users",
        }
        actual_keys = set(costs_data.keys())
        if not expected_keys.issubset(actual_keys):
            missing = expected_keys - actual_keys
            raise AssertionError(f"Response missing expected keys: {missing}")
        print("  [6c] Response has all expected keys  ✓")

        # ── PASS ───────────────────────────────────────────────────────
        print("\n=== PASS: Cost report pipeline smoke test passed ===")

    except Exception as exc:
        print(f"\n=== FAIL: {exc} ===")
        sys.exit(1)

    finally:
        # ── Cleanup ────────────────────────────────────────────────────
        if client is not None:
            try:
                if test_user_id:
                    users_coll.delete_one({"_id": ObjectId(test_user_id)})
                    cost_logs_coll.delete_one({"user_id": test_user_id})
                    print("  [cleanup] Deleted test user and cost_log entry")
            except PyMongoError as cleanup_err:
                print(f"  [cleanup] Warning: could not clean up: {cleanup_err}")
            finally:
                client.close()


if __name__ == "__main__":
    main()
