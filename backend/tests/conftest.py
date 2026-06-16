import os
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

from src.core.database import ensure_indexes
from src.core.security import create_access_token, create_refresh_token, hash_password
from src.main import app
from src.services.practice_dataset import build_exam_catalog, load_rows_from_file, parse_exam_rows

TEST_MONGODB_URI = os.getenv("PRACTICE_TEST_MONGODB_URI", "mongodb://127.0.0.1:27018")
TEST_MONGODB_DB_NAME = os.getenv("PRACTICE_TEST_MONGODB_DB_NAME", "toan_truc_quan_practice_test")


@pytest_asyncio.fixture
async def mongo_client():
    client = AsyncIOMotorClient(TEST_MONGODB_URI, serverSelectionTimeoutMS=5000)
    await client.admin.command("ping")
    yield client
    client.close()


@pytest_asyncio.fixture
async def mock_db(mongo_client):
    db = mongo_client[TEST_MONGODB_DB_NAME]
    await db.users.delete_many({})
    await db.learning_sessions.delete_many({})
    await db.practice_attempts.delete_many({})
    await ensure_indexes(db)
    yield db


@pytest_asyncio.fixture
async def client(mock_db):
    with (
        patch("src.core.database.db", mock_db),
        patch("src.api.auth.get_db", return_value=mock_db),
        patch("src.core.deps.get_db", return_value=mock_db),
        patch("src.main.db_module.connect_db", new_callable=AsyncMock, return_value=None),
        patch("src.main.db_module.close_db", new_callable=AsyncMock, return_value=None),
        patch("src.core.email.send_reset_password_email", new_callable=AsyncMock, return_value=True),
        patch("src.core.email.send_verify_email", new_callable=AsyncMock, return_value=True),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac


@pytest_asyncio.fixture
async def test_user(mock_db):
    user_doc = {
        "name": "Test User",
        "email": "test@example.com",
        "password_hash": hash_password("password123"),
        "role": "user",
        "verified": False,
        "avatar": None,
    }
    result = await mock_db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    return user_doc


@pytest_asyncio.fixture
async def auth_headers(test_user):
    user_id = str(test_user["_id"])
    token = create_access_token(user_id, "user")
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def admin_user(mock_db):
    user_doc = {
        "name": "Admin User",
        "email": "admin@example.com",
        "password_hash": hash_password("admin123"),
        "role": "admin",
        "verified": True,
        "avatar": None,
    }
    result = await mock_db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    return user_doc


@pytest_asyncio.fixture
async def admin_headers(admin_user):
    user_id = str(admin_user["_id"])
    token = create_access_token(user_id, "admin")
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def seeded_practice_data(mock_db):
    dataset_path = Path(__file__).resolve().parents[1] / "data" / "practice" / "vi_grade_school_math_mcq_full.json"
    rows = load_rows_from_file(dataset_path)
    parsed_exams, _stats = parse_exam_rows(rows)
    curated_manifest: dict[int, list[str]] = {}
    for grade in range(1, 6):
        grade_exam_ids = [exam["source_row_id"] for exam in parsed_exams if exam["grade"] == grade][:10]
        curated_manifest[grade] = grade_exam_ids
    return build_exam_catalog(rows, curated_manifest=curated_manifest)


@pytest_asyncio.fixture(autouse=True)
async def patched_practice_catalog(seeded_practice_data):
    with patch("src.services.practice_service.get_runtime_exam_catalog", return_value=seeded_practice_data):
        yield
