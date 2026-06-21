"""Payment MongoDB model for SePay-based Vietnam payment flow.

Each document represents one payment intent created when a user
upgrades or extends their plan. The gateway posts a webhook
back; we mark the document as `paid` and persist the raw payload
for audit / reconciliation.
"""

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class PaymentStatus(StrEnum):
    """Lifecycle of a payment intent.

    - `pending`: created, waiting for user to pay at the gateway.
    - `paid`: gateway confirmed payment, quota granted to user.
    - `failed`: gateway rejected the payment (wrong amount, cancelled, ...).
    - `expired`: payment code expired before user paid.
    """

    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    EXPIRED = "expired"


class PaymentInDB(BaseModel):
    """Payment document as stored in MongoDB.

    Stored as `id` in the Python model with alias `_id` for the
    Mongo document. We keep the model attribute name Pythonic
    (`id`) but the on-wire name Mongo-native (`_id`), so the rest
    of the codebase can write `payment.id` while the document
    keeps its conventional shape.
    """

    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    user_id: str
    plan_id: str
    plan_name: str
    billing: Literal["monthly", "yearly"]
    amount_vnd: int = Field(ge=0)
    payment_code: str
    gateway: Literal["sepay"]
    status: PaymentStatus
    gateway_transaction_id: str | None = None
    raw_webhook_payload: dict[str, Any] | None = None
    created_at: datetime
    paid_at: datetime | None = None
    expires_at: datetime | None = None

    @classmethod
    def from_mongo(cls, data: dict[str, Any]) -> "PaymentInDB":
        """Build a PaymentInDB from a raw Mongo document.

        Mongo's `_id` is an ObjectId; we coerce to str for JSON
        safety before handing it to Pydantic. The model accepts
        either `id` or `_id` as a constructor keyword, so the
        normalized form is passed under `_id` to stay Mongo-native.
        """
        if "_id" in data and not isinstance(data["_id"], str):
            data["_id"] = str(data["_id"])
        return cls(**data)

    def to_mongo(self) -> dict[str, Any]:
        """Return a dict suitable for `collection.insert_one(...)`.

        Uses the `_id` alias to match Mongo's expected document
        shape, and drops `None` optional fields so documents stay
        compact.
        """
        return self.model_dump(by_alias=True, exclude_none=True)


def create_payment_doc(
    *,
    user_id: str,
    plan_id: str,
    plan_name: str,
    billing: Literal["monthly", "yearly"],
    amount_vnd: int,
    payment_code: str,
    expires_at: datetime | None = None,
) -> dict[str, Any]:
    """Build a fresh payment document dict ready to insert.

    Used by the service layer; the model is just the persisted shape.
    """
    now = datetime.now(UTC)
    return {
        "user_id": user_id,
        "plan_id": plan_id,
        "plan_name": plan_name,
        "billing": billing,
        "amount_vnd": amount_vnd,
        "payment_code": payment_code,
        "gateway": "sepay",
        "status": PaymentStatus.PENDING.value,
        "gateway_transaction_id": None,
        "raw_webhook_payload": None,
        "created_at": now,
        "paid_at": None,
        "expires_at": expires_at,
    }
