from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field
from bson import ObjectId


class UserInDB(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: str
    password_hash: str
    role: Literal["user", "admin"] = "user"
    verified: bool = False
    avatar: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}

    @classmethod
    def from_mongo(cls, data: dict) -> "UserInDB":
        data["_id"] = str(data["_id"])
        return cls(**data)


def user_to_response(user: UserInDB) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "verified": user.verified,
        "avatar": user.avatar,
        "createdAt": user.created_at.isoformat(),
    }


def create_user_doc(name: str, email: str, password_hash: str) -> dict:
    now = datetime.now(timezone.utc)
    return {
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "role": "user",
        "verified": False,
        "avatar": None,
        "created_at": now,
        "updated_at": now,
    }
