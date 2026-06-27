"""Unit tests for User API."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient

from src.core.security import create_access_token, hash_password


@pytest.fixture
def app():
    from src.main import app

    return app


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.users = AsyncMock()
    db.plans = AsyncMock()
    return db


@pytest.fixture
def test_user(mock_db):
    user_id = ObjectId()
    plan_id = ObjectId()
    user_doc = {
        "_id": user_id,
        "name": "Test User",
        "email": "test@example.com",
        "password_hash": hash_password("password123"),
        "role": "user",
        "verified": True,
        "plan_id": str(plan_id),
        "subscription_status": "active",
        "usage": {
            "chat_turns": {"count": 5, "first_used_at": None},
        },
    }
    mock_db.users.find_one = AsyncMock(return_value=user_doc)
    return user_doc


@pytest.fixture
def auth_headers(test_user):
    user_id = str(test_user["_id"])
    token = create_access_token(user_id, "user")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_plan():
    return {
        "_id": ObjectId(),
        "name": "plus",
        "display_name": {"vi": "Plus", "en": "Plus"},
        "price_monthly": 49000,
        "price_yearly": 399000,
        "quotas": {
            "chat_turns": -1,
            "tts_requests": -1,
            "stt_requests": -1,
            "practice_exams": -1,
        },
        "features": {
            "topics": ["*"],
            "progress_tracking": True,
            "parent_dashboard": False,
            "multi_accounts": False,
        },
        "is_active": True,
        "sort_order": 1,
    }


class TestGetMyUsage:
    @pytest.mark.asyncio
    async def test_get_usage(self, app, mock_db, auth_headers, mock_plan):
        mock_db.plans.find_one = AsyncMock(return_value=mock_plan)

        with patch("src.core.database.db", mock_db):
            with patch("src.api.user.get_db", return_value=mock_db):
                with patch("src.core.deps.get_db", return_value=mock_db):
                    transport = ASGITransport(app=app)
                    async with AsyncClient(transport=transport, base_url="http://test") as client:
                        response = await client.get(
                            "/api/v1/user/usage",
                            headers=auth_headers,
                        )

        assert response.status_code == 200
        data = response.json()
        assert "plan" in data
        assert "usage" in data
        assert "chatTurns" in data["usage"]

    @pytest.mark.asyncio
    async def test_get_usage_auto_assigns_plan(self, app, mock_db, auth_headers, mock_plan):
        # User with no plan_id
        user_id = ObjectId()
        mock_db.users.find_one = AsyncMock(
            side_effect=[
                {
                    "_id": user_id,
                    "name": "Test User",
                    "email": "test@example.com",
                    "password_hash": hash_password("password123"),
                    "role": "user",
                    "verified": True,
                    "plan_id": "",
                    "subscription_status": "active",
                    "usage": {},
                },
                mock_plan,
            ]
        )
        mock_db.users.update_one = AsyncMock()
        mock_db.plans.find_one = AsyncMock(return_value=mock_plan)

        token = create_access_token(str(user_id), "user")
        headers = {"Authorization": f"Bearer {token}"}

        with patch("src.core.database.db", mock_db):
            with patch("src.api.user.get_db", return_value=mock_db):
                with patch("src.core.deps.get_db", return_value=mock_db):
                    transport = ASGITransport(app=app)
                    async with AsyncClient(transport=transport, base_url="http://test") as client:
                        response = await client.get(
                            "/api/v1/user/usage",
                            headers=headers,
                        )

        assert response.status_code == 200
        mock_db.users.update_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_usage_unauthenticated(self, app, mock_db):
        with patch("src.core.database.db", mock_db):
            with patch("src.api.user.get_db", return_value=mock_db):
                with patch("src.core.deps.get_db", return_value=mock_db):
                    transport = ASGITransport(app=app)
                    async with AsyncClient(transport=transport, base_url="http://test") as client:
                        response = await client.get("/api/v1/user/usage")

        assert response.status_code == 401
