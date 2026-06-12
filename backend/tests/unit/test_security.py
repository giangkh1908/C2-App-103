import pytest
from datetime import datetime, timedelta, timezone

from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


class TestPasswordHashing:
    def test_hash_password_returns_string(self):
        result = hash_password("mypassword")
        assert isinstance(result, str)
        assert result != "mypassword"

    def test_hash_password_different_each_time(self):
        hash1 = hash_password("mypassword")
        hash2 = hash_password("mypassword")
        assert hash1 != hash2

    def test_verify_password_correct(self):
        hashed = hash_password("mypassword")
        assert verify_password("mypassword", hashed) is True

    def test_verify_password_incorrect(self):
        hashed = hash_password("mypassword")
        assert verify_password("wrongpassword", hashed) is False


class TestTokenCreation:
    def test_create_access_token(self):
        token = create_access_token("user123", "user")
        assert isinstance(token, str)
        assert len(token) > 0

    def test_create_refresh_token(self):
        token = create_refresh_token("user123")
        assert isinstance(token, str)
        assert len(token) > 0

    def test_access_token_contains_claims(self):
        token = create_access_token("user123", "admin")
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "user123"
        assert payload["role"] == "admin"
        assert payload["type"] == "access"
        assert "exp" in payload

    def test_refresh_token_contains_claims(self):
        token = create_refresh_token("user123")
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "user123"
        assert payload["type"] == "refresh"
        assert "exp" in payload


class TestTokenDecoding:
    def test_decode_valid_token(self):
        token = create_access_token("user123", "user")
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "user123"

    def test_decode_invalid_token(self):
        payload = decode_token("invalid.token.here")
        assert payload is None

    def test_decode_expired_token(self):
        from jose import jwt
        from core.config import settings

        expired_data = {
            "sub": "user123",
            "type": "access",
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        }
        token = jwt.encode(expired_data, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
        payload = decode_token(token)
        assert payload is None
