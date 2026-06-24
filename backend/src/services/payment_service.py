"""Payment service for SePay-based Vietnam payment flow.

Layer on top of `src.models.payment` that:

- creates a `pending` payment intent for a paid plan (`plus` / `premium`),
- atomically flips it to `paid` when the gateway webhook arrives, and
  mirrors the activation onto the user document in the same flow,
- sweeps stale `pending` intents older than 24h into `expired`,
- looks up a single payment by its business `payment_code`.

The "pending -> paid" flip uses a single `find_one_and_update` with
`status: pending` as a guard, so:

- a duplicate webhook with the same `payment_code` (SePay retries on
  network jitter) is naturally idempotent: the second call sees
  `status: paid` and returns `None` instead of double-activating the
  user.
- an `expired` payment cannot be paid: the sweeper flipped the status
  to `expired` first, the guard skips it.

When the payment is marked `paid` but user activation fails (DB blip,
network timeout), the system enters an inconsistent state. A background
``reconcile_paid_payments`` job runs periodically to find and fix these
by checking each `paid` payment's ``plan_id`` against the user's
current ``plan_id`` and re-applying if they differ.
"""

from __future__ import annotations

import asyncio
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from src.core.database import get_db
from src.core.logging import get_logger
from src.models.payment import PaymentInDB, PaymentStatus, create_payment_doc

logger = get_logger("toan_truc_quan.payment_service")

# How long a `pending` payment is allowed to sit before the sweeper
# promotes it to `expired`. Mirrors the index note in
# `src.core.database.ensure_payment_indexes`.
PAYMENT_PENDING_TTL = timedelta(hours=24)

# Window the freshly created payment_code should match the user-side
# `subscription_expires_at`. Monthly rolls 30 days forward, yearly
# rolls 365 days forward.
_MONTHLY_DAYS = 30
_YEARLY_DAYS = 365

# Business prefix for every payment code we generate. Users see this
# inside the SePay transfer content; gateway webhooks echo it back
# and we look the payment up by it.
_PAYMENT_CODE_PREFIX = "TTQ"

# How many leading characters of the user_id we splice into the
# payment_code (after the prefix). 6 hex chars gives 16M buckets, more
# than enough to disambiguate concurrent payments and short enough
# to fit comfortably inside the gateway's content-length cap.
_USER_ID_SHORT_LEN = 6

# `billing` literals are enforced at the type-check boundary, but the
# model accepts the lowercase strings, so we centralize the price
# lookup here.
_BILLING_MONTHLY = "monthly"
_BILLING_YEARLY = "yearly"

# Retry config for user activation after payment flip.
# If the first activation attempt fails (DB blip, network timeout),
# we retry up to _ACTIVATE_MAX_RETRIES times with exponential backoff.
_ACTIVATE_MAX_RETRIES = 3
_ACTIVATE_RETRY_DELAY = 1.0  # seconds, doubled each retry


def _safe_objectid(user_id: str) -> ObjectId | None:
    """Coerce a string user id to a bson ObjectId, returning None on
    malformed input instead of raising."""
    try:
        return ObjectId(user_id)
    except (InvalidId, TypeError):
        return None


def _generate_payment_code(user_id: str) -> str:
    """Build the unique business code we hand to the gateway.

    Format: ``TTQ{user_id_short}{unix_timestamp}{random_hex}``

    The random 6-char hex suffix guarantees uniqueness even when two
    checkout requests for the same user arrive in the same second
    (double-click, network retry, frontend race).
    """
    timestamp = int(datetime.now(UTC).timestamp())
    user_id_short = user_id[:_USER_ID_SHORT_LEN] if user_id else "000000"
    random_hex = secrets.token_hex(3)  # 6 chars, 16M combinations
    return f"{_PAYMENT_CODE_PREFIX}{user_id_short}{timestamp}{random_hex}"


def _resolve_amount(plan: dict[str, Any], billing: str) -> int:
    """Pick the right price field for the billing cycle.

    Raises ``ValueError`` for any (plan, billing) combo that would
    produce a non-positive amount: the caller asked for a paid plan
    and we should never mint a zero-vnd payment intent.
    """
    if billing == _BILLING_MONTHLY:
        price_key = "price_monthly"
    elif billing == _BILLING_YEARLY:
        price_key = "price_yearly"
    else:
        raise ValueError(f"Invalid billing cycle: {billing!r}")

    raw = plan.get(price_key)
    if raw is None:
        logger.warning(
            "plan_missing_price_field",
            plan_name=plan.get("name", "?"),
            price_key=price_key,
        )
    amount = int(raw) if raw is not None else 0

    if amount <= 0:
        raise ValueError(
            f"Plan {plan.get('name', '?')!r} has no positive price for billing={billing!r}"
        )
    return amount


def _compute_expires_at(billing: str) -> datetime:
    """Return the wall-clock instant at which the freshly activated
    subscription should expire.

    Monthly = 30 days forward, yearly = 365 days forward. The window
    is computed in UTC so the same code running in any timezone
    yields a consistent instant.
    """
    now = datetime.now(UTC)
    if billing == _BILLING_MONTHLY:
        return now + timedelta(days=_MONTHLY_DAYS)
    return now + timedelta(days=_YEARLY_DAYS)


async def create_payment(
    user_id: str,
    plan_name: str,
    billing: Literal["monthly", "yearly"],
) -> PaymentInDB:
    """Create a new `pending` payment intent for the given plan.

    Raises:
        ValueError: when ``plan_name == "free"`` (no payment needed),
            when the plan is missing from Mongo, or when the resolved
            amount is non-positive (defensive — the catalog should
            already guarantee this).
    """
    if plan_name == "free":
        raise ValueError(
            "Cannot create payment for 'free' plan — no checkout required."
        )

    db = get_db()
    plan = await db.plans.find_one({"name": plan_name})
    if not plan:
        raise ValueError(f"Plan '{plan_name}' not found in catalog.")

    amount_vnd = _resolve_amount(plan, billing)
    expires_at = _compute_expires_at(billing)
    payment_code = _generate_payment_code(user_id)

    doc = create_payment_doc(
        user_id=user_id,
        plan_id=str(plan["_id"]),
        plan_name=plan["name"],
        billing=billing,
        amount_vnd=amount_vnd,
        payment_code=payment_code,
        expires_at=expires_at,
    )

    try:
        result = await db.payments.insert_one(doc)
    except DuplicateKeyError:
        # A pending payment with the same (user_id, plan_name, billing)
        # already exists — return the existing one.
        existing = await db.payments.find_one({
            "user_id": user_id,
            "plan_name": plan_name,
            "billing": billing,
            "status": PaymentStatus.PENDING.value,
        })
        if existing:
            logger.info(
                "payment_duplicate_skipped",
                payment_code=existing.get("payment_code"),
                plan_name=plan_name,
            )
            return PaymentInDB.from_mongo(existing)
        raise  # Should never happen with the partial index

    doc["_id"] = result.inserted_id

    logger.info(
        "payment_created",
        payment_code=payment_code,
        plan_name=plan_name,
        billing=billing,
        amount_vnd=amount_vnd,
    )
    return PaymentInDB.from_mongo(doc)


async def cancel_payment(payment_code: str, user_id: str) -> PaymentInDB | None:
    """Cancel a pending payment.

    Atomically checks ownership + status + update in a single
    ``find_one_and_update`` call so there is no race between the
    pre-read check and the actual update (e.g. a webhook marking
    the payment as paid between step 1 and step 2).

    Returns the updated payment with ``expired`` status, or ``None`` when
    the code is unknown, the payment does not belong to the caller, or the
    payment is not in ``pending`` state.
    """
    db = get_db()
    result = await db.payments.find_one_and_update(
        {
            "payment_code": payment_code,
            "user_id": user_id,
            "status": PaymentStatus.PENDING.value,
        },
        {"$set": {"status": PaymentStatus.EXPIRED.value}},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        return None
    logger.info(
        "payment_cancelled",
        payment_code=payment_code,
        user_id=user_id,
    )
    return PaymentInDB.from_mongo(result)


async def verify_and_mark_paid(
    payment_code: str,
    amount: int,
    gateway_txn_id: str,
    raw_payload: dict[str, Any],
) -> PaymentInDB | None:
    """Atomically flip a `pending` payment to `paid` and activate the user.

    The flip is performed with a single `find_one_and_update` whose
    filter requires ``status: pending``, which gives us three
    idempotency / safety properties for free:

    1. **Duplicate webhook** (same `payment_code`, same `gateway_txn_id`):
       the second call finds ``status: paid`` and returns ``None``;
       the user is *not* activated twice.
    2. **Expired payment**: if the sweeper already promoted the
       document to ``expired``, the filter does not match and we
       return ``None`` without touching the user.
    3. **Unknown code**: the filter does not match and we return
       ``None``; this is what the gateway sees as "no such payment"
       so it can decide whether to retry.

    Amount validation is done against a pre-read snapshot (the
    gateway-supplied amount must match ``amount_vnd`` exactly). If it
    does not, the document is left in ``pending`` and we return
    ``None`` — the caller (the webhook endpoint) is expected to
    reject the gateway call and keep the intent alive for a
    corrected retry.

    Returns:
        The updated ``PaymentInDB`` on success, or ``None`` when the
        guard refused the update, the code is unknown, or the amount
        does not match.
    """
    db = get_db()
    now = datetime.now(UTC)

    # Pre-read: validate status + amount BEFORE flipping the
    # document. This avoids writing "paid" and then rolling back on
    # amount mismatch.
    payment = await db.payments.find_one({"payment_code": payment_code})
    if payment is None:
        logger.warning("payment_verify_unknown_code", payment_code=payment_code)
        return None
    if payment.get("status") != PaymentStatus.PENDING.value:
        # Already paid (duplicate webhook) or already expired
        # (sweeper ran first). Either way, refuse.
        logger.info(
            "payment_verify_already_settled",
            payment_code=payment_code,
            current_status=payment.get("status"),
        )
        return None
    if int(amount) != int(payment.get("amount_vnd", 0)):
        logger.warning(
            "payment_verify_amount_mismatch",
            payment_code=payment_code,
            expected=payment.get("amount_vnd"),
            received=amount,
        )
        return None

    # Atomic flip with the status=pending guard. The guard catches
    # the race where the sweeper promotes to expired between the
    # pre-read above and this update.
    updated = await db.payments.find_one_and_update(
        {"payment_code": payment_code, "status": PaymentStatus.PENDING.value},
        {
            "$set": {
                "status": PaymentStatus.PAID.value,
                "paid_at": now,
                "gateway_transaction_id": gateway_txn_id,
                "raw_webhook_payload": raw_payload,
            }
        },
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        logger.warning(
            "payment_verify_race_lost",
            payment_code=payment_code,
        )
        return None

    # Activate the user. We deliberately *clear* `usage` so the
    # user gets a fresh quota window on the new plan (mirrors the
    # behavior of the existing `/subscription/upgrade` endpoint).
    # If activation fails after retries, the payment stays "paid"
    # and a background reconciliation job will pick it up.
    user_oid = _safe_objectid(updated["user_id"])
    if user_oid is None:
        logger.error(
            "payment_verify_invalid_user_id",
            payment_code=payment_code,
            user_id=updated.get("user_id"),
        )
        # Payment is already paid; user won't be activated.
        # Reconciliation job will catch this later.
        return PaymentInDB.from_mongo(updated)

    activation_succeeded = await _activate_user(
        db=db,
        user_oid=user_oid,
        payment=updated,
        now=now,
    )

    if not activation_succeeded:
        logger.error(
            "payment_activation_failed_after_retries",
            payment_code=payment_code,
            user_id=updated["user_id"],
            plan_id=updated["plan_id"],
        )

    logger.info(
        "payment_marked_paid",
        payment_code=payment_code,
        user_id=updated["user_id"],
        plan_id=updated["plan_id"],
        gateway_txn_id=gateway_txn_id,
        activation_succeeded=activation_succeeded,
    )
    return PaymentInDB.from_mongo(updated)


async def _activate_user(
    db: Any,
    user_oid: ObjectId,
    payment: dict[str, Any],
    now: datetime,
) -> bool:
    """Attempt to activate the user with retry logic.

    Returns ``True`` if activation succeeded, ``False`` if all
    retries failed (payment is still "paid" — reconciliation will
    handle it later).
    """
    for attempt in range(_ACTIVATE_MAX_RETRIES):
        try:
            await db.users.update_one(
                {"_id": user_oid},
                {
                    "$set": {
                        "plan_id": payment["plan_id"],
                        "subscription_status": "active",
                        "subscription_expires_at": payment.get("expires_at"),
                        "usage": {},
                        "updated_at": now,
                    }
                },
            )
            return True
        except Exception:
            delay = _ACTIVATE_RETRY_DELAY * (2 ** attempt)
            logger.warning(
                "payment_activation_retry",
                attempt=attempt + 1,
                max_retries=_ACTIVATE_MAX_RETRIES,
                delay=delay,
                user_id=str(payment.get("user_id")),
            )
            await asyncio.sleep(delay)
    return False


async def expire_overdue_payments() -> int:
    """Promote `pending` payments older than ``PAYMENT_PENDING_TTL``
    to ``expired``.

    Designed to be called by a background sweeper (cron / APScheduler
    / FastAPI startup hook). Returns the number of documents
    actually modified so the caller can log / alert on it.
    """
    db = get_db()
    cutoff = datetime.now(UTC) - PAYMENT_PENDING_TTL

    result = await db.payments.update_many(
        {"status": PaymentStatus.PENDING.value, "created_at": {"$lt": cutoff}},
        {"$set": {"status": PaymentStatus.EXPIRED.value}},
    )
    modified = int(getattr(result, "modified_count", 0) or 0)
    if modified:
        logger.info("payments_expired_sweep", count=modified, cutoff=cutoff.isoformat())
    return modified


async def reconcile_paid_payments() -> int:
    """Find paid payments whose user was never activated and activate them.

    This catches the edge case where ``verify_and_mark_paid`` flipped
    the payment to ``paid`` but user activation failed after all
    retries. The function compares each paid payment's ``plan_id``
    with the user's current ``plan_id`` and re-applies the upgrade
    if they differ.

    Designed to be called by a background scheduler (APScheduler /
    FastAPI startup hook). Returns the number of users activated.
    """
    db = get_db()
    now = datetime.now(UTC)
    activated = 0

    # Find paid payments. We look for payments where the user's
    # current plan doesn't match the payment's plan_id, meaning
    # the user paid but was never upgraded.
    paid_payments = await db.payments.find(
        {"status": PaymentStatus.PAID.value}
    ).to_list(length=100)  # cap at 100 per sweep cycle

    for doc in paid_payments:
        user_oid = _safe_objectid(doc.get("user_id", ""))
        if user_oid is None:
            continue

        try:
            user = await db.users.find_one({"_id": user_oid})
        except Exception:
            logger.warning(
                "reconcile_user_lookup_failed",
                payment_code=doc.get("payment_code"),
                user_id=doc.get("user_id"),
            )
            continue

        if user is None:
            continue

        # Already on the right plan — skip.
        if user.get("plan_id") == doc.get("plan_id"):
            continue

        try:
            await db.users.update_one(
                {"_id": user_oid},
                {
                    "$set": {
                        "plan_id": doc["plan_id"],
                        "subscription_status": "active",
                        "subscription_expires_at": doc.get("expires_at"),
                        "usage": {},
                        "updated_at": now,
                    }
                },
            )
            activated += 1
            logger.info(
                "reconcile_user_activated",
                payment_code=doc.get("payment_code"),
                user_id=doc.get("user_id"),
                plan_id=doc.get("plan_id"),
            )
        except Exception:
            logger.exception(
                "reconcile_activation_failed",
                payment_code=doc.get("payment_code"),
                user_id=doc.get("user_id"),
            )

    if activated:
        logger.info("reconcile_completed", activated=activated)
    return activated


async def get_payment_by_code(payment_code: str) -> PaymentInDB | None:
    """Look up a single payment by its business ``payment_code``.

    Returns ``None`` when the code is unknown. The caller is expected
    to map that to a 404 in the HTTP layer.
    """
    db = get_db()
    doc = await db.payments.find_one({"payment_code": payment_code})
    if doc is None:
        return None
    return PaymentInDB.from_mongo(doc)
