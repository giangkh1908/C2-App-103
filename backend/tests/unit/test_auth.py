import pytest
from google.auth.exceptions import TransportError
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient


@pytest.mark.asyncio
class TestRegister:
    async def test_register_success(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/register", json={
            "name": "New User",
            "email": "new@example.com",
            "password": "password123",
        })
        assert response.status_code == 201
        data = response.json()
        assert data["user"]["email"] == "new@example.com"
        assert data["user"]["name"] == "New User"
        assert "accessToken" in data
        assert "refreshToken" not in data
        assert "refresh_token" in response.cookies

    async def test_register_duplicate_email(self, client: AsyncClient, test_user):
        response = await client.post("/api/v1/auth/register", json={
            "name": "Duplicate",
            "email": "test@example.com",
            "password": "password123",
        })
        assert response.status_code == 409
        assert "already registered" in response.json()["detail"]

    async def test_register_missing_fields(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/register", json={
            "email": "test@example.com",
        })
        assert response.status_code == 422


@pytest.mark.asyncio
class TestLogin:
    async def test_login_success(self, client: AsyncClient, test_user):
        response = await client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "password123",
        })
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["email"] == "test@example.com"
        assert "accessToken" in data
        assert "refreshToken" not in data
        assert "refresh_token" in response.cookies

    async def test_login_wrong_password(self, client: AsyncClient, test_user):
        response = await client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "wrongpassword",
        })
        assert response.status_code == 401

    async def test_login_nonexistent_email(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "password123",
        })
        assert response.status_code == 401


@pytest.mark.asyncio
class TestRefresh:
    async def test_refresh_success(self, client: AsyncClient, test_user):
        from src.core.security import create_refresh_token

        user_id = str(test_user["_id"])
        rt = create_refresh_token(user_id)

        response = await client.post("/api/v1/auth/refresh", cookies={"refresh_token": rt})
        assert response.status_code == 200
        data = response.json()
        assert "accessToken" in data
        assert "refreshToken" not in data
        assert "refresh_token" in response.cookies

    async def test_refresh_invalid_token(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/auth/refresh",
            cookies={"refresh_token": "invalid.token.here"},
        )
        assert response.status_code == 401

    async def test_refresh_missing_cookie(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/refresh")
        assert response.status_code == 401

    async def test_refresh_access_token_rejected(self, client: AsyncClient, test_user):
        from src.core.security import create_access_token

        user_id = str(test_user["_id"])
        at = create_access_token(user_id, "user")

        response = await client.post("/api/v1/auth/refresh", cookies={"refresh_token": at})
        assert response.status_code == 401


@pytest.mark.asyncio
class TestLogout:
    async def test_logout_success(self, client: AsyncClient, auth_headers):
        response = await client.post(
            "/api/v1/auth/logout",
            headers=auth_headers,
            cookies={"refresh_token": "token-to-clear"},
        )
        assert response.status_code == 200
        assert "Logged out" in response.json()["detail"]
        assert response.cookies.get("refresh_token") is None

    async def test_logout_without_auth(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/logout")
        assert response.status_code == 403


@pytest.mark.asyncio
class TestGetMe:
    async def test_get_me_success(self, client: AsyncClient, auth_headers, test_user):
        response = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"

    async def test_get_me_without_auth(self, client: AsyncClient):
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 403

    async def test_get_me_invalid_token(self, client: AsyncClient):
        headers = {"Authorization": "Bearer invalid.token.here"}
        response = await client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 401


@pytest.mark.asyncio
class TestForgotPassword:
    async def test_forgot_password_existing_email(self, client: AsyncClient, test_user):
        response = await client.post("/api/v1/auth/forgot-password", json={
            "email": "test@example.com",
        })
        assert response.status_code == 200
        assert "reset link" in response.json()["detail"].lower()

    async def test_forgot_password_nonexistent_email(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/forgot-password", json={
            "email": "nonexistent@example.com",
        })
        assert response.status_code == 200
        assert "reset link" in response.json()["detail"].lower()


@pytest.mark.asyncio
class TestResetPassword:
    async def test_reset_password_success(self, client: AsyncClient, test_user, mock_db):
        import secrets
        from datetime import datetime, timedelta, timezone

        token = secrets.token_urlsafe(32)
        await mock_db.users.update_one(
            {"_id": test_user["_id"]},
            {"$set": {
                "reset_token": token,
                "reset_token_expires": datetime.now(timezone.utc) + timedelta(hours=1),
            }},
        )

        response = await client.post("/api/v1/auth/reset-password", json={
            "token": token,
            "newPassword": "newpassword123",
        })
        assert response.status_code == 200
        assert "reset successfully" in response.json()["detail"].lower()

    async def test_reset_password_invalid_token(self, client: AsyncClient):
        response = await client.post("/api/v1/auth/reset-password", json={
            "token": "invalidtoken",
            "newPassword": "newpassword123",
        })
        assert response.status_code == 400

    async def test_reset_password_expired_token(self, client: AsyncClient, test_user, mock_db):
        import secrets
        from datetime import datetime, timedelta, timezone

        token = secrets.token_urlsafe(32)
        await mock_db.users.update_one(
            {"_id": test_user["_id"]},
            {"$set": {
                "reset_token": token,
                "reset_token_expires": datetime.now(timezone.utc) - timedelta(hours=1),
            }},
        )

        response = await client.post("/api/v1/auth/reset-password", json={
            "token": token,
            "newPassword": "newpassword123",
        })
        assert response.status_code == 400


@pytest.mark.asyncio
class TestVerifyEmail:
    async def test_verify_email_request_success(self, client: AsyncClient, auth_headers, test_user):
        response = await client.post("/api/v1/auth/verify-email", headers=auth_headers)
        assert response.status_code == 200
        assert "sent" in response.json()["detail"].lower()

    async def test_verify_email_already_verified(self, client: AsyncClient, auth_headers, test_user, mock_db):
        await mock_db.users.update_one(
            {"_id": test_user["_id"]},
            {"$set": {"verified": True}},
        )
        response = await client.post("/api/v1/auth/verify-email", headers=auth_headers)
        assert response.status_code == 200
        assert "already verified" in response.json()["detail"].lower()

    async def test_verify_email_confirm_success(self, client: AsyncClient, test_user, mock_db):
        import secrets
        from datetime import datetime, timedelta, timezone

        token = secrets.token_urlsafe(32)
        await mock_db.users.update_one(
            {"_id": test_user["_id"]},
            {"$set": {
                "verify_token": token,
                "verify_token_expires": datetime.now(timezone.utc) + timedelta(hours=24),
            }},
        )

        response = await client.get(f"/api/v1/auth/verify-email/confirm?token={token}")
        assert response.status_code == 200
        assert "verified successfully" in response.json()["detail"].lower()

    async def test_verify_email_confirm_invalid_token(self, client: AsyncClient):
        response = await client.get("/api/v1/auth/verify-email/confirm?token=invalidtoken")
        assert response.status_code == 400


@pytest.mark.asyncio
class TestGoogleLogin:
    async def test_google_login_not_configured(self, client: AsyncClient):
        with patch("src.api.auth.settings.google_client_id", ""):
            response = await client.post("/api/v1/auth/google", json={
                "credential": "sometoken",
            })
            assert response.status_code == 503

    async def test_google_login_invalid_token(self, client: AsyncClient):
        with patch("src.api.auth.settings.google_client_id", "fake-client-id"):
            with patch("google.oauth2.id_token.verify_oauth2_token", side_effect=ValueError("Invalid")):
                response = await client.post("/api/v1/auth/google", json={
                    "credential": "invalidtoken",
                })
                assert response.status_code == 401

    async def test_google_login_verification_unavailable(self, client: AsyncClient):
        with patch("src.api.auth.settings.google_client_id", "fake-client-id"):
            with patch(
                "google.oauth2.id_token.verify_oauth2_token",
                side_effect=TransportError("Google cert fetch failed"),
            ):
                response = await client.post(
                    "/api/v1/auth/google",
                    headers={"Origin": "http://localhost:3000"},
                    json={"credential": "invalidtoken"},
                )
                assert response.status_code == 503
                assert response.json()["detail"] == "Google OAuth verification unavailable"
                assert response.headers["access-control-allow-origin"] == "http://localhost:3000"

    async def test_google_login_success_creates_user(self, client: AsyncClient, mock_db):
        with patch("src.api.auth.settings.google_client_id", "fake-client-id"):
            with patch(
                "google.oauth2.id_token.verify_oauth2_token",
                return_value={
                    "email": "google@example.com",
                    "name": "Google User",
                    "picture": "https://example.com/avatar.png",
                },
            ):
                response = await client.post(
                    "/api/v1/auth/google",
                    headers={"Origin": "http://localhost:3000"},
                    json={"credential": "valid-google-credential"},
                )

        assert response.status_code == 200
        data = response.json()
        assert data["user"]["email"] == "google@example.com"
        assert data["user"]["name"] == "Google User"
        assert data["user"]["verified"] is True
        assert "accessToken" in data
        assert "refresh_token" in response.cookies

        user_doc = await mock_db.users.find_one({"email": "google@example.com"})
        assert user_doc is not None


@pytest.mark.asyncio
class TestHealthCheck:
    async def test_health(self, client: AsyncClient):
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
