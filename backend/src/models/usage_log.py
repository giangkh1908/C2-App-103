from datetime import UTC, datetime

from pydantic import BaseModel, Field


class UsageLogEntry(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    action: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    plan_id: str

    model_config = {"populate_by_name": True}

    @classmethod
    def from_mongo(cls, data: dict) -> "UsageLogEntry":
        data["_id"] = str(data["_id"])
        return cls(**data)
