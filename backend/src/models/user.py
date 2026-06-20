from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, Field


class UsageCounter(BaseModel):
    count: int = 0
    first_used_at: datetime | None = None


class UserInDB(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: str
    password_hash: str
    role: Literal["user", "admin"] = "user"
    verified: bool = False
    avatar: str | None = None
    plan_id: str = ""
    subscription_status: Literal["active", "cancelled", "expired"] = "active"
    subscription_expires_at: datetime | None = None
    usage: dict[str, UsageCounter] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    model_config = {"populate_by_name": True}

    @classmethod
    def from_mongo(cls, data: dict) -> "UserInDB":
        data["_id"] = str(data["_id"])
        usage_raw = data.get("usage", {})
        data["usage"] = {
            k: v if isinstance(v, dict) else {"count": 0, "first_used_at": None}
            for k, v in usage_raw.items()
        }
        return cls(**data)


def user_to_response(user: UserInDB) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "verified": user.verified,
        "avatar": user.avatar,
        "planId": user.plan_id,
        "subscriptionStatus": user.subscription_status,
        "createdAt": user.created_at.isoformat(),
    }


def create_user_doc(name: str, email: str, password_hash: str, plan_id: str = "") -> dict:
    now = datetime.now(UTC)
    return {
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "role": "user",
        "verified": False,
        "avatar": None,
        "plan_id": plan_id,
        "subscription_status": "active",
        "subscription_expires_at": None,
        "usage": {},
        "created_at": now,
        "updated_at": now,
    }
