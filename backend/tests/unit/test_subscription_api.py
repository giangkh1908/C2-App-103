"""Unit tests for Subscription API."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId
from fastapi import FastAPI
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
    user_doc = {
        "_id": user_id,
        "name": "Test User",
        "email": "test@example.com",
        "password_hash": hash_password("password123"),
        "role": "user",
        "verified": True,
        "plan_id": "",
        "subscription_status": "active",
        "usage": {},
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


class TestUpgradePlan:
    @pytest.mark.asyncio
    async def test_upgrade_to_plus(self, app, mock_db, auth_headers, mock_plan):
        mock_db.plans.find_one = AsyncMock(return_value=mock_plan)
        mock_db.users.update_one = AsyncMock()

        with patch("src.core.database.db", mock_db):
            with patch("src.api.subscription.get_db", return_value=mock_db):
                with patch("src.core.deps.get_db", return_value=mock_db):
                    transport = ASGITransport(app=app)
                    async with AsyncClient(transport=transport, base_url="http://test") as client:
                        response = await client.post(
                            "/api/v1/subscription/upgrade",
                            headers=auth_headers,
                            json={"plan_name": "plus"},
                        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"

    @pytest.mark.asyncio
    async def test_upgrade_to_premium(self, app, mock_db, auth_headers, mock_plan):
        mock_plan["name"] = "premium"
        mock_db.plans.find_one = AsyncMock(return_value=mock_plan)
        mock_db.users.update_one = AsyncMock()

        with patch("src.core.database.db", mock_db):
            with patch("src.api.subscription.get_db", return_value=mock_db):
                with patch("src.core.deps.get_db", return_value=mock_db):
                    transport = ASGITransport(app=app)
                    async with AsyncClient(transport=transport, base_url="http://test") as client:
                        response = await client.post(
                            "/api/v1/subscription/upgrade",
                            headers=auth_headers,
                            json={"plan_name": "premium"},
                        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_upgrade_to_free(self, app, mock_db, auth_headers, mock_plan):
        mock_plan["name"] = "free"
        mock_plan["price_monthly"] = 0
        mock_db.plans.find_one = AsyncMock(return_value=mock_plan)
        mock_db.users.update_one = AsyncMock()

        with patch("src.core.database.db", mock_db):
            with patch("src.api.subscription.get_db", return_value=mock_db):
                with patch("src.core.deps.get_db", return_value=mock_db):
                    transport = ASGITransport(app=app)
                    async with AsyncClient(transport=transport, base_url="http://test") as client:
                        response = await client.post(
                            "/api/v1/subscription/upgrade",
                            headers=auth_headers,
                            json={"plan_name": "free"},
                        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_upgrade_invalid_plan_name(self, app, mock_db, auth_headers):
        with patch("src.core.database.db", mock_db):
            with patch("src.api.subscription.get_db", return_value=mock_db):
                with patch("src.core.deps.get_db", return_value=mock_db):
                    transport = ASGITransport(app=app)
                    async with AsyncClient(transport=transport, base_url="http://test") as client:
                        response = await client.post(
                            "/api/v1/subscription/upgrade",
                            headers=auth_headers,
                            json={"plan_name": "invalid"},
                        )

        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_upgrade_plan_not_found(self, app, mock_db, auth_headers):
        mock_db.plans.find_one = AsyncMock(return_value=None)

        with patch("src.core.database.db", mock_db):
            with patch("src.api.subscription.get_db", return_value=mock_db):
                with patch("src.core.deps.get_db", return_value=mock_db):
                    transport = ASGITransport(app=app)
                    async with AsyncClient(transport=transport, base_url="http://test") as client:
                        response = await client.post(
                            "/api/v1/subscription/upgrade",
                            headers=auth_headers,
                            json={"plan_name": "nonexistent"},
                        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_upgrade_unauthenticated(self, app, mock_db):
        with patch("src.core.database.db", mock_db):
            with patch("src.api.subscription.get_db", return_value=mock_db):
                with patch("src.core.deps.get_db", return_value=mock_db):
                    transport = ASGITransport(app=app)
                    async with AsyncClient(transport=transport, base_url="http://test") as client:
                        response = await client.post(
                            "/api/v1/subscription/upgrade",
                            json={"plan_name": "plus"},
                        )

        assert response.status_code == 401
