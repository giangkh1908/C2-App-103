"""Unit tests for Payment MongoDB model.

Covers the Pydantic v2 model shape, the `PaymentStatus` enum,
and the round-trip between PaymentInDB and the raw Mongo document.
"""

from datetime import UTC, datetime

import pytest
from bson import ObjectId
from pydantic import ValidationError

from src.models.payment import (
    PaymentInDB,
    PaymentStatus,
    create_payment_doc,
)


def _make_payment(**overrides):
    """Build a fully-populated PaymentInDB for happy-path tests.

    Accepts either `id=` or `_id=` (populate_by_name=True) so callers
    can pick whichever feels more natural.
    """
    base = {
        "id": str(ObjectId()),
        "user_id": "user_001",
        "plan_id": "plan_plus",
        "plan_name": "Plus",
        "billing": "monthly",
        "amount_vnd": 49000,
        "payment_code": "PAY-TEST-0001",
        "gateway": "sepay",
        "status": PaymentStatus.PENDING,
        "gateway_transaction_id": None,
        "raw_webhook_payload": None,
        "created_at": datetime(2026, 6, 21, 10, 0, 0, tzinfo=UTC),
        "paid_at": None,
        "expires_at": datetime(2026, 6, 21, 10, 15, 0, tzinfo=UTC),
    }
    base.update(overrides)
    return PaymentInDB(**base)


class TestPaymentInDBHappy:
    def test_create_with_all_fields(self):
        payment = _make_payment()

        assert payment.id is not None
        assert payment.user_id == "user_001"
        assert payment.plan_id == "plan_plus"
        assert payment.plan_name == "Plus"
        assert payment.billing == "monthly"
        assert payment.amount_vnd == 49000
        assert payment.payment_code == "PAY-TEST-0001"
        assert payment.gateway == "sepay"
        assert payment.status == PaymentStatus.PENDING
        assert payment.gateway_transaction_id is None
        assert payment.raw_webhook_payload is None
        assert payment.created_at == datetime(2026, 6, 21, 10, 0, 0, tzinfo=UTC)
        assert payment.paid_at is None
        assert payment.expires_at == datetime(2026, 6, 21, 10, 15, 0, tzinfo=UTC)

    def test_dump_to_dict_keeps_alias_id(self):
        payment = _make_payment()
        dumped = payment.model_dump(by_alias=True)

        assert "_id" in dumped
        assert "id" not in dumped
        assert dumped["_id"] == payment.id
        assert dumped["user_id"] == "user_001"
        assert dumped["payment_code"] == "PAY-TEST-0001"
        assert dumped["status"] == PaymentStatus.PENDING

    def test_to_mongo_id_is_objectid_compatible_string(self):
        """Mongo can accept a 24-char hex string as `_id`; the field
        type must be a str (not an int / UUID object) for both
        `insert_one` and SePay's webhook lookup to work."""
        payment = _make_payment(id=str(ObjectId("507f1f77bcf86cd799439011")))

        doc = payment.to_mongo()

        # The 24-char hex ObjectId() round-trips losslessly.
        assert doc["_id"] == "507f1f77bcf86cd799439011"
        assert isinstance(doc["_id"], str)
        # And it can be coerced back into a real bson ObjectId
        # without error — proves ObjectId-compatibility.
        assert ObjectId(doc["_id"]) == ObjectId("507f1f77bcf86cd799439011")

    def test_to_mongo_drops_none_optionals(self):
        payment = _make_payment()
        doc = payment.to_mongo()

        # Optional fields set to None must not pollute the document.
        assert "gateway_transaction_id" not in doc
        assert "raw_webhook_payload" not in doc
        assert "paid_at" not in doc
        # But the always-present fields are kept.
        assert "user_id" in doc
        assert "created_at" in doc
        assert "expires_at" in doc

    def test_from_mongo_converts_objectid_to_str(self):
        oid = ObjectId("507f1f77bcf86cd799439011")
        mongo_doc = {
            "_id": oid,
            "user_id": "user_002",
            "plan_id": "plan_premium",
            "plan_name": "Premium",
            "billing": "yearly",
            "amount_vnd": 799000,
            "payment_code": "PAY-TEST-0002",
            "gateway": "sepay",
            "status": PaymentStatus.PAID.value,
            "gateway_transaction_id": "TXN-ABC-999",
            "raw_webhook_payload": {"id": [123], "gateway": "Sepay"},
            "created_at": datetime(2026, 6, 21, 9, 0, 0, tzinfo=UTC),
            "paid_at": datetime(2026, 6, 21, 9, 5, 0, tzinfo=UTC),
            "expires_at": None,
        }

        payment = PaymentInDB.from_mongo(mongo_doc)

        assert payment.id == "507f1f77bcf86cd799439011"
        assert isinstance(payment.id, str)
        assert payment.status == PaymentStatus.PAID
        assert payment.gateway_transaction_id == "TXN-ABC-999"
        assert payment.raw_webhook_payload == {"id": [123], "gateway": "Sepay"}

    def test_from_mongo_accepts_id_like_object(self):
        """Defensive: some drivers / mocks return objects with a
        `__str__` rather than a real ObjectId. The helper must not
        crash if `_id` is already a string."""
        payment = PaymentInDB.from_mongo(
            {
                "_id": "string-id-already",
                "user_id": "u",
                "plan_id": "p",
                "plan_name": "n",
                "billing": "monthly",
                "amount_vnd": 1,
                "payment_code": "c",
                "gateway": "sepay",
                "status": PaymentStatus.PENDING.value,
                "created_at": datetime.now(UTC),
            }
        )
        assert payment.id == "string-id-already"


class TestPaymentStatusTransitions:
    def test_pending_to_paid(self):
        payment = _make_payment(status=PaymentStatus.PENDING)
        paid = payment.model_copy(update={"status": PaymentStatus.PAID})
        assert paid.status == PaymentStatus.PAID

    def test_pending_to_failed(self):
        payment = _make_payment(status=PaymentStatus.PENDING)
        failed = payment.model_copy(update={"status": PaymentStatus.FAILED})
        assert failed.status == PaymentStatus.FAILED

    def test_pending_to_expired(self):
        payment = _make_payment(status=PaymentStatus.PENDING)
        expired = payment.model_copy(update={"status": PaymentStatus.EXPIRED})
        assert expired.status == PaymentStatus.EXPIRED

    def test_all_enum_values_round_trip(self):
        """Each enum value must survive a model_dump / from_mongo round trip."""
        for status in PaymentStatus:
            payment = _make_payment(status=status)
            dumped = payment.model_dump(by_alias=True)
            # Pydantic v2 keeps the enum object on the model; in the
            # dumped dict the value is the underlying string.
            assert dumped["status"] == status.value

            rebuilt = PaymentInDB.from_mongo({**dumped})
            assert rebuilt.status == status

    def test_enum_str_value(self):
        # Stored form in Mongo is the lowercase string, not "PENDING".
        assert PaymentStatus.PENDING.value == "pending"
        assert PaymentStatus.PAID.value == "paid"
        assert PaymentStatus.FAILED.value == "failed"
        assert PaymentStatus.EXPIRED.value == "expired"


class TestPaymentInDBFailures:
    def test_invalid_status_enum_raises_validation_error(self):
        with pytest.raises(ValidationError) as exc_info:
            _make_payment(status="not_a_real_status")

        # The error must clearly point at the bad `status` field.
        errors = exc_info.value.errors()
        assert any(err["loc"] == ("status",) for err in errors), errors

    def test_invalid_billing_literal_raises_validation_error(self):
        with pytest.raises(ValidationError) as exc_info:
            _make_payment(billing="weekly")

        errors = exc_info.value.errors()
        assert any(err["loc"] == ("billing",) for err in errors), errors

    def test_invalid_gateway_literal_raises_validation_error(self):
        with pytest.raises(ValidationError) as exc_info:
            _make_payment(gateway="stripe")

        errors = exc_info.value.errors()
        assert any(err["loc"] == ("gateway",) for err in errors), errors

    def test_negative_amount_raises_validation_error(self):
        with pytest.raises(ValidationError) as exc_info:
            _make_payment(amount_vnd=-1)

        errors = exc_info.value.errors()
        assert any(err["loc"] == ("amount_vnd",) for err in errors), errors

    def test_missing_required_field_raises_validation_error(self):
        with pytest.raises(ValidationError) as exc_info:
            PaymentInDB(
                id="507f1f77bcf86cd799439011",
                user_id="u",
                # plan_id missing
                plan_name="n",
                billing="monthly",
                amount_vnd=1,
                payment_code="c",
                gateway="sepay",
                status=PaymentStatus.PENDING,
                created_at=datetime.now(UTC),
            )

        errors = exc_info.value.errors()
        assert any(err["loc"] == ("plan_id",) for err in errors), errors


class TestCreatePaymentDoc:
    def test_factory_returns_pending_doc(self):
        expires = datetime(2026, 6, 21, 11, 0, 0, tzinfo=UTC)
        doc = create_payment_doc(
            user_id="user_001",
            plan_id="plan_plus",
            plan_name="Plus",
            billing="monthly",
            amount_vnd=49000,
            payment_code="PAY-FACTORY-0001",
            expires_at=expires,
        )

        assert doc["user_id"] == "user_001"
        assert doc["plan_id"] == "plan_plus"
        assert doc["plan_name"] == "Plus"
        assert doc["billing"] == "monthly"
        assert doc["amount_vnd"] == 49000
        assert doc["payment_code"] == "PAY-FACTORY-0001"
        assert doc["gateway"] == "sepay"
        assert doc["status"] == PaymentStatus.PENDING.value
        assert doc["gateway_transaction_id"] is None
        assert doc["raw_webhook_payload"] is None
        assert doc["paid_at"] is None
        assert doc["expires_at"] == expires
        assert isinstance(doc["created_at"], datetime)

    def test_factory_without_expiry(self):
        doc = create_payment_doc(
            user_id="u",
            plan_id="p",
            plan_name="n",
            billing="yearly",
            amount_vnd=1,
            payment_code="c",
        )
        assert doc["expires_at"] is None
        assert doc["status"] == "pending"


class _AnyAttrsDB:
    """Fake db handle: any attribute access returns a pass-through
    fake collection whose `create_index` does nothing. Used to
    stub out the real `AsyncIOMotorDatabase` for these tests.
    """

    def __init__(self, created: list | None = None):
        self._created = created if created is not None else []

    def __getattr__(self, _name):
        return _FakeCollection(self._created)


class _FakeCollection:
    def __init__(self, created: list):
        self._created = created

    async def create_index(self, keys, **kwargs):
        self._created.append((keys, kwargs))
        return "idx_name"

    def aggregate(self, pipeline):
        class _EmptyAsyncIter:
            def __aiter__(self):
                return self

            async def __anext__(self):
                raise StopAsyncIteration

        return _EmptyAsyncIter()


class TestEnsurePaymentIndexes:
    """Smoke-test the database.py wiring. We mock AsyncIOMotorDatabase
    so the test stays synchronous and does not need a live Mongo."""

    def test_ensure_payment_indexes_creates_three_indexes(self):
        from src.core.database import ensure_payment_indexes

        created: list[tuple] = []

        # ensure_payment_indexes is async, drive it manually.
        import asyncio

        asyncio.run(ensure_payment_indexes(_AnyAttrsDB(created)))

        # `created` holds (keys, kwargs) tuples. Mongo can accept
        # either a string field name or a list of (field, direction)
        # tuples; we pass a string here.
        # Unique on payment_code, plain on user_id, plain on status.
        idx_keys = [item[0] for item in created]
        assert "payment_code" in idx_keys
        assert "user_id" in idx_keys
        assert "status" in idx_keys

    def test_ensure_indexes_calls_ensure_payment_indexes(self):
        """ensure_indexes() must delegate to ensure_payment_indexes()
        so payments get their indexes on every startup."""
        from src.core import database as db_mod

        called = {"flag": False}

        async def fake_ensure_payment_indexes(target_db):
            called["flag"] = True

        # Patch and run ensure_indexes against a permissive fake db.
        original = db_mod.ensure_payment_indexes
        db_mod.ensure_payment_indexes = fake_ensure_payment_indexes  # type: ignore[assignment]
        try:
            import asyncio

            asyncio.run(db_mod.ensure_indexes(_AnyAttrsDB()))
            assert called["flag"] is True, "ensure_indexes() did not call ensure_payment_indexes()"
        finally:
            db_mod.ensure_payment_indexes = original  # type: ignore[assignment]
