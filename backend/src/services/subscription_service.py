"""Subscription lifecycle service.

Background jobs that keep the user subscription state in sync with
wall-clock time:

- ``expire_overdue_subscriptions`` downgrades users whose
  ``subscription_expires_at`` is in the past and status is still
  ``active`` to the free plan, sets their status to ``expired`` and
  clears their usage window.
- ``send_expiry_reminder_emails`` emails users whose subscription is
  about to expire (in 3 days) so they can renew.

Both functions are designed to be called by a background sweeper
(APScheduler job registered in ``src/main.py``). They return
counters suitable for logging / alerting.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from src.core.config import settings
from src.core.database import get_db
from src.core.email import send_email
from src.core.logging import get_logger
from src.services.plan_service import get_free_plan_id

logger = get_logger("toan_truc_quan.subscription_service")

# Reminder lead time (days before expiry). 3 days is the canonical
# SaaS renewal reminder window — late enough that the user still has
# time to act, early enough to avoid surprise churn.
_REMINDER_DAYS = 3
# Width of the reminder window. The job fires once per day, so a
# 1-day window guarantees each user is reminded exactly once.
_REMINDER_WINDOW = timedelta(days=1)


def _build_reminder_email(user: dict[str, Any], expires_at: datetime) -> tuple[str, str]:
    """Render the (subject, html) pair for a reminder email.

    Vietnamese copy, consistent with the rest of the transactional
    email templates (see ``src/core/email.py``).
    """
    name = user.get("name") or "bạn"
    expires_str = expires_at.strftime("%d/%m/%Y")
    subject = "Gói của bạn sắp hết hạn - Toán Trực Quan AI"
    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #4A6741;">Gói của bạn sắp hết hạn</h2>
        <p>Chào {name},</p>
        <p>Gói đăng ký của bạn sẽ hết hạn vào ngày <strong>{expires_str}</strong>.</p>
        <p>Gia hạn ngay để tiếp tục sử dụng đầy đủ tính năng của gói hiện tại.</p>
        <a href="{settings.frontend_url}/subscription"
           style="display: inline-block; background: #4A6741; color: white; padding: 12px 24px;
                  border-radius: 9999px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Gia hạn ngay
        </a>
        <p style="color: #666; font-size: 13px;">
            Nếu gói hết hạn, tài khoản sẽ tự động chuyển về gói miễn phí.
        </p>
    </div>
    """
    return subject, html


async def expire_overdue_subscriptions() -> int:
    """Downgrade users whose subscription has expired to the free plan.

    Scans ``users`` for documents where:

    - ``subscription_status == "active"``, AND
    - ``subscription_expires_at`` is set and is strictly in the past.

    For each match, sets:

    - ``plan_id`` to the free plan's id
    - ``subscription_status`` to ``"expired"``
    - ``subscription_expires_at`` to ``None``
    - ``usage`` to an empty dict (fresh quota window)
    - ``updated_at`` to now

    Returns the number of users that were modified. The function is
    idempotent: re-running it after a successful sweep matches zero
    documents and returns 0.
    """
    db = get_db()
    now = datetime.now(UTC)

    free_plan_id = await get_free_plan_id()

    result = await db.users.update_many(
        {
            "subscription_status": "active",
            "subscription_expires_at": {"$ne": None, "$lt": now},
        },
        {
            "$set": {
                "plan_id": free_plan_id,
                "subscription_status": "expired",
                "subscription_expires_at": None,
                "usage": {},
                "updated_at": now,
            }
        },
    )
    modified = int(getattr(result, "modified_count", 0) or 0)
    if modified:
        logger.info("subscriptions_expired_sweep", count=modified)
    return modified


async def send_expiry_reminder_emails() -> int:
    """Send a single reminder email to users whose subscription
    expires in exactly ``_REMINDER_DAYS`` days.

    The window is ``[now+_REMINDER_DAYS, now+_REMINDER_DAYS+1d)`` —
    i.e. a 24-hour slice starting at the 3-day mark. Users whose
    expiry is outside this window (further in the future, in the
    past, or unset) are not touched.

    Targets ``subscription_status == "active"`` only, so free users
    (``subscription_expires_at is None``) and already-cancelled /
    expired users do not receive the email.

    Returns the number of reminder emails successfully dispatched.
    Delivery is best-effort: a ``send_email`` that returns ``False``
    or raises is logged and skipped — the counter only advances for
    calls that completed without raising.
    """
    db = get_db()
    now = datetime.now(UTC)
    window_start = now + timedelta(days=_REMINDER_DAYS)
    window_end = window_start + _REMINDER_WINDOW

    cursor = db.users.find(
        {
            "subscription_status": "active",
            "subscription_expires_at": {"$gte": window_start, "$lt": window_end},
        }
    )

    dispatched = 0
    async for user in cursor:
        email = user.get("email")
        expires_at = user.get("subscription_expires_at")
        if not email or not isinstance(expires_at, datetime):
            continue
        subject, html = _build_reminder_email(user, expires_at)
        try:
            await send_email(email, subject, html)
        except Exception:
            logger.exception(
                "subscription_reminder_send_exception", email_to=email
            )
            continue
        dispatched += 1
        logger.info("subscription_reminder_sent", email_to=email)

    if dispatched:
        logger.info("subscription_reminders_dispatched", count=dispatched)
    return dispatched
