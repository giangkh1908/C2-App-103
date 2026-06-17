from pathlib import Path
from typing import Literal

from pydantic import AliasChoices, Field, field_validator, model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "ai-agent"
    app_env: Literal["development", "staging", "production"] = "development"
    debug: bool = False
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = Field(default=8000, ge=1024, le=65535)
    api_prefix: str = "/api/v1"

    # MongoDB
    mongodb_uri: str = Field(
        default="mongodb://localhost:27017",
        validation_alias=AliasChoices("MONGODB_URI", "MONGO_URI"),
    )
    mongodb_db_name: str = Field(
        default="toan_truc_quan",
        validation_alias=AliasChoices("MONGODB_DB_NAME", "MONGO_DB_NAME"),
    )

    # JWT
    jwt_secret_key: str = Field(default="", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(
        default=15, alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    jwt_refresh_token_expire_days: int = Field(
        default=7, alias="JWT_REFRESH_TOKEN_EXPIRE_DAYS"
    )

    # CORS
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")

    # Google OAuth
    google_client_id: str = Field(default="", alias="GOOGLE_CLIENT_ID")
    google_client_secret: str = Field(default="", alias="GOOGLE_CLIENT_SECRET")

    # Email (Resend)
    resend_api_key: str = Field(default="", alias="RESEND_API_KEY")
    email_from: str = Field(default="noreply@yourdomain.com", alias="EMAIL_FROM")

    # Langfuse
    langfuse_enabled: bool = Field(default=False, alias="LANGFUSE_ENABLED")
    langfuse_secret_key: str = Field(default="", alias="LANGFUSE_SECRET_KEY")
    langfuse_public_key: str = Field(default="", alias="LANGFUSE_PUBLIC_KEY")
    langfuse_host: str = Field(default="https://cloud.langfuse.com", alias="LANGFUSE_HOST")
    langfuse_capture_content: bool = Field(default=False, alias="LANGFUSE_CAPTURE_CONTENT")

    # Logging
    log_file_path: str = Field(default="logs/app.jsonl", alias="LOG_FILE_PATH")
    log_file_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = Field(
        default="DEBUG", alias="LOG_FILE_LEVEL"
    )
    log_file_max_bytes: int = Field(default=10_485_760, alias="LOG_FILE_MAX_BYTES")  # 10 MB
    log_file_backup_count: int = Field(default=5, alias="LOG_FILE_BACKUP_COUNT")

    # LLM
    llm_provider: Literal["openrouter"] = "openrouter"
    openrouter_api_key: str = Field(default="", alias="OPENROUTER_API_KEY")
    openrouter_model: str = Field(default="deepseek/deepseek-v4-flash", alias="OPENROUTER_MODEL")
    openrouter_temperature: float = Field(
        default=0.7, ge=0.0, le=2.0, alias="OPENROUTER_TEMPERATURE"
    )
    openrouter_max_tokens: int = Field(
        default=2048, ge=1, le=128000, alias="OPENROUTER_MAX_TOKENS"
    )
    openrouter_base_url: str = Field(
        default="https://openrouter.ai/api/v1",
        alias="OPENROUTER_BASE_URL",
    )
    openrouter_site_url: str = Field(default="http://localhost:3000", alias="OPENROUTER_SITE_URL")
    openrouter_app_name: str = Field(default="mathbuddy-ai-backend", alias="OPENROUTER_APP_NAME")

    @field_validator("debug", mode="before")
    @classmethod
    def normalize_debug(cls, value: object) -> bool | object:
        if isinstance(value, str):
            normalized = value.strip().strip("'\"").lower()
            if normalized in {"true", "1", "yes", "on", "debug"}:
                return True
            if normalized in {"false", "0", "no", "off", "release", "prod", "production"}:
                return False
        return value

    @field_validator("llm_provider", mode="before")
    @classmethod
    def normalize_llm_provider(cls, value: object) -> object:
        if isinstance(value, str):
            normalized = value.strip().strip("'\"").lower()
            if normalized == "openai":
                return "openrouter"
            return normalized
        return value

    @field_validator(
        "app_name",
        "api_host",
        "api_prefix",
        "frontend_url",
        "google_client_id",
        "google_client_secret",
        "resend_api_key",
        "email_from",
        "openrouter_api_key",
        "openrouter_model",
        "openrouter_base_url",
        "openrouter_site_url",
        "openrouter_app_name",
        "jwt_secret_key",
        "jwt_algorithm",
        "mongodb_uri",
        "mongodb_db_name",
        "langfuse_secret_key",
        "langfuse_public_key",
        "langfuse_host",
        "log_file_path",
        mode="before",
    )
    @classmethod
    def strip_quoted_strings(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().strip("'\"")
        return value

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        weak_jwt_secrets = {
            "",
            "change-me-in-production",
            "your-super-secret-jwt-key-change-this-in-production",
            "replace-with-32-plus-random-characters",
        }
        jwt_secret = self.jwt_secret_key.strip()

        if self.app_env in {"staging", "production"}:
            if jwt_secret in weak_jwt_secrets or len(jwt_secret) < 32:
                raise ValueError(
                    "JWT_SECRET_KEY must be set to a non-default value with at least "
                    "32 characters in staging and production"
                )

        return self

    model_config = {
        "env_file": str(Path(__file__).resolve().parents[2] / ".env"),
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
        "populate_by_name": True,
    }


# Singleton instance
settings = Settings()
