"""HTTP layer for the SePay-based Vietnam payment flow.

Three endpoints:

- ``POST /api/v1/payment/webhook/sepay`` — public endpoint hit by the
  SePay gateway. Verifies the ``Authorization: Apikey <KEY>`` header,
  parses the SePay JSON payload, and delegates the
  pending->paid transition (plus user activation) to
  ``payment_service.verify_and_mark_paid``. Returns ``{"success": true}``
  with HTTP 200 in all cases — even on processing errors — to avoid
  SePay retry loops. All errors are logged for audit.

- ``POST /api/v1/payment/checkout`` — authenticated. Creates a new
  ``pending`` payment intent via ``payment_service.create_payment`` and
  returns the business ``payment_code`` plus a QR URL the frontend can
  render for the user to scan.

- ``GET /api/v1/payment/status/{payment_code}`` — authenticated.
  Returns the current lifecycle state of the payment.

The webhook route is intentionally NOT behind ``get_current_user`` — the
gateway has no user JWT. Auth is performed by comparing the inbound
``Authorization`` header against ``settings.sepay_webhook_api_key``.
"""

from __future__ import annotations

import hashlib
import hmac
import re
import secrets
from typing import Any, Literal

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel

from src.core.config import settings
from src.core.deps import get_current_user
from src.core.logging import get_logger
from src.models.payment import PaymentInDB, PaymentStatus
from src.models.user import UserInDB
from src.services import payment_service

logger = get_logger("toan_truc_quan.payment_api")

router = APIRouter(prefix="/payment", tags=["payment"])


# ---------------------------------------------------------------------------
# Pydantic request/response shapes
# ---------------------------------------------------------------------------


class CheckoutRequest(BaseModel):
    """Body for ``POST /payment/checkout``."""

    plan_name: Literal["plus", "premium"]
    billing: Literal["monthly", "yearly"]


class CheckoutResponse(BaseModel):
    """Response for ``POST /payment/checkout``.

    The frontend renders ``qr_url`` as an image the user scans with
    their banking app; the bank-side transfer content MUST match
    ``payment_code`` verbatim for the webhook to find the intent.
    """

    payment_code: str
    amount_vnd: int
    qr_url: str
    plan_name: str
    billing: Literal["monthly", "yearly"]
    created_at: str | None = None
    expires_at: str | None = None


class PaymentStatusResponse(BaseModel):
    """Response for ``GET /payment/status/{payment_code}``."""

    payment_code: str
    status: PaymentStatus
    plan_name: str
    billing: Literal["monthly", "yearly"]
    amount_vnd: int
    created_at: str | None = None
    paid_at: str | None = None
    expires_at: str | None = None


# ---------------------------------------------------------------------------
# Webhook: SePay -> backend
# ---------------------------------------------------------------------------


# Constant-time API key compare. ``hmac.compare_digest`` is the only
# safe way to compare two opaque tokens; ``==`` short-circuits on the
# first mismatching byte and leaks length + position via timing.
def _verify_sepay_api_key(authorization: str | None) -> bool:
    """Return True iff ``authorization`` carries the configured
    ``Apikey`` credential. Header is matched with ``hmac.compare_digest``
    so we never leak the configured key via timing."""
    if not authorization:
        return False
    expected_key = (settings.sepay_webhook_api_key or "").strip()
    if not expected_key:
        # Refuse all webhooks when the server is misconfigured — the
        # operator must explicitly set SEPAY_WEBHOOK_API_KEY before the
        # gateway can ping us.
        logger.error("sepay_webhook_misconfigured")
        return False
    scheme, _, supplied = authorization.partition(" ")
    if scheme.lower() != "apikey" or not supplied:
        return False
    return hmac.compare_digest(
        supplied.strip().encode("utf-8"),
        expected_key.encode("utf-8"),
    )


# Generate the QR URL the user scans. We embed the payment_code as the
# transfer content (SePay looks it up by exact match) and the amount
# in VND. The QR is a plain text payload rendered by the frontend —
# we deliberately keep the URL shape simple and stable so the frontend
# can swap the renderer (qrcode.react, qrcode.js, etc.) without a
# backend change.
def _build_qr_url(payment_code: str, amount_vnd: int) -> str:
    """Return a stable QR image URL for the given payment.

    The URL embeds the business ``payment_code`` and the exact
    ``amount_vnd`` the user must transfer. The banking app uses the
    amount + content to disambiguate concurrent transfers and to
    reconcile with the gateway webhook.

    Returns an empty string when the SePay bank account is not yet
    configured in the environment — the frontend then falls back to
    its own client-side QR builder or shows a "QR unavailable" message.
    """
    from urllib.parse import quote

    bank = settings.sepay_bank_name or ""
    acc = settings.sepay_bank_account or ""
    if not bank or not acc:
        logger.warning(
            "sepay_qr_missing_config",
            has_bank=bool(bank),
            has_account=bool(acc),
        )
        return ""

    # Tham số ``des`` là nội dung chuyển khoản hiển thị trong app ngân hàng.
    # KHÔNG dùng ``content`` — SePay không nhận diện tham số này, QR sẽ thiếu nội dung.
    template = (
        "https://qr.sepay.vn/img"
        f"?bank={quote(bank)}"
        f"&acc={quote(acc)}"
        f"&amount={int(amount_vnd)}"
        f"&des={quote(payment_code)}"
        "&template=compact"
    )
    return template


# Regex để trích xuất TTQ... payment_code từ nội dung chuyển khoản.
# Format: TTQ + 6 hex chars (user_id prefix) + unix timestamp + 6 hex chars (random)
# Ví dụ: "TTQa1b2c31713456789d0e1f2" nằm lẫn trong "KIM HONG GIANG chuyen tien..."
_PAYMENT_CODE_RE = re.compile(r"TTQ[a-fA-F0-9]{6}\d+[a-fA-F0-9]{6}")


def _extract_payment_code(payload: dict[str, Any]) -> str | None:
    """Trích xuất payment_code từ SePay webhook payload.

    Ưu tiên dùng trường ``code`` (SePay QR flow) — đây là mã SePay
    sinh ra khi user quét QR, chứa chính xác payment_code ta đã nhúng
    vào QR URL.

    Nếu ``code`` rỗng (user chuyển thủ công, không quét QR), parse
    trường ``content`` bằng regex để tìm mã ``TTQ...`` nằm lẫn trong
    nội dung tin nhắn ngân hàng.
    """
    # Path 1: SePay QR — code field chứa chính payment_code
    code = payload.get("code")
    if code and isinstance(code, str) and code.strip():
        return code.strip()

    # Path 2: Manual transfer — parse content để tìm TTQ...
    content = payload.get("content")
    if not content or not isinstance(content, str):
        return None

    match = _PAYMENT_CODE_RE.search(content)
    if match:
        return match.group(0)

    return None


@router.post("/webhook/sepay")
async def sepay_webhook(
    payload: dict[str, Any],
    authorization: str | None = Header(default=None, alias="Authorization"),
) -> dict[str, bool]:
    """Receive a SePay transfer webhook and reconcile the payment.

    SePay POSTs the transfer details as JSON. The shape (per the
    gateway docs) includes ``id``, ``gateway``, ``code``, ``content``,
    ``transferType``, ``transferAmount``, ``referenceCode``. We only
    act on inbound transfers (``transferType == "in"``) and ignore
    outbound ones to avoid a class of misbooked credits.

    Auth: ``Authorization: Apikey <settings.sepay_webhook_api_key>``.
    No JWT — the gateway has no user identity.

    Response: always ``{"success": true}`` with HTTP 200. The gateway
    treats anything other than 2xx as a retry, and we would rather
    lose a single audit row than burn the gateway's retry budget on
    a transient DB blip.
    """
    # 1) Audit-log the raw inbound (PII scrubbing happens in the log
    #    pipeline; we only put non-sensitive fields here). We log
    #    BEFORE the auth check so a misconfigured header still shows
    #    up in the audit trail.
    inbound_id = payload.get("id")
    logger.info(
        "sepay_webhook_received",
        gateway=payload.get("gateway"),
        code=payload.get("code"),
        transfer_type=payload.get("transferType"),
        transfer_amount=payload.get("transferAmount"),
        reference_code=payload.get("referenceCode"),
    )

    # 2) Auth check. We return 401 (not 200) on a bad API key: the
    #    gateway treats 4xx as "give up", which is what we want for
    #    a permanently misconfigured credential. Processing errors
    #    further down the stack (DB blip, etc.) still get a 200 so
    #    they don't burn the gateway's retry budget.
    if not _verify_sepay_api_key(authorization):
        # Hash the supplied key for the audit log so we can correlate
        # repeat offenders without storing the secret itself.
        supplied = ""
        if authorization:
            scheme, _, value = authorization.partition(" ")
            supplied = hashlib.sha256(value.encode("utf-8")).hexdigest()[:12] if value else ""
        logger.warning(
            "sepay_webhook_unauthorized",
            supplied_key_hash=supplied,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid SePay API key.",
        )

    # 3) Filter: only process inbound transfers.
    transfer_type = payload.get("transferType")
    if transfer_type != "in":
        logger.info(
            "sepay_webhook_skipped_non_inbound",
            transfer_type=transfer_type,
        )
        return {"success": True}

    # 4) Resolve the payment_code from the inbound payload.
    #
    #    Two paths:
    #    - QR-based transfers: SePay stores the embedded content in
    #      ``code``. This is the preferred field because it contains
    #      exactly what we embedded in the QR URL.
    #    - Manual transfers (user tự gõ nội dung chuyển khoản): SePay
    #      echoes the full bank transfer message in ``content``, e.g.
    #      "KIM HONG GIANG chuyen tien ... Ma giao dich Trace840778".
    #      We parse that text with a regex to extract the TTQ... code.
    payment_code = _extract_payment_code(payload)
    if not payment_code:
        logger.warning(
            "sepay_webhook_missing_content",
            payload_id=inbound_id,
            code_field=payload.get("code"),
            content_preview=(payload.get("content") or "")[:80],
        )
        return {"success": True}

    # 5) Coerce amount. SePay sends it as an int; if it's a string
    #    (some clients do that) we still want a clean rejection log.
    raw_amount = payload.get("transferAmount")
    try:
        amount = int(raw_amount)
    except (TypeError, ValueError):
        logger.warning(
            "sepay_webhook_invalid_amount",
            payment_code=payment_code,
            raw_amount=raw_amount,
        )
        return {"success": True}

    # 6) Resolve the gateway transaction id. SePay's ``id`` is the
    #    globally-unique transaction id; we prefer it and only
    #    fall back to ``referenceCode`` (the bank's ref number) for
    #    older gateway variants that omit it. The value may be an
    #    int, a string, or an array — normalize to a single string.
    raw_txn = payload.get("id")
    if raw_txn is None:
        raw_txn = payload.get("referenceCode")
    if isinstance(raw_txn, list):
        gateway_txn_id = ",".join(str(x) for x in raw_txn)
    elif raw_txn is None:
        gateway_txn_id = secrets.token_hex(8)
    else:
        gateway_txn_id = str(raw_txn)

    # 7) Delegate the atomic flip + user activation to the service.
    #    On transient exceptions (DB blip, network timeout), return 500
    #    so the gateway retries. The reconciliation job also catches
    #    any payments that slipped through.
    try:
        updated = await payment_service.verify_and_mark_paid(
            payment_code=payment_code,
            amount=amount,
            gateway_txn_id=gateway_txn_id,
            raw_payload=payload,
        )
    except Exception:
        logger.exception(
            "sepay_webhook_processing_error",
            payment_code=payment_code,
            gateway_txn_id=gateway_txn_id,
        )
        # Return 500 so SePay retries — a transient DB error should
        # not be swallowed as 200.
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Processing error — gateway should retry.",
        )

    if updated is None:
        # Service refused: unknown code, wrong amount, already settled,
        # or expired. All three are NOT transient — replying 200
        # stops the gateway from retrying.
        logger.info(
            "sepay_webhook_no_op",
            payment_code=payment_code,
            gateway_txn_id=gateway_txn_id,
        )
    else:
        logger.info(
            "sepay_webhook_paid",
            payment_code=payment_code,
            gateway_txn_id=gateway_txn_id,
            plan_name=updated.plan_name,
        )
    return {"success": True}


# ---------------------------------------------------------------------------
# Authenticated checkout + status
# ---------------------------------------------------------------------------


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_checkout(
    body: CheckoutRequest,
    current_user: UserInDB = Depends(get_current_user),
) -> CheckoutResponse:
    """Create a new ``pending`` payment intent for the caller.

    The returned ``payment_code`` and ``amount_vnd`` are what the user
    enters / sees in their banking app; ``qr_url`` is a ready-to-render
    image URL the frontend can drop straight into an ``<img>`` tag.
    """
    try:
        payment: PaymentInDB = await payment_service.create_payment(
            user_id=current_user.id,
            plan_name=body.plan_name,
            billing=body.billing,
        )
    except ValueError as exc:
        # Plan not in catalog, free plan passed, or price
        # misconfiguration. All three map cleanly to 400.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return CheckoutResponse(
        payment_code=payment.payment_code,
        amount_vnd=payment.amount_vnd,
        qr_url=_build_qr_url(payment.payment_code, payment.amount_vnd),
        plan_name=payment.plan_name,
        billing=payment.billing,
        created_at=payment.created_at.isoformat() if payment.created_at else None,
        expires_at=payment.expires_at.isoformat() if payment.expires_at else None,
    )


@router.get("/status/{payment_code}", response_model=PaymentStatusResponse)
async def get_payment_status(
    payment_code: str,
    current_user: UserInDB = Depends(get_current_user),
) -> PaymentStatusResponse:
    """Return the current lifecycle state of one payment.

    Only the owning user can read their own payment — 404 is returned
    when the code is unknown OR belongs to a different user, to avoid
    leaking the existence of someone else's payment_code to an
    attacker.
    """
    payment = await payment_service.get_payment_by_code(payment_code)
    if payment is None or payment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found.",
        )

    if payment.status == PaymentStatus.PENDING:
        await payment_service.expire_if_session_overdue(payment_code)
        payment = await payment_service.get_payment_by_code(payment_code)

    return PaymentStatusResponse(
        payment_code=payment.payment_code,
        status=payment.status,
        plan_name=payment.plan_name,
        billing=payment.billing,
        amount_vnd=payment.amount_vnd,
        created_at=payment.created_at.isoformat() if payment.created_at else None,
        paid_at=payment.paid_at.isoformat() if payment.paid_at else None,
        expires_at=payment.expires_at.isoformat() if payment.expires_at else None,
    )


@router.post("/cancel/{payment_code}")
async def cancel_payment(
    payment_code: str,
    current_user: UserInDB = Depends(get_current_user),
) -> dict:
    """User cancels their own pending payment."""
    result = await payment_service.cancel_payment(payment_code, current_user.id)
    if result is None:
        # Could be: not found, not owned, or not pending — don't leak which
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"status": "ok", "payment_code": payment_code, "new_status": "expired"}
