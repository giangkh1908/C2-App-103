import asyncio
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from mongomock_motor import AsyncMongoMockClient

from main import app
from core.security import create_access_token, create_refresh_token, hash_password


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def mock_db():
    client = AsyncMongoMockClient()
    db = client["test_db"]
    yield db
    client.close()


@pytest_asyncio.fixture
async def client(mock_db):
    with patch("core.database.db", mock_db), \
         patch("api.auth.get_db", return_value=mock_db), \
         patch("core.deps.get_db", return_value=mock_db), \
         patch("core.email.send_reset_password_email", new_callable=AsyncMock, return_value=True), \
         patch("core.email.send_verify_email", new_callable=AsyncMock, return_value=True):

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
