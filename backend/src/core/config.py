from typing import Literal
from pydantic import Field
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
    mongodb_uri: str = Field(default="mongodb://localhost:27017", alias="MONGODB_URI")
    mongodb_db_name: str = Field(default="toan_truc_quan", alias="MONGODB_DB_NAME")

    # JWT
    jwt_secret_key: str = Field(default="change-me-in-production", alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(default=15, alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    jwt_refresh_token_expire_days: int = Field(default=7, alias="JWT_REFRESH_TOKEN_EXPIRE_DAYS")

    # CORS
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")

    # Google OAuth
    google_client_id: str = Field(default="", alias="GOOGLE_CLIENT_ID")

    # Email (Resend)
    resend_api_key: str = Field(default="", alias="RESEND_API_KEY")
    email_from: str = Field(default="noreply@yourdomain.com", alias="EMAIL_FROM")

    # LLM
    llm_provider: Literal["openai", "anthropic", "google"] = "openai"
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_model: str = "gpt-4o-mini"
    openai_temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    openai_max_tokens: int = Field(default=2048, ge=1, le=128000)

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }


# Singleton instance
settings = Settings()
