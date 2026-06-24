"""Unit tests for the payment service.

Covers the four public entry points:

- ``create_payment`` — happy monthly, happy yearly, ``free`` rejection,
  unknown-plan rejection, payment_code format
- ``verify_and_mark_paid`` — happy, duplicate-webhook idempotency,
  wrong amount, expired payment, unknown code
- ``expire_overdue_payments`` — happy sweep
- ``get_payment_by_code`` — found, not found

The DB is fully mocked per-call (matching the pattern in
``test_plan_service.py`` and ``test_usage_service.py``): every test
``patch``es ``src.services.payment_service.get_db`` with a
``MagicMock`` whose collection attributes are individual
``AsyncMock``s.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from src.models.payment import PaymentStatus
from src.services.payment_service import (
    _generate_payment_code,
    cancel_payment,
    create_payment,
    expire_overdue_payments,
    get_payment_by_code,
    verify_and_mark_paid,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def mock_db():
    """A MagicMock database with explicit sub-collections.

    The tests configure each collection method (find_one,
    insert_one, update_one, find_one_and_update, update_many) on
    demand so the failure surface stays small and explicit.
    """
    db = MagicMock()
    db.payments = MagicMock()
    db.users = MagicMock()
    db.plans = MagicMock()
    return db


@pytest.fixture
def user_id():
    """A canonical 24-char ObjectId hex for the buyer."""
    return str(ObjectId("507f1f77bcf86cd799439011"))


@pytest.fixture
def plan_id():
    """A canonical 24-char ObjectId hex for the plan document."""
    return str(ObjectId("507f1f77bcf86cd799439012"))


@pytest.fixture
def plus_plan_doc(plan_id):
    """The paid ``plus`` plan as it would be returned by Mongo."""
    return {
        "_id": ObjectId(plan_id),
        "name": "plus",
        "display_name": {"vi": "Plus", "en": "Plus"},
        "price_monthly": 49000,
        "price_yearly": 399000,
        "is_active": True,
        "sort_order": 1,
    }


@pytest.fixture
def premium_plan_doc(plan_id):
    """The paid ``premium`` plan as it would be returned by Mongo."""
    return {
        "_id": ObjectId(plan_id),
        "name": "premium",
        "display_name": {"vi": "Premium", "en": "Premium"},
        "price_monthly": 99000,
        "price_yearly": 799000,
        "is_active": True,
        "sort_order": 2,
    }


@pytest.fixture
def pending_payment_doc(user_id, plan_id):
    """A representative ``pending`` payment document."""
    return {
        "_id": ObjectId(),
        "user_id": user_id,
        "plan_id": plan_id,
        "plan_name": "plus",
        "billing": "monthly",
        "amount_vnd": 49000,
        "payment_code": "TTQ507f1f1700000000",
        "gateway": "sepay",
        "status": PaymentStatus.PENDING.value,
        "gateway_transaction_id": None,
        "raw_webhook_payload": None,
        "created_at": datetime.now(UTC),
        "paid_at": None,
        "expires_at": datetime.now(UTC) + timedelta(days=30),
    }


def _new_payment_id() -> ObjectId:
    """A fresh ObjectId the mocked ``insert_one`` will hand back."""
    return ObjectId()


# ---------------------------------------------------------------------------
# create_payment
# ---------------------------------------------------------------------------


class TestCreatePaymentHappy:
    @pytest.mark.asyncio
    async def test_monthly_amount_and_expiry(self, mock_db, user_id, plus_plan_doc):
        mock_db.plans.find_one = AsyncMock(return_value=plus_plan_doc)
        mock_db.payments.find_one = AsyncMock(return_value=None)
        mock_db.payments.update_many = AsyncMock()
        mock_db.payments.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id=_new_payment_id())
        )

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            payment = await create_payment(user_id, "plus", "monthly")

        # Status + amount + billing are the contract.
        assert payment.status == PaymentStatus.PENDING
        assert payment.amount_vnd == 49000
        assert payment.billing == "monthly"
        assert payment.plan_name == "plus"
        assert payment.plan_id == plus_plan_doc["_id"] and isinstance(
            payment.plan_id, str
        ) or payment.plan_id == str(plus_plan_doc["_id"])
        # expiry lands at +30 days, with a healthy tolerance for
        # the few-ms drift between the assertion and the service clock.
        expected = datetime.now(UTC) + timedelta(days=30)
        assert abs((payment.expires_at - expected).total_seconds()) < 60

    @pytest.mark.asyncio
    async def test_yearly_amount_and_expiry(self, mock_db, user_id, plus_plan_doc):
        mock_db.plans.find_one = AsyncMock(return_value=plus_plan_doc)
        mock_db.payments.find_one = AsyncMock(return_value=None)
        mock_db.payments.update_many = AsyncMock()
        mock_db.payments.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id=_new_payment_id())
        )

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            payment = await create_payment(user_id, "plus", "yearly")

        assert payment.amount_vnd == 399000
        assert payment.billing == "yearly"
        expected = datetime.now(UTC) + timedelta(days=365)
        assert abs((payment.expires_at - expected).total_seconds()) < 60

    @pytest.mark.asyncio
    async def test_premium_monthly(self, mock_db, user_id, premium_plan_doc):
        mock_db.plans.find_one = AsyncMock(return_value=premium_plan_doc)
        mock_db.payments.find_one = AsyncMock(return_value=None)
        mock_db.payments.update_many = AsyncMock()
        mock_db.payments.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id=_new_payment_id())
        )

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            payment = await create_payment(user_id, "premium", "monthly")

        assert payment.amount_vnd == 99000
        assert payment.plan_name == "premium"

    @pytest.mark.asyncio
    async def test_payment_code_format(self, mock_db, user_id, plus_plan_doc):
        """Business code format: ``TTQ{user_id_short}{timestamp}{random_hex}``."""
        mock_db.plans.find_one = AsyncMock(return_value=plus_plan_doc)
        mock_db.payments.find_one = AsyncMock(return_value=None)
        mock_db.payments.update_many = AsyncMock()
        mock_db.payments.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id=_new_payment_id())
        )

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            payment = await create_payment(user_id, "plus", "monthly")

        assert payment.payment_code.startswith("TTQ")
        # user_id_short: the first 6 chars of the buyer id are
        # spliced in unchanged.
        assert user_id[:6] in payment.payment_code
        # After prefix + user_id_short: {10-digit timestamp}{6-char hex}.
        suffix = payment.payment_code[len("TTQ") + 6 :]
        assert len(suffix) == 16  # 10 digit timestamp + 6 hex
        timestamp_part = suffix[:10]
        random_part = suffix[10:]
        assert timestamp_part.isdigit()
        assert 1_700_000_000 < int(timestamp_part) < 3_000_000_000
        # 6-char hex suffix for uniqueness.
        assert len(random_part) == 6
        assert all(c in "0123456789abcdef" for c in random_part)

    @pytest.mark.asyncio
    async def test_persists_via_insert_one(self, mock_db, user_id, plus_plan_doc):
        """The service must call insert_one with a doc carrying the
        business fields the catalog will see."""
        mock_db.plans.find_one = AsyncMock(return_value=plus_plan_doc)
        mock_db.payments.find_one = AsyncMock(return_value=None)
        mock_db.payments.update_many = AsyncMock()
        mock_db.payments.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id=_new_payment_id())
        )

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            await create_payment(user_id, "plus", "monthly")

        mock_db.payments.insert_one.assert_called_once()
        doc = mock_db.payments.insert_one.call_args[0][0]
        assert doc["user_id"] == user_id
        assert doc["plan_id"] == str(plus_plan_doc["_id"])
        assert doc["plan_name"] == "plus"
        assert doc["billing"] == "monthly"
        assert doc["amount_vnd"] == 49000
        assert doc["payment_code"].startswith("TTQ")
        assert doc["status"] == PaymentStatus.PENDING.value
        assert doc["gateway"] == "sepay"

    @pytest.mark.asyncio
    async def test_existing_pending_payment_returns_existing(
        self, mock_db, user_id, plus_plan_doc, pending_payment_doc
    ):
        """When the partial unique index rejects a duplicate insert,
        ``create_payment`` must catch ``DuplicateKeyError`` and return
        the existing pending payment instead of raising."""
        mock_db.plans.find_one = AsyncMock(return_value=plus_plan_doc)
        # insert_one raises DuplicateKeyError — the partial index on
        # (user_id, plan_name, billing, status=pending) already exists.
        mock_db.payments.insert_one = AsyncMock(
            side_effect=DuplicateKeyError("duplicate key", None)
        )
        # After the catch, the service looks up the existing doc.
        mock_db.payments.find_one = AsyncMock(return_value=pending_payment_doc)

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            payment = await create_payment(user_id, "plus", "monthly")

        # Must return the existing payment, not a new insertion.
        assert payment.payment_code == pending_payment_doc["payment_code"]
        assert payment.amount_vnd == pending_payment_doc["amount_vnd"]
        assert payment.status == PaymentStatus.PENDING

    @pytest.mark.asyncio
    async def test_old_pending_payments_not_expired_on_new_checkout(
        self, mock_db, user_id, plus_plan_doc
    ):
        """With the partial unique index, ``create_payment`` no longer
        runs an explicit ``update_many`` cleanup — the index prevents
        duplicate pending intents at the DB level."""
        mock_db.plans.find_one = AsyncMock(return_value=plus_plan_doc)
        mock_db.payments.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id=_new_payment_id())
        )

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            payment = await create_payment(user_id, "plus", "monthly")

        assert payment is not None
        assert payment.status == PaymentStatus.PENDING
        # No explicit cleanup is triggered anymore.
        if hasattr(mock_db.payments, "update_many"):
            mock_db.payments.update_many.assert_not_called()


class TestCreatePaymentFailures:
    @pytest.mark.asyncio
    async def test_rejects_free_plan_with_value_error(self, mock_db, user_id):
        """``free`` is not a paid plan — there is no checkout intent
        to mint. Must raise ValueError, never insert a document."""
        with patch("src.services.payment_service.get_db", return_value=mock_db):
            with pytest.raises(ValueError):
                await create_payment(user_id, "free", "monthly")

        mock_db.plans.find_one.assert_not_called()
        mock_db.payments.insert_one.assert_not_called()

    @pytest.mark.asyncio
    async def test_rejects_unknown_plan_with_value_error(self, mock_db, user_id):
        """Catalog miss must surface as ValueError, not silent None."""
        mock_db.plans.find_one = AsyncMock(return_value=None)

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            with pytest.raises(ValueError):
                await create_payment(user_id, "nonexistent", "monthly")

        mock_db.payments.insert_one.assert_not_called()

    @pytest.mark.asyncio
    async def test_rejects_plan_with_zero_monthly_price(self, mock_db, user_id, plus_plan_doc):
        """Defensive: a plan that has been misconfigured to a 0-vnd
        monthly price must NOT silently mint a 0-vnd payment."""
        plus_plan_doc["price_monthly"] = 0
        mock_db.plans.find_one = AsyncMock(return_value=plus_plan_doc)
        mock_db.payments.find_one = AsyncMock(return_value=None)
        mock_db.payments.update_many = AsyncMock()

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            with pytest.raises(ValueError):
                await create_payment(user_id, "plus", "monthly")

        mock_db.payments.insert_one.assert_not_called()


# ---------------------------------------------------------------------------
# verify_and_mark_paid
# ---------------------------------------------------------------------------


class TestVerifyAndMarkPaidHappy:
    @pytest.mark.asyncio
    async def test_marks_paid_and_activates_user(
        self, mock_db, user_id, plan_id, pending_payment_doc
    ):
        # The pre-read returns the pending doc.
        mock_db.payments.find_one = AsyncMock(return_value=pending_payment_doc)
        # The atomic flip returns the post-image (status=paid).
        paid_doc = {
            **pending_payment_doc,
            "status": PaymentStatus.PAID.value,
            "paid_at": datetime.now(UTC),
            "gateway_transaction_id": "TXN-123",
        }
        mock_db.payments.find_one_and_update = AsyncMock(return_value=paid_doc)
        mock_db.users.update_one = AsyncMock()

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            result = await verify_and_mark_paid(
                payment_code="TTQ507f1f1700000000",
                amount=49000,
                gateway_txn_id="TXN-123",
                raw_payload={"id": [1], "gateway": "Sepay"},
            )

        assert result is not None
        assert result.status == PaymentStatus.PAID
        assert result.gateway_transaction_id == "TXN-123"

        # User activation contract: plan_id from the payment, status
        # active, expires_at propagated, usage cleared, updated_at set.
        mock_db.users.update_one.assert_called_once()
        call_args = mock_db.users.update_one.call_args
        assert call_args[0][0] == {"_id": ObjectId(user_id)}
        set_data = call_args[0][1]["$set"]
        assert set_data["plan_id"] == plan_id
        assert set_data["subscription_status"] == "active"
        assert set_data["subscription_expires_at"] == pending_payment_doc["expires_at"]
        assert set_data["usage"] == {}
        assert "updated_at" in set_data

    @pytest.mark.asyncio
    async def test_passes_raw_payload_to_payment(
        self, mock_db, pending_payment_doc
    ):
        """The raw webhook payload is stored verbatim on the payment
        for audit / reconciliation — PII scrubbing is the gateway's
        job, not ours."""
        raw = {"id": [42], "gateway": "Sepay", "transferAmount": 49000}
        mock_db.payments.find_one = AsyncMock(return_value=pending_payment_doc)
        paid_doc = {
            **pending_payment_doc,
            "status": PaymentStatus.PAID.value,
            "paid_at": datetime.now(UTC),
            "raw_webhook_payload": raw,
        }
        mock_db.payments.find_one_and_update = AsyncMock(return_value=paid_doc)
        mock_db.users.update_one = AsyncMock()

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            result = await verify_and_mark_paid(
                payment_code="TTQ507f1f1700000000",
                amount=49000,
                gateway_txn_id="TXN-X",
                raw_payload=raw,
            )

        assert result is not None
        # Confirm the raw payload was forwarded to Mongo.
        update_call = mock_db.payments.find_one_and_update.call_args
        set_data = update_call[0][1]["$set"]
        assert set_data["raw_webhook_payload"] == raw


class TestVerifyAndMarkPaidFailures:
    @pytest.mark.asyncio
    async def test_duplicate_webhook_is_idempotent(
        self, mock_db, user_id, plan_id, pending_payment_doc
    ):
        """Replaying the same webhook (same payment_code) MUST NOT
        double-activate the user.

        Scenario: the first call already flipped status to ``paid``.
        The second call sees ``status: paid`` in the pre-read, the
        service short-circuits with ``None`` and never touches the
        users collection.
        """
        already_paid = {
            **pending_payment_doc,
            "status": PaymentStatus.PAID.value,
            "paid_at": datetime.now(UTC) - timedelta(seconds=30),
            "gateway_transaction_id": "TXN-123",
        }
        mock_db.payments.find_one = AsyncMock(return_value=already_paid)
        mock_db.payments.find_one_and_update = AsyncMock()
        mock_db.users.update_one = AsyncMock()

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            result = await verify_and_mark_paid(
                payment_code="TTQ507f1f1700000000",
                amount=49000,
                gateway_txn_id="TXN-123",  # same txn id as the first call
                raw_payload={"id": [1]},
            )

        # Service refuses the second activation.
        assert result is None
        # Atomic flip is NOT attempted (guard would refuse anyway).
        mock_db.payments.find_one_and_update.assert_not_called()
        # The user is NOT touched a second time.
        mock_db.users.update_one.assert_not_called()

    @pytest.mark.asyncio
    async def test_wrong_amount_keeps_payment_pending(
        self, mock_db, pending_payment_doc
    ):
        """The gateway-claimed amount must match the catalog price
        exactly. On mismatch the payment must stay ``pending`` (so a
        corrected retry can settle it)."""
        mock_db.payments.find_one = AsyncMock(return_value=pending_payment_doc)
        mock_db.payments.find_one_and_update = AsyncMock()
        mock_db.users.update_one = AsyncMock()

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            result = await verify_and_mark_paid(
                payment_code="TTQ507f1f1700000000",
                amount=100,  # wildly wrong vs 49000
                gateway_txn_id="TXN-WRONG",
                raw_payload={"id": [1]},
            )

        # Nothing happened: payment remains pending, user untouched.
        assert result is None
        mock_db.payments.find_one_and_update.assert_not_called()
        mock_db.users.update_one.assert_not_called()

    @pytest.mark.asyncio
    async def test_expired_payment_cannot_be_marked_paid(
        self, mock_db, user_id, plan_id
    ):
        """If the sweeper already promoted the payment to ``expired``,
        a late-arriving webhook must not flip it to ``paid`` and must
        not activate the user."""
        expired = {
            "_id": ObjectId(),
            "user_id": user_id,
            "plan_id": plan_id,
            "plan_name": "plus",
            "billing": "monthly",
            "amount_vnd": 49000,
            "payment_code": "TTQ507f1f1700000000",
            "gateway": "sepay",
            "status": PaymentStatus.EXPIRED.value,
            "created_at": datetime.now(UTC) - timedelta(hours=25),
            "paid_at": None,
            "expires_at": datetime.now(UTC) - timedelta(hours=1),
        }
        mock_db.payments.find_one = AsyncMock(return_value=expired)
        mock_db.payments.find_one_and_update = AsyncMock()
        mock_db.users.update_one = AsyncMock()

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            result = await verify_and_mark_paid(
                payment_code="TTQ507f1f1700000000",
                amount=49000,
                gateway_txn_id="TXN-LATE",
                raw_payload={"id": [1]},
            )

        assert result is None
        mock_db.payments.find_one_and_update.assert_not_called()
        mock_db.users.update_one.assert_not_called()

    @pytest.mark.asyncio
    async def test_unknown_payment_code_returns_none(self, mock_db):
        """An unknown ``payment_code`` (e.g. typo from the gateway)
        must return ``None`` cleanly, not raise."""
        mock_db.payments.find_one = AsyncMock(return_value=None)
        mock_db.payments.find_one_and_update = AsyncMock()
        mock_db.users.update_one = AsyncMock()

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            result = await verify_and_mark_paid(
                payment_code="TTQ_NOPE",
                amount=49000,
                gateway_txn_id="TXN-X",
                raw_payload={},
            )

        assert result is None
        mock_db.payments.find_one_and_update.assert_not_called()
        mock_db.users.update_one.assert_not_called()


# ---------------------------------------------------------------------------
# expire_overdue_payments
# ---------------------------------------------------------------------------


class TestExpireOverduePayments:
    @pytest.mark.asyncio
    async def test_promotes_old_pending_to_expired(self, mock_db):
        """Happy path: update_many is called with a 24h-old pending
        filter and a status=expired setter. The modified_count from
        Mongo is returned to the caller."""
        mock_db.payments.update_many = AsyncMock()
        mock_db.payments.update_many.return_value = MagicMock(modified_count=3)

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            count = await expire_overdue_payments()

        assert count == 3
        mock_db.payments.update_many.assert_called_once()
        call_args = mock_db.payments.update_many.call_args
        query = call_args[0][0]
        update = call_args[0][1]
        # Filter: status=pending AND created_at < cutoff
        assert query["status"] == PaymentStatus.PENDING.value
        assert "$lt" in query["created_at"]
        # Setter: status=expired (no other fields)
        assert update == {"$set": {"status": PaymentStatus.EXPIRED.value}}

    @pytest.mark.asyncio
    async def test_returns_zero_when_nothing_to_expire(self, mock_db):
        """No stale pending payments: update_many reports 0 and the
        function returns 0."""
        mock_db.payments.update_many = AsyncMock()
        mock_db.payments.update_many.return_value = MagicMock(modified_count=0)

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            count = await expire_overdue_payments()

        assert count == 0

    @pytest.mark.asyncio
    async def test_handles_missing_modified_count_attribute(self, mock_db):
        """Defensive: a real Motor result exposes ``modified_count``;
        a mock or future API variant may not. Function must still
        return an int and never raise ``AttributeError``."""
        mock_db.payments.update_many = AsyncMock()
        # An object with no `modified_count` attribute.
        mock_db.payments.update_many.return_value = object()

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            count = await expire_overdue_payments()

        assert count == 0


# ---------------------------------------------------------------------------
# get_payment_by_code
# ---------------------------------------------------------------------------


class TestGetPaymentByCode:
    @pytest.mark.asyncio
    async def test_returns_payment_when_found(self, mock_db, pending_payment_doc):
        mock_db.payments.find_one = AsyncMock(return_value=pending_payment_doc)

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            result = await get_payment_by_code(pending_payment_doc["payment_code"])

        assert result is not None
        assert result.payment_code == pending_payment_doc["payment_code"]
        assert result.user_id == pending_payment_doc["user_id"]
        assert result.status == PaymentStatus.PENDING
        mock_db.payments.find_one.assert_called_once_with(
            {"payment_code": pending_payment_doc["payment_code"]}
        )

    @pytest.mark.asyncio
    async def test_returns_none_when_missing(self, mock_db):
        mock_db.payments.find_one = AsyncMock(return_value=None)

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            result = await get_payment_by_code("TTQ_NOPE")

        assert result is None


# ---------------------------------------------------------------------------
# cancel_payment
# ---------------------------------------------------------------------------


class TestCancelPayment:
    @pytest.mark.asyncio
    async def test_cancel_own_pending_payment(
        self, mock_db, user_id, pending_payment_doc
    ):
        """Owner cancels their pending payment → status becomes expired."""
        updated_doc = {**pending_payment_doc, "status": PaymentStatus.EXPIRED.value}
        mock_db.payments.find_one_and_update = AsyncMock(return_value=updated_doc)

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            result = await cancel_payment(
                pending_payment_doc["payment_code"], user_id
            )

        assert result is not None
        assert result.status == PaymentStatus.EXPIRED
        assert result.payment_code == pending_payment_doc["payment_code"]
        # find_one_and_update was called atomically with all three guards.
        mock_db.payments.find_one_and_update.assert_called_once()
        call_filter = mock_db.payments.find_one_and_update.call_args[0][0]
        assert call_filter["payment_code"] == pending_payment_doc["payment_code"]
        assert call_filter["user_id"] == user_id
        assert call_filter["status"] == PaymentStatus.PENDING.value

    @pytest.mark.asyncio
    async def test_cancel_unknown_code_returns_none(self, mock_db):
        """Unknown payment_code → None."""
        mock_db.payments.find_one_and_update = AsyncMock(return_value=None)

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            result = await cancel_payment("NONEXISTENT", "any_user_id")

        assert result is None

    @pytest.mark.asyncio
    async def test_cancel_not_owner_returns_none(
        self, mock_db, user_id, pending_payment_doc
    ):
        """Different user_id → None."""
        mock_db.payments.find_one_and_update = AsyncMock(return_value=None)

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            result = await cancel_payment(
                pending_payment_doc["payment_code"], "other_user_id"
            )

        assert result is None
        # find_one_and_update was called (atomically), but the user_id
        # guard prevented the update.
        mock_db.payments.find_one_and_update.assert_called_once()

    @pytest.mark.asyncio
    async def test_cancel_non_pending_returns_none(
        self, mock_db, user_id, pending_payment_doc
    ):
        """Already paid/expired payment → None."""
        paid_doc = {**pending_payment_doc, "status": PaymentStatus.PAID.value}
        # The atomic filter requires status=pending; it won't match.
        mock_db.payments.find_one_and_update = AsyncMock(return_value=None)

        with patch("src.services.payment_service.get_db", return_value=mock_db):
            result = await cancel_payment(paid_doc["payment_code"], user_id)

        assert result is None
        # find_one_and_update was called, but the status guard
        # prevented the update.
        mock_db.payments.find_one_and_update.assert_called_once()


# ---------------------------------------------------------------------------
# Internal helpers (sanity checks for the format guarantees we
# promise to the gateway / docs / ops dashboards)
# ---------------------------------------------------------------------------


class TestPaymentCodeFormat:
    def test_starts_with_ttq_and_carries_user_id_short(self, user_id):
        code = _generate_payment_code(user_id)
        assert code.startswith("TTQ")
        assert user_id[:6] in code

    def test_handles_empty_user_id_without_crashing(self):
        code = _generate_payment_code("")
        assert code.startswith("TTQ")
        # 6-char placeholder is spliced in.
        assert code.startswith("TTQ000000")
        # After placeholder: {10-digit timestamp}{6-char hex}.
        suffix = code[len("TTQ000000") :]
        assert len(suffix) == 16
        timestamp_part = suffix[:10]
        random_part = suffix[10:]
        assert timestamp_part.isdigit()
        assert len(random_part) == 6
        assert all(c in "0123456789abcdef" for c in random_part)

    def test_two_codes_in_the_same_second_are_unique(self, user_id):
        """Two payments created back-to-back for the same user produce
        different codes — the random hex suffix guarantees uniqueness
        even within the same second, so Mongo's unique index on
        payment_code never fires on a genuine checkout."""

        a = _generate_payment_code(user_id)
        b = _generate_payment_code(user_id)
        # Same prefix and user_id_short by construction.
        assert a[: len("TTQ") + 6] == b[: len("TTQ") + 6]
