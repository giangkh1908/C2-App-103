"""Unit tests for the subscription lifecycle service.

Covers the two public entry points:

- ``expire_overdue_subscriptions`` — sweeps users whose
  ``subscription_expires_at`` is in the past and downgrades them to
  the free plan, sets ``subscription_status='expired'`` and clears
  ``usage``.
- ``send_expiry_reminder_emails`` — emails users whose subscription
  expires in 3 days.

The DB is fully mocked per-call (matching the pattern in
``test_payment_service.py`` and ``test_plan_service.py``): every
test ``patch``es ``src.services.subscription_service.get_db`` (or
``...plan_service.get_db`` for the free-plan lookup) with a
``MagicMock`` whose collection methods are individual ``AsyncMock``s.
``send_email`` is patched at the import site used by the service.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from bson import ObjectId

from src.services.subscription_service import (
    _REMINDER_DAYS,
    expire_overdue_subscriptions,
    send_expiry_reminder_emails,
)

# ---------------------------------------------------------------------------
# Test doubles
# ---------------------------------------------------------------------------


class _FakeAsyncCursor:
    """Minimal async-iterable stand-in for a Motor cursor.

    ``send_expiry_reminder_emails`` walks the cursor with
    ``async for user in cursor:`` — a plain ``AsyncMock`` does not
    implement ``__aiter__``, so we hand back this helper instead.
    """

    def __init__(self, items: list[dict[str, Any]]):
        self._items = list(items)

    def __aiter__(self) -> _FakeAsyncCursor:
        return self

    async def __anext__(self) -> dict[str, Any]:
        if not self._items:
            raise StopAsyncIteration
        return self._items.pop(0)


@pytest.fixture
def free_plan_id() -> str:
    """A canonical 24-char ObjectId hex for the free plan document."""
    return str(ObjectId("507f1f77bcf86cd7994390aa"))


@pytest.fixture
def mock_db():
    """A MagicMock database with explicit sub-collections.

    Mirrors the shape used by ``test_payment_service.py``: tests
    configure each collection method (find, find_one, update_many,
    etc.) on demand so the failure surface stays small and explicit.
    """
    db = MagicMock()
    db.users = MagicMock()
    db.plans = MagicMock()
    return db


def _make_user(
    *,
    user_id: ObjectId | None = None,
    email: str = "user@example.com",
    name: str = "Test User",
    subscription_status: str = "active",
    subscription_expires_at: datetime | None = None,
    plan_id: str = "",
) -> dict[str, Any]:
    """Build a representative user document."""
    return {
        "_id": user_id or ObjectId(),
        "name": name,
        "email": email,
        "password_hash": "x" * 60,
        "role": "user",
        "verified": True,
        "avatar": None,
        "plan_id": plan_id,
        "subscription_status": subscription_status,
        "subscription_expires_at": subscription_expires_at,
        "usage": {},
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }


# ---------------------------------------------------------------------------
# expire_overdue_subscriptions
# ---------------------------------------------------------------------------


class TestExpireOverdueSubscriptions:
    @pytest.mark.asyncio
    async def test_user_expired_is_downgraded_to_free(self, mock_db, free_plan_id):
        """A user with ``subscription_status='active'`` and an
        ``subscription_expires_at`` strictly in the past is matched by
        the sweep and downgraded to the free plan: ``plan_id`` is set
        to the free plan's id, ``subscription_status`` becomes
        ``'expired'``, ``subscription_expires_at`` is cleared, and
        ``usage`` is reset to an empty dict.
        """
        mock_db.plans.find_one = AsyncMock(
            return_value={"_id": ObjectId(free_plan_id), "name": "free"}
        )
        mock_db.users.update_many = AsyncMock()
        mock_db.users.update_many.return_value = MagicMock(modified_count=1)

        with (
            patch("src.services.subscription_service.get_db", return_value=mock_db),
            patch(
                "src.services.subscription_service.get_free_plan_id",
                AsyncMock(return_value=free_plan_id),
            ),
        ):
            count = await expire_overdue_subscriptions()

        assert count == 1
        mock_db.users.update_many.assert_called_once()
        call_args = mock_db.users.update_many.call_args
        query = call_args[0][0]
        update = call_args[0][1]

        # Filter: status=active AND expiry is set and strictly in the past.
        assert query["subscription_status"] == "active"
        assert "$lt" in query["subscription_expires_at"]
        assert query["subscription_expires_at"]["$ne"] is None
        assert isinstance(query["subscription_expires_at"]["$lt"], datetime)

        # Setter: free plan id, status=expired, expiry=None, usage={}.
        set_data = update["$set"]
        assert set_data["plan_id"] == free_plan_id
        assert set_data["subscription_status"] == "expired"
        assert set_data["subscription_expires_at"] is None
        assert set_data["usage"] == {}
        assert "updated_at" in set_data

    @pytest.mark.asyncio
    async def test_returns_modified_count(self, mock_db, free_plan_id):
        """The function returns the ``modified_count`` from
        ``update_many`` so the caller can log / alert on it."""
        mock_db.users.update_many = AsyncMock()
        mock_db.users.update_many.return_value = MagicMock(modified_count=5)

        with (
            patch("src.services.subscription_service.get_db", return_value=mock_db),
            patch(
                "src.services.subscription_service.get_free_plan_id",
                AsyncMock(return_value=free_plan_id),
            ),
        ):
            count = await expire_overdue_subscriptions()

        assert count == 5

    @pytest.mark.asyncio
    async def test_returns_zero_when_nothing_to_expire(self, mock_db, free_plan_id):
        """No overdue subscriptions: ``update_many`` reports 0 and the
        function returns 0."""
        mock_db.users.update_many = AsyncMock()
        mock_db.users.update_many.return_value = MagicMock(modified_count=0)

        with (
            patch("src.services.subscription_service.get_db", return_value=mock_db),
            patch(
                "src.services.subscription_service.get_free_plan_id",
                AsyncMock(return_value=free_plan_id),
            ),
        ):
            count = await expire_overdue_subscriptions()

        assert count == 0


# ---------------------------------------------------------------------------
# send_expiry_reminder_emails
# ---------------------------------------------------------------------------


class TestSendExpiryReminderEmails:
    @pytest.mark.asyncio
    async def test_user_expiring_in_three_days_receives_email(self, mock_db):
        """A user whose ``subscription_expires_at`` lands inside the
        3-day reminder window is matched, and an email is dispatched
        via ``send_email``.
        """
        user = _make_user(
            email="renew@example.com",
            subscription_status="active",
            subscription_expires_at=datetime.now(UTC) + timedelta(days=_REMINDER_DAYS, hours=2),
        )
        mock_db.users.find = MagicMock(return_value=_FakeAsyncCursor([user]))

        with (
            patch("src.services.subscription_service.get_db", return_value=mock_db),
            patch(
                "src.services.subscription_service.send_email",
                new=AsyncMock(return_value=True),
            ) as mock_send,
        ):
            dispatched = await send_expiry_reminder_emails()

        assert dispatched == 1
        mock_send.assert_called_once()
        # The dispatched email targets the matching user and carries
        # an expiry-themed subject. ``send_email`` is called
        # positionally: (to, subject, html).
        call_args = mock_send.call_args
        to_arg = call_args.args[0]
        subject_arg = call_args.args[1]
        assert to_arg == "renew@example.com"
        assert "hết hạn" in subject_arg.lower() or "expir" in subject_arg.lower()

        # The Mongo query must filter on the 3-day window.
        find_call = mock_db.users.find.call_args
        query = find_call[0][0]
        assert query["subscription_status"] == "active"
        assert "$gte" in query["subscription_expires_at"]
        assert "$lt" in query["subscription_expires_at"]

    @pytest.mark.asyncio
    async def test_user_already_free_receives_no_email(self, mock_db):
        """A free user (no ``subscription_expires_at``) must NOT
        receive a reminder — the Mongo filter requires
        ``subscription_expires_at`` to fall inside the 3-day window,
        so a None value naturally excludes them.
        """
        # Empty cursor: a free user with ``subscription_expires_at =
        # None`` is not matched by the window filter.
        mock_db.users.find = MagicMock(return_value=_FakeAsyncCursor([]))

        with (
            patch("src.services.subscription_service.get_db", return_value=mock_db),
            patch(
                "src.services.subscription_service.send_email",
                new=AsyncMock(return_value=True),
            ) as mock_send,
        ):
            dispatched = await send_expiry_reminder_emails()

        assert dispatched == 0
        mock_send.assert_not_called()

    @pytest.mark.asyncio
    async def test_user_expiring_in_five_days_receives_no_email(self, mock_db):
        """A user whose subscription expires 5 days from now is
        outside the 3-day reminder window and must NOT receive an
        email. The Mongo filter enforces the window at query time.
        """
        # Empty cursor: 5 days is outside [3d, 4d).
        mock_db.users.find = MagicMock(return_value=_FakeAsyncCursor([]))

        with (
            patch("src.services.subscription_service.get_db", return_value=mock_db),
            patch(
                "src.services.subscription_service.send_email",
                new=AsyncMock(return_value=True),
            ) as mock_send,
        ):
            dispatched = await send_expiry_reminder_emails()

        assert dispatched == 0
        mock_send.assert_not_called()

    @pytest.mark.asyncio
    async def test_email_send_exception_is_swallowed(self, mock_db):
        """A failing ``send_email`` (e.g. Resend 5xx) must be logged
        and skipped — it must NOT raise out of the cron job, since
        the scheduler will silently kill the next run otherwise.
        """
        user = _make_user(
            email="flaky@example.com",
            subscription_status="active",
            subscription_expires_at=datetime.now(UTC) + timedelta(days=_REMINDER_DAYS, hours=1),
        )
        mock_db.users.find = MagicMock(return_value=_FakeAsyncCursor([user]))

        with (
            patch("src.services.subscription_service.get_db", return_value=mock_db),
            patch(
                "src.services.subscription_service.send_email",
                new=AsyncMock(side_effect=RuntimeError("resend 503")),
            ),
        ):
            # Must not raise.
            dispatched = await send_expiry_reminder_emails()

        # Failed sends are logged + skipped, not counted.
        assert dispatched == 0
