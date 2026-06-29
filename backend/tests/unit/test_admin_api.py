"""Unit tests for Admin API endpoints.

Tests cover all 6 endpoints + non-admin authorization check.
MongoDB is mocked via ``unittest.mock`` following the pattern
in ``test_subscription_api.py``.
"""

from contextlib import ExitStack
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId
from httpx import ASGITransport, AsyncClient

from src.core.security import create_access_token, hash_password

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def app():
    from src.main import app

    return app


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.users = AsyncMock()
    db.payments = AsyncMock()
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
        "subscription_expires_at": None,
        "usage": {},
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }
    mock_db.users.find_one = AsyncMock(return_value=user_doc)
    return user_doc


@pytest.fixture
def auth_headers(test_user):
    user_id = str(test_user["_id"])
    token = create_access_token(user_id, "user")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_user(mock_db):
    user_id = ObjectId()
    user_doc = {
        "_id": user_id,
        "name": "Admin User",
        "email": "admin@example.com",
        "password_hash": hash_password("admin123"),
        "role": "admin",
        "verified": True,
        "plan_id": "",
        "subscription_status": "active",
        "subscription_expires_at": None,
        "usage": {},
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }
    mock_db.users.find_one = AsyncMock(return_value=user_doc)
    return user_doc


@pytest.fixture
def admin_headers(admin_user):
    user_id = str(admin_user["_id"])
    token = create_access_token(user_id, "admin")
    return {"Authorization": f"Bearer {token}"}


def _patch_db(mock_db):
    """Return a context manager that patches ``get_db`` across modules."""
    stack = ExitStack()
    stack.enter_context(patch("src.core.database.db", mock_db))
    stack.enter_context(patch("src.api.admin.get_db", return_value=mock_db))
    stack.enter_context(patch("src.core.deps.get_db", return_value=mock_db))
    return stack


def _make_payment_doc(
    *,
    status: str = "pending",
    payment_code: str = "TEST123",
    user_id: str | None = None,
) -> dict:
    """Helper to build a minimal payment document dict."""
    return {
        "_id": ObjectId(),
        "user_id": user_id or str(ObjectId()),
        "plan_id": str(ObjectId()),
        "plan_name": "premium",
        "billing": "monthly",
        "amount_vnd": 199000,
        "payment_code": payment_code,
        "gateway": "sepay",
        "status": status,
        "gateway_transaction_id": None,
        "raw_webhook_payload": None,
        "created_at": datetime.now(UTC),
        "paid_at": None,
        "expires_at": None,
    }


def _make_plan_doc(
    *,
    name: str = "free",
    display_name: dict[str, str] | None = None,
    price_monthly: int = 0,
    price_yearly: int = 0,
) -> dict:
    """Helper to build a minimal plan document dict."""
    return {
        "_id": ObjectId(),
        "name": name,
        "display_name": display_name or {"vi": "Miễn phí", "en": "Free"},
        "price_monthly": price_monthly,
        "price_yearly": price_yearly,
        "is_active": True,
        "sort_order": 0,
        "quotas": {"chat_turns": -1, "tts_requests": -1, "stt_requests": -1, "practice_exams": -1},
        "features": {
            "topics": ["*"],
            "progress_tracking": True,
            "parent_dashboard": True,
            "multi_accounts": True,
        },
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }


class _MockMotorCursor:
    """Async mock for Motor cursor with sort/skip/limit chaining.

    ``__aiter__`` is defined on the class so Python's special-method
    lookup (which ignores instance attributes) picks it up and
    ``async for`` works correctly.
    """

    def __init__(self, docs: list[dict]) -> None:
        self._docs = docs
        self._to_list_result: list | None = None

    def sort(self, *args: object, **kwargs: object) -> "_MockMotorCursor":
        return self

    def skip(self, *args: object, **kwargs: object) -> "_MockMotorCursor":
        return self

    def limit(self, *args: object, **kwargs: object) -> "_MockMotorCursor":
        return self

    def __aiter__(self):
        return self._agen()

    async def _agen(self):
        for d in self._docs:
            yield d

    async def to_list(self, length: int) -> list:
        return self._docs


def _mock_cursor(docs: list[dict]) -> _MockMotorCursor:
    """Return a chainable Motor-cursor look-alike."""
    return _MockMotorCursor(docs)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestAuthorization:
    """Non-admin user must receive 403 on every endpoint."""

    @pytest.mark.asyncio
    async def test_non_admin_gets_403_on_payments(self, app, mock_db, auth_headers):
        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/v1/admin/payments", headers=auth_headers)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_non_admin_gets_403_on_users(self, app, mock_db, auth_headers):
        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/v1/admin/users", headers=auth_headers)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_non_admin_gets_403_on_stats(self, app, mock_db, auth_headers):
        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/v1/admin/stats", headers=auth_headers)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_non_admin_gets_403_on_plans(self, app, mock_db, auth_headers):
        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/v1/admin/plans", headers=auth_headers)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_non_admin_gets_403_on_change_plan(self, app, mock_db, auth_headers):
        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/api/v1/admin/users/000000000000000000000000/change-plan",
                    headers=auth_headers,
                    json={"plan_name": "plus"},
                )
        assert response.status_code == 403


class TestListPayments:
    @pytest.mark.asyncio
    async def test_returns_paginated_results(self, app, mock_db, admin_headers):
        doc = _make_payment_doc()
        mock_db.payments.count_documents = AsyncMock(return_value=1)
        mock_db.payments.find = MagicMock(return_value=_mock_cursor([doc]))
        mock_db.users.find = MagicMock(return_value=_mock_cursor([]))

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/v1/admin/payments", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["page"] == 1
        assert data["page_size"] == 20
        assert data["items"][0]["status"] == "pending"

    @pytest.mark.asyncio
    async def test_filters_by_status(self, app, mock_db, admin_headers):
        mock_db.payments.count_documents = AsyncMock(return_value=0)
        mock_db.payments.find = MagicMock(return_value=_mock_cursor([]))

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get(
                    "/api/v1/admin/payments",
                    headers=admin_headers,
                    params={"status": "paid"},
                )

        assert response.status_code == 200
        # Verify the filter was applied
        call_args = mock_db.payments.count_documents.call_args[0][0]
        assert call_args.get("status") == "paid"

    @pytest.mark.asyncio
    async def test_searches_by_payment_code(self, app, mock_db, admin_headers):
        mock_db.users.find = MagicMock(return_value=_mock_cursor([]))
        mock_db.payments.count_documents = AsyncMock(return_value=0)
        mock_db.payments.find = MagicMock(return_value=_mock_cursor([]))

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get(
                    "/api/v1/admin/payments",
                    headers=admin_headers,
                    params={"search": "TEST"},
                )

        assert response.status_code == 200
        # Verify $or was built with payment_code regex
        count_call = mock_db.payments.count_documents.call_args[0][0]
        assert "$or" in count_call
        assert any(
            expr.get("payment_code", {}).get("$regex") == "TEST" for expr in count_call["$or"]
        )


class TestGetPayment:
    @pytest.mark.asyncio
    async def test_found(self, app, mock_db, admin_headers):
        doc = _make_payment_doc()
        payment_id = str(doc["_id"])
        mock_db.payments.find_one = AsyncMock(return_value=doc)

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get(
                    f"/api/v1/admin/payments/{payment_id}",
                    headers=admin_headers,
                )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == payment_id
        assert data["payment_code"] == "TEST123"

    @pytest.mark.asyncio
    async def test_not_found(self, app, mock_db, admin_headers):
        mock_db.payments.find_one = AsyncMock(return_value=None)

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get(
                    "/api/v1/admin/payments/000000000000000000000000",
                    headers=admin_headers,
                )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_invalid_id_returns_404(self, app, mock_db, admin_headers):
        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get(
                    "/api/v1/admin/payments/invalid-id",
                    headers=admin_headers,
                )

        assert response.status_code == 404


class TestActivatePayment:
    @pytest.mark.asyncio
    async def test_activate_pending_payment(self, app, mock_db, admin_headers):
        payment_id = ObjectId()
        user_id = ObjectId()
        doc = _make_payment_doc(status="pending", user_id=str(user_id))
        doc["_id"] = payment_id

        updated_doc = dict(doc)
        updated_doc["status"] = "paid"
        updated_doc["paid_at"] = datetime.now(UTC)

        mock_db.payments.find_one = AsyncMock(side_effect=[doc, updated_doc])
        mock_db.payments.update_one = AsyncMock()
        mock_db.users.update_one = AsyncMock()

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    f"/api/v1/admin/payments/{payment_id}/activate",
                    headers=admin_headers,
                )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "paid"
        assert data["id"] == str(payment_id)

        # Verify DB writes happened
        mock_db.payments.update_one.assert_called_once()
        mock_db.users.update_one.assert_called_once()

        # Verify user was activated with the plan from payment
        user_update = mock_db.users.update_one.call_args[0][1]["$set"]
        assert user_update["plan_id"] == doc["plan_id"]
        assert user_update["subscription_status"] == "active"

    @pytest.mark.asyncio
    async def test_activate_already_paid_returns_400(self, app, mock_db, admin_headers):
        doc = _make_payment_doc(status="paid")
        payment_id = str(doc["_id"])
        mock_db.payments.find_one = AsyncMock(return_value=doc)
        mock_db.payments.update_one = AsyncMock()
        mock_db.users.update_one = AsyncMock()

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    f"/api/v1/admin/payments/{payment_id}/activate",
                    headers=admin_headers,
                )

        assert response.status_code == 400
        # No mutation should have happened
        mock_db.payments.update_one.assert_not_called()
        mock_db.users.update_one.assert_not_called()

    @pytest.mark.asyncio
    async def test_activate_not_found(self, app, mock_db, admin_headers):
        mock_db.payments.find_one = AsyncMock(return_value=None)

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/api/v1/admin/payments/000000000000000000000000/activate",
                    headers=admin_headers,
                )

        assert response.status_code == 404


class TestListUsers:
    @pytest.mark.asyncio
    async def test_returns_paginated_users(self, app, mock_db, admin_headers):
        user_id = ObjectId()
        user_docs = [
            {
                "_id": user_id,
                "name": "Test User",
                "email": "test@example.com",
                "password_hash": hash_password("pw"),
                "role": "user",
                "verified": True,
                "plan_id": "",
                "subscription_status": "active",
                "subscription_expires_at": None,
                "usage": {},
                "created_at": datetime.now(UTC),
                "updated_at": datetime.now(UTC),
            }
        ]
        mock_db.users.count_documents = AsyncMock(return_value=1)
        mock_db.users.find = MagicMock(return_value=_mock_cursor(user_docs))

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/v1/admin/users", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["email"] == "test@example.com"
        # plan_name should be present (empty when no plan_id is set)
        assert data["items"][0].get("plan_name") == ""

    @pytest.mark.asyncio
    async def test_excludes_password_hash(self, app, mock_db, admin_headers):
        user_docs = [
            {
                "_id": ObjectId(),
                "name": "Test",
                "email": "test@example.com",
                "password_hash": hash_password("pw"),
                "role": "user",
                "verified": True,
                "plan_id": "",
                "subscription_status": "active",
                "subscription_expires_at": None,
                "usage": {},
                "created_at": datetime.now(UTC),
                "updated_at": datetime.now(UTC),
            }
        ]
        mock_db.users.count_documents = AsyncMock(return_value=1)
        mock_db.users.find = MagicMock(return_value=_mock_cursor(user_docs))

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/v1/admin/users", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert "password_hash" not in data["items"][0]
        assert "plan_name" in data["items"][0]

    @pytest.mark.asyncio
    async def test_includes_plan_name_when_plan_id_set(self, app, mock_db, admin_headers):
        plan_doc = _make_plan_doc(name="premium", price_monthly=99000)
        plan_id_str = str(plan_doc["_id"])
        user_docs = [
            {
                "_id": ObjectId(),
                "name": "Test",
                "email": "test@example.com",
                "password_hash": hash_password("pw"),
                "role": "user",
                "verified": True,
                "plan_id": plan_id_str,
                "subscription_status": "active",
                "subscription_expires_at": None,
                "usage": {},
                "created_at": datetime.now(UTC),
                "updated_at": datetime.now(UTC),
            }
        ]
        mock_db.users.count_documents = AsyncMock(return_value=1)
        mock_db.users.find = MagicMock(return_value=_mock_cursor(user_docs))
        mock_db.plans.find = MagicMock(return_value=_mock_cursor([plan_doc]))

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/v1/admin/users", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["items"][0]["plan_name"] == "premium"


class TestExtendSubscription:
    @pytest.mark.asyncio
    async def test_extend_no_existing_expiry(self, app, mock_db, admin_headers, admin_user):
        user_id = ObjectId()
        user_doc = {
            "_id": user_id,
            "name": "Test User",
            "email": "test@example.com",
            "password_hash": hash_password("pw"),
            "role": "user",
            "verified": True,
            "plan_id": "",
            "subscription_status": "expired",
            "subscription_expires_at": None,
            "usage": {},
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }
        updated_doc = dict(user_doc)
        updated_doc["subscription_status"] = "active"
        updated_doc["subscription_expires_at"] = datetime.now(UTC) + timedelta(days=30)

        # First call = auth dependency looks up admin user;
        # second call = endpoint finds target user;
        # third call = endpoint reads updated user.
        mock_db.users.find_one = AsyncMock(side_effect=[admin_user, user_doc, updated_doc])
        mock_db.users.update_one = AsyncMock()

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    f"/api/v1/admin/users/{user_id}/extend",
                    headers=admin_headers,
                )

        assert response.status_code == 200
        data = response.json()
        assert data["subscription_status"] == "active"
        assert data["id"] == str(user_id)

        mock_db.users.update_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_extend_with_existing_expiry(self, app, mock_db, admin_headers, admin_user):
        user_id = ObjectId()
        existing_expiry = datetime.now(UTC) + timedelta(days=10)
        user_doc = {
            "_id": user_id,
            "name": "Test User",
            "email": "test@example.com",
            "password_hash": hash_password("pw"),
            "role": "user",
            "verified": True,
            "plan_id": "some_plan",
            "subscription_status": "active",
            "subscription_expires_at": existing_expiry,
            "usage": {},
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }
        updated_doc = dict(user_doc)
        updated_doc["subscription_expires_at"] = existing_expiry + timedelta(days=30)

        # First call = auth dependency looks up admin user;
        # second call = endpoint finds target user;
        # third call = endpoint reads updated user.
        mock_db.users.find_one = AsyncMock(side_effect=[admin_user, user_doc, updated_doc])
        mock_db.users.update_one = AsyncMock()

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    f"/api/v1/admin/users/{user_id}/extend",
                    headers=admin_headers,
                )

        assert response.status_code == 200
        # Verify the update used existing_expiry + 30 days
        set_args = mock_db.users.update_one.call_args[0][1]["$set"]
        assert set_args["subscription_status"] == "active"
        assert "subscription_expires_at" in set_args

    @pytest.mark.asyncio
    async def test_extend_not_found(self, app, mock_db, admin_headers, admin_user):
        # First call returns admin for auth, second returns None (not found)
        mock_db.users.find_one = AsyncMock(side_effect=[admin_user, None])

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/api/v1/admin/users/000000000000000000000000/extend",
                    headers=admin_headers,
                )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_zero_revenue_when_no_paid_payments(self, app, mock_db, admin_headers):
        mock_aggregate_cursor = AsyncMock()
        mock_aggregate_cursor.to_list = AsyncMock(return_value=[])
        mock_db.payments.aggregate = MagicMock(return_value=mock_aggregate_cursor)
        mock_db.payments.count_documents = AsyncMock(return_value=0)
        mock_db.users.count_documents = AsyncMock(return_value=0)

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/v1/admin/stats", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["total_revenue"] == 0
        assert data["total_subscriptions"] == 0
        assert data["pending_payments"] == 0
        assert data["active_users"] == 0


class TestListPlans:
    @pytest.mark.asyncio
    @patch("src.api.admin.get_all_plans")
    async def test_returns_plan_list(self, mock_get_all_plans, app, mock_db, admin_headers):
        from src.models.plan import PlanInDB

        plan_docs = [
            _make_plan_doc(name="free", price_monthly=0, price_yearly=0),
            _make_plan_doc(
                name="plus",
                display_name={"vi": "Plus", "en": "Plus"},
                price_monthly=49000,
                price_yearly=399000,
            ),
        ]
        plans = [PlanInDB.from_mongo(d) for d in plan_docs]
        mock_get_all_plans.return_value = plans

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/v1/admin/plans", headers=admin_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] == "free"
        assert data[0]["price_monthly"] == 0
        assert data[1]["name"] == "plus"
        assert data[1]["price_monthly"] == 49000


class TestChangePlan:
    @pytest.mark.asyncio
    @patch("src.api.admin.get_plan_by_name")
    async def test_change_plan_success(
        self, mock_get_plan_by_name, app, mock_db, admin_headers, admin_user
    ):
        from src.models.plan import PlanInDB

        user_id = ObjectId()
        user_doc = {
            "_id": user_id,
            "name": "Test User",
            "email": "test@example.com",
            "password_hash": hash_password("pw"),
            "role": "user",
            "verified": True,
            "plan_id": "old_plan_id",
            "subscription_status": "active",
            "subscription_expires_at": None,
            "usage": {},
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }
        updated_doc = dict(user_doc)
        updated_doc["plan_id"] = str(ObjectId())

        plan_doc = _make_plan_doc(name="plus", price_monthly=49000)
        plan = PlanInDB.from_mongo(plan_doc)
        mock_get_plan_by_name.return_value = plan

        # auth lookup -> find target user -> find updated user
        mock_db.users.find_one = AsyncMock(side_effect=[admin_user, user_doc, updated_doc])
        mock_db.users.update_one = AsyncMock()

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    f"/api/v1/admin/users/{user_id}/change-plan",
                    headers=admin_headers,
                    json={"plan_name": "plus"},
                )

        assert response.status_code == 200
        data = response.json()
        assert data["plan_name"] == "plus"
        assert data["id"] == str(user_id)

        # Verify DB update was called with correct fields
        mock_db.users.update_one.assert_called_once()
        set_args = mock_db.users.update_one.call_args[0][1]["$set"]
        assert set_args["plan_id"] == plan.id
        assert set_args["subscription_status"] == "active"
        assert set_args["subscription_expires_at"] is None

    @pytest.mark.asyncio
    @patch("src.api.admin.get_plan_by_name")
    async def test_change_plan_invalid_plan(
        self, mock_get_plan_by_name, app, mock_db, admin_headers, admin_user
    ):
        user_id = ObjectId()
        user_doc = {
            "_id": user_id,
            "name": "Test User",
            "email": "test@example.com",
            "password_hash": hash_password("pw"),
            "role": "user",
            "verified": True,
            "plan_id": "",
            "subscription_status": "active",
            "subscription_expires_at": None,
            "usage": {},
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }

        mock_get_plan_by_name.return_value = None
        mock_db.users.find_one = AsyncMock(side_effect=[admin_user, user_doc])

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    f"/api/v1/admin/users/{user_id}/change-plan",
                    headers=admin_headers,
                    json={"plan_name": "nonexistent"},
                )

        assert response.status_code == 404
        data = response.json()
        assert "Không tìm thấy gói" in data.get("detail", "")

        # No update should have happened
        mock_db.users.update_one.assert_not_called()

    @pytest.mark.asyncio
    async def test_change_plan_user_not_found(self, app, mock_db, admin_headers, admin_user):
        mock_db.users.find_one = AsyncMock(side_effect=[admin_user, None])

        with _patch_db(mock_db):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(
                    "/api/v1/admin/users/000000000000000000000000/change-plan",
                    headers=admin_headers,
                    json={"plan_name": "plus"},
                )

        assert response.status_code == 404
        data = response.json()
        assert "Không tìm thấy người dùng" in data.get("detail", "")
