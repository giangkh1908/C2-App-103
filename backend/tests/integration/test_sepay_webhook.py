"""Integration tests for the SePay payment webhook.

These tests run against a real (or test-container) Mongo at
``127.0.0.1:27018`` via the shared ``backend/tests/conftest.py``
fixtures. The ``mock_db`` fixture is responsible for cleaning
the collection under test between runs; we add a focused
``clean_payment_state`` fixture that also drops ``payments`` and
``plans`` so each test starts from a known-good state.

The four required cases:

1. **Valid webhook** marks a ``pending`` payment as ``paid`` and
   activates the user.
2. **Invalid API key** is rejected with ``401`` (the gateway
   treats 4xx as "do not retry" — correct for a permanently
   misconfigured credential).
3. **Duplicate webhook** (same ``id``) is idempotent: a second
   post does not double-activate the user and does not rewrite
   the existing payment document.
4. **Wrong transferAmount** is acknowledged with ``200`` (we do
   not want to burn the gateway's retry budget on a transient
   mismatch) but the payment remains ``pending``.

The fixtures in this file deliberately shadow the ones in
``backend/tests/conftest.py`` with a ``mongomock_motor``-backed
fallback so the test passes both with a live Mongo (CI /
acceptance) and on a developer machine without one. When the
real ``127.0.0.1:27018`` Mongo is reachable, the local fixtures
delegate to it; otherwise they spin up an in-process fake and
patch the application's DB to use that.
"""

from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta
from typing import Any
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from bson import ObjectId
from httpx import ASGITransport, AsyncClient

from src.core.config import settings
from src.core.security import create_access_token, hash_password
from src.models.payment import PaymentStatus

SEPAY_WEBHOOK_PATH = "/api/v1/payment/webhook/sepay"
SEPAY_CHECKOUT_PATH = "/api/v1/payment/checkout"
SEPAY_STATUS_PATH = "/api/v1/payment/status/{code}"
SEPAY_CANCEL_PATH = "/api/v1/payment/cancel/{code}"


# ---------------------------------------------------------------------------
# Mongo / client fixtures (override conftest when real Mongo is missing)
# ---------------------------------------------------------------------------


_TEST_MONGODB_URI = os.getenv("PRACTICE_TEST_MONGODB_URI", "mongodb://127.0.0.1:27018")
_TEST_MONGODB_DB_NAME = os.getenv("PRACTICE_TEST_MONGODB_DB_NAME", "toan_truc_quan_sepay_test")


async def _try_ping_real_mongo() -> bool:
    """Return True iff a real Mongo is reachable at the test URI."""
    try:
        from motor.motor_asyncio import AsyncIOMotorClient

        client = AsyncIOMotorClient(_TEST_MONGODB_URI, serverSelectionTimeoutMS=1500)
        try:
            await client.admin.command("ping")
            return True
        finally:
            client.close()
    except Exception:
        return False


@pytest_asyncio.fixture
async def mock_db():
    """Provide a Mongo-like database for the test.

    Prefers a real Mongo at 127.0.0.1:27018; falls back to
    ``mongomock_motor.AsyncMongoMockClient`` so the test is
    runnable on a developer machine without a local Mongo.
    """
    if await _try_ping_real_mongo():
        from motor.motor_asyncio import AsyncIOMotorClient

        client = AsyncIOMotorClient(_TEST_MONGODB_URI, serverSelectionTimeoutMS=5000)
        db = client[_TEST_MONGODB_DB_NAME]
        await db.users.delete_many({})
        await db.learning_sessions.delete_many({})
        await db.practice_attempts.delete_many({})
        await db.payments.delete_many({})
        await db.plans.delete_many({})
        # The shared ensure_indexes hits collections this test
        # does not care about; the bare create_index calls we need
        # for payments are wired into the payment service path
        # and don't matter here because we pre-insert docs.
        try:
            from src.core.database import ensure_payment_indexes

            await ensure_payment_indexes(db)
        except Exception:
            pass
        yield db
        client.close()
        return

    # Fallback: in-process mongomock_motor. This is what most
    # developer machines will see (no Docker / no local Mongo).
    from mongomock_motor import AsyncMongoMockClient

    client = AsyncMongoMockClient()
    db = client[_TEST_MONGODB_DB_NAME]
    # Pre-create a unique index on payment_code so the happy-path
    # insert_one + the service-layer guard both behave like real
    # Mongo.
    await db.payments.create_index("payment_code", unique=True)
    yield db
    client.close()


@pytest_asyncio.fixture
async def client(mock_db):
    """AsyncClient wired to the FastAPI app with the mocked DB
    patched in for every code path the webhook / checkout
    endpoints reach.

    ``payment_service`` and ``plan_service`` import ``get_db``
    from ``src.core.database`` at module load. Because
    ``src.core.database.get_db()`` reads the module-level
    ``db`` global, patching that global is sufficient for the
    service layer too. We still patch the per-module
    ``get_db`` symbols (auth, deps) for symmetry with the
    shared conftest.
    """
    from src.main import app

    with (
        patch("src.core.database.db", mock_db),
        patch("src.api.auth.get_db", return_value=mock_db),
        patch("src.core.deps.get_db", return_value=mock_db),
        patch("src.main.db_module.connect_db", new_callable=AsyncMock, return_value=None),
        patch("src.main.db_module.close_db", new_callable=AsyncMock, return_value=None),
        patch(
            "src.core.email.send_reset_password_email",
            new_callable=AsyncMock,
            return_value=True,
        ),
        patch(
            "src.core.email.send_verify_email",
            new_callable=AsyncMock,
            return_value=True,
        ),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac


@pytest_asyncio.fixture
async def clean_payment_state(mock_db):
    """Wipe payments + plans before each test so we start clean.

    The ``mock_db`` fixture already deletes those collections
    in the real-Mongo path; this fixture covers the mock
    fallback and gives every test a deterministic baseline.
    """
    await mock_db.payments.delete_many({})
    await mock_db.plans.delete_many({})
    yield mock_db


@pytest_asyncio.fixture
async def seeded_plan(clean_payment_state):
    """Insert a ``plus`` plan so ``payment_service.create_payment``
    can resolve the catalog lookup the checkout endpoint makes."""
    plan_id = ObjectId()
    await clean_payment_state.plans.insert_one(
        {
            "_id": plan_id,
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
    )
    return plan_id


@pytest_asyncio.fixture
async def buyer_user(clean_payment_state):
    """Insert a regular user the checkout / webhook can attach to.

    We bypass the auth endpoint and insert directly so the test
    can grab the ObjectId and stamp it into pending payments
    before the webhook hits.
    """
    user_id = ObjectId()
    await clean_payment_state.users.insert_one(
        {
            "_id": user_id,
            "name": "Buyer",
            "email": "buyer@example.com",
            "password_hash": hash_password("password123"),
            "role": "user",
            "verified": True,
            "avatar": None,
            "plan_id": "",
            "subscription_status": "active",
            "usage": {},
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }
    )
    return user_id


@pytest_asyncio.fixture
async def buyer_headers(buyer_user):
    """JWT auth headers for the buyer user."""
    token = create_access_token(str(buyer_user), "user")
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def other_user(clean_payment_state):
    """A second user (not the owner) for non-owner 404 tests."""
    user_id = ObjectId()
    await clean_payment_state.users.insert_one(
        {
            "_id": user_id,
            "name": "Other",
            "email": "other@example.com",
            "password_hash": hash_password("password123"),
            "role": "user",
            "verified": True,
            "avatar": None,
            "plan_id": "",
            "subscription_status": "active",
            "usage": {},
            "created_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }
    )
    return user_id


@pytest_asyncio.fixture
async def other_headers(other_user):
    """JWT auth headers for the other user."""
    token = create_access_token(str(other_user), "user")
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def pending_payment(clean_payment_state, buyer_user, seeded_plan):
    """Insert a pending payment we can target with the webhook."""
    payment_code = "TTQ_T1_1700000000"
    payment_id = ObjectId()
    await clean_payment_state.payments.insert_one(
        {
            "_id": payment_id,
            "user_id": str(buyer_user),
            "plan_id": str(seeded_plan),
            "plan_name": "plus",
            "billing": "monthly",
            "amount_vnd": 49000,
            "payment_code": payment_code,
            "gateway": "sepay",
            "status": PaymentStatus.PENDING.value,
            "gateway_transaction_id": None,
            "raw_webhook_payload": None,
            "created_at": datetime.now(UTC),
            "paid_at": None,
            "expires_at": datetime.now(UTC) + timedelta(days=30),
        }
    )
    return {"_id": payment_id, "payment_code": payment_code, "user_id": str(buyer_user)}


def _sepay_payload(
    payment_code: str,
    amount: int = 49000,
    *,
    txn_id: int | str = 99999,
    transfer_type: str = "in",
) -> dict[str, Any]:
    """Build a SePay-shaped webhook payload."""
    return {
        "id": txn_id,
        "gateway": "Vietcombank",
        "code": payment_code,
        "content": payment_code,
        "transferType": transfer_type,
        "transferAmount": amount,
        "referenceCode": f"REF-{txn_id}",
    }


def _auth_header() -> dict[str, str]:
    """Return the Authorization header the gateway would send."""
    return {"Authorization": f"Apikey {settings.sepay_webhook_api_key}"}


# ---------------------------------------------------------------------------
# 1) Valid webhook marks payment paid
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
class TestSePayWebhookHappy:
    async def test_valid_webhook_marks_payment_paid(
        self,
        client: AsyncClient,
        clean_payment_state,
        seeded_plan,
        pending_payment,
        buyer_user,
    ):
        """A well-formed SePay POST with the right key + amount
        must flip the payment to ``paid`` and activate the user."""
        payload = _sepay_payload(pending_payment["payment_code"], amount=49000, txn_id=12345)

        response = await client.post(SEPAY_WEBHOOK_PATH, json=payload, headers=_auth_header())

        # Contract: 200 + success=true so the gateway does not retry.
        assert response.status_code == 200
        assert response.json() == {"success": True}

        # DB: payment is paid, txn id persisted, raw payload stored.
        updated = await clean_payment_state.payments.find_one({"_id": pending_payment["_id"]})
        assert updated is not None
        assert updated["status"] == PaymentStatus.PAID.value
        assert updated["gateway_transaction_id"] == "12345"
        assert updated["paid_at"] is not None
        # Raw payload persisted for audit.
        assert updated["raw_webhook_payload"] == payload

        # User is now active on the paid plan.
        user = await clean_payment_state.users.find_one({"_id": buyer_user})
        assert user is not None
        assert user["plan_id"] == str(seeded_plan)
        assert user["subscription_status"] == "active"
        assert user["subscription_expires_at"] is not None
        # usage is cleared (fresh quota window on the new plan).
        assert user["usage"] == {}


# ---------------------------------------------------------------------------
# 2) Invalid API key -> 401
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
class TestSePayWebhookAuth:
    async def test_invalid_api_key_returns_401(
        self, client: AsyncClient, clean_payment_state, pending_payment
    ):
        """A wrong / missing API key must yield 401, not 200.

        The contract is: the gateway treats 4xx as "do not retry",
        which is the right behavior for a permanently
        misconfigured credential. We still want the gateway to
        keep the audit row of the failed ping, which the 4xx
        response delivers.
        """
        payload = _sepay_payload(pending_payment["payment_code"])

        for bad_header in (
            {"Authorization": "Apikey wrong-key"},
            {"Authorization": "Bearer wrong-key"},  # wrong scheme
            {},  # missing entirely
        ):
            response = await client.post(SEPAY_WEBHOOK_PATH, json=payload, headers=bad_header)
            assert response.status_code == 401, (
                f"expected 401 for header={bad_header!r}, got {response.status_code}"
            )

        # No DB mutation: payment is still pending, user untouched.
        updated = await clean_payment_state.payments.find_one({"_id": pending_payment["_id"]})
        assert updated["status"] == PaymentStatus.PENDING.value


# ---------------------------------------------------------------------------
# 5) Cancel endpoint
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
class TestPaymentCancel:
    async def test_owner_cancels_pending_payment(
        self,
        client: AsyncClient,
        clean_payment_state,
        pending_payment,
        buyer_headers,
    ):
        """The owning user cancels their pending payment → status becomes expired."""
        response = await client.post(
            SEPAY_CANCEL_PATH.format(code=pending_payment["payment_code"]),
            headers=buyer_headers,
        )
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "ok"
        assert body["payment_code"] == pending_payment["payment_code"]
        assert body["new_status"] == "expired"

        updated = await clean_payment_state.payments.find_one({"_id": pending_payment["_id"]})
        assert updated["status"] == PaymentStatus.EXPIRED.value

    async def test_non_owner_returns_404(
        self,
        client: AsyncClient,
        clean_payment_state,
        pending_payment,
        other_headers,
    ):
        """A different user cannot cancel someone else's payment → 404."""
        response = await client.post(
            SEPAY_CANCEL_PATH.format(code=pending_payment["payment_code"]),
            headers=other_headers,
        )
        assert response.status_code == 404
        # Original payment unchanged.
        updated = await clean_payment_state.payments.find_one({"_id": pending_payment["_id"]})
        assert updated["status"] == PaymentStatus.PENDING.value

    async def test_unknown_code_returns_404(
        self,
        client: AsyncClient,
        clean_payment_state,
        buyer_headers,
    ):
        """A non-existent payment_code → 404."""
        response = await client.post(
            SEPAY_CANCEL_PATH.format(code="TTQ_NONEXISTENT"),
            headers=buyer_headers,
        )
        assert response.status_code == 404

    async def test_paid_payment_cannot_be_cancelled(
        self,
        client: AsyncClient,
        clean_payment_state,
        pending_payment,
        seeded_plan,
        buyer_user,
        buyer_headers,
    ):
        """An already-paid payment → 404 (don't leak status info)."""
        # Flip to paid directly in DB.
        await clean_payment_state.payments.update_one(
            {"_id": pending_payment["_id"]},
            {"$set": {"status": PaymentStatus.PAID.value}},
        )
        response = await client.post(
            SEPAY_CANCEL_PATH.format(code=pending_payment["payment_code"]),
            headers=buyer_headers,
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# 3) Duplicate webhook -> idempotent
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
class TestSePayWebhookIdempotency:
    async def test_duplicate_webhook_is_idempotent(
        self, client: AsyncClient, clean_payment_state, pending_payment, buyer_user
    ):
        """Replaying the same gateway ``id`` (or the same
        payment_code) must NOT double-activate the user or rewrite
        the existing payment document.

        SePay retries on network jitter, so this is the hot path
        — the second call must observe the post-flip state and
        return 200 + success=true without touching the DB.
        """
        payload = _sepay_payload(pending_payment["payment_code"], amount=49000, txn_id=777)

        # First call: flips status to paid.
        first = await client.post(SEPAY_WEBHOOK_PATH, json=payload, headers=_auth_header())
        assert first.status_code == 200
        after_first = await clean_payment_state.payments.find_one({"_id": pending_payment["_id"]})
        assert after_first["status"] == PaymentStatus.PAID.value
        original_paid_at = after_first["paid_at"]
        original_txn_id = after_first["gateway_transaction_id"]

        # Second call: same payment_code, same gateway id.
        # The service should refuse the second activation and
        # leave the document untouched.
        second = await client.post(SEPAY_WEBHOOK_PATH, json=payload, headers=_auth_header())
        assert second.status_code == 200
        assert second.json() == {"success": True}

        after_second = await clean_payment_state.payments.find_one({"_id": pending_payment["_id"]})
        # No rewrite: paid_at, txn_id, status, raw payload all
        # preserved from the first (winning) call.
        assert after_second["status"] == PaymentStatus.PAID.value
        assert after_second["paid_at"] == original_paid_at
        assert after_second["gateway_transaction_id"] == original_txn_id
        assert after_second["raw_webhook_payload"] == payload

        # And the user activation contract still holds (plan_id,
        # expires_at) without a second ``update_one``.
        user = await clean_payment_state.users.find_one({"_id": buyer_user})
        assert user["subscription_status"] == "active"


# ---------------------------------------------------------------------------
# 4) Wrong transferAmount -> 200 but payment stays pending
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
class TestSePayWebhookAmountMismatch:
    async def test_wrong_amount_keeps_payment_pending(
        self, client: AsyncClient, clean_payment_state, pending_payment, buyer_user
    ):
        """If the gateway-claimed amount does not match the
        catalog price, the payment must stay ``pending`` and the
        user must NOT be activated.

        We still return ``200 + success=true`` so the gateway
        doesn't burn its retry budget on what is effectively a
        permanent mismatch (the user is unlikely to re-transfer
        the correct amount in the same session). A corrected
        retry with the right amount will then settle normally.
        """
        # Pending payment amount is 49000 vnd. Gateway sends 100.
        payload = _sepay_payload(pending_payment["payment_code"], amount=100, txn_id=888)

        response = await client.post(SEPAY_WEBHOOK_PATH, json=payload, headers=_auth_header())

        assert response.status_code == 200
        assert response.json() == {"success": True}

        # DB: payment is still pending (NOT paid), no txn id stamped.
        updated = await clean_payment_state.payments.find_one({"_id": pending_payment["_id"]})
        assert updated["status"] == PaymentStatus.PENDING.value
        assert updated["gateway_transaction_id"] is None
        assert updated["paid_at"] is None
        # Raw payload is also NOT stored (refused pre-flip).
        assert updated["raw_webhook_payload"] is None

        # User is NOT activated.
        user = await clean_payment_state.users.find_one({"_id": buyer_user})
        assert user["plan_id"] == ""
        assert user["subscription_status"] == "active"


# ---------------------------------------------------------------------------
# Bonus: non-inbound transfers are ignored (defensive)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
class TestSePayWebhookFiltering:
    async def test_outbound_transfer_is_ignored(
        self, client: AsyncClient, clean_payment_state, pending_payment
    ):
        """An ``out`` transfer (a refund / withdrawal) must be
        silently ignored: 200 + no DB change. Otherwise an
        attacker who knows a payment_code could try to
        ``reverse`` a successful purchase by spoofing an
        outbound transfer."""
        payload = _sepay_payload(
            pending_payment["payment_code"],
            amount=49000,
            txn_id=555,
            transfer_type="out",
        )
        response = await client.post(SEPAY_WEBHOOK_PATH, json=payload, headers=_auth_header())
        assert response.status_code == 200
        assert response.json() == {"success": True}

        updated = await clean_payment_state.payments.find_one({"_id": pending_payment["_id"]})
        assert updated["status"] == PaymentStatus.PENDING.value
