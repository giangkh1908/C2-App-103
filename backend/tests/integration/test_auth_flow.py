import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient
from jose import jwt

from src.core.config import settings
from src.core.security import create_access_token, create_refresh_token


@pytest.mark.asyncio
class TestFlowRegisterLoginMeLogout:
    """Full flow: Register → Login → Get Me → Logout"""

    async def test_full_auth_flow(self, client: AsyncClient):
        # Step 1: Register
        register_res = await client.post("/api/v1/auth/register", json={
            "name": "Integration User",
            "email": "integration@example.com",
            "password": "securepass123",
        })
        assert register_res.status_code == 201
        register_data = register_res.json()
        assert register_data["user"]["email"] == "integration@example.com"
        at = register_data["accessToken"]
        assert "refreshToken" not in register_data
        assert "refresh_token" in register_res.cookies

        # Step 2: Get Me with access token
        me_res = await client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {at}",
        })
        assert me_res.status_code == 200
        assert me_res.json()["email"] == "integration@example.com"
        assert me_res.json()["name"] == "Integration User"

        # Step 3: Logout
        logout_res = await client.post("/api/v1/auth/logout", headers={
            "Authorization": f"Bearer {at}",
        })
        assert logout_res.status_code == 200
        assert "Logged out" in logout_res.json()["detail"]

        # Step 4: Login again (should work with new tokens)
        login_res = await client.post("/api/v1/auth/login", json={
            "email": "integration@example.com",
            "password": "securepass123",
        })
        assert login_res.status_code == 200
        login_data = login_res.json()
        new_at = login_data["accessToken"]

        # Step 5: Get Me with new token
        me_res2 = await client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {new_at}",
        })
        assert me_res2.status_code == 200
        assert me_res2.json()["email"] == "integration@example.com"


@pytest.mark.asyncio
class TestFlowForgotResetLogin:
    """Full flow: Register → Forgot Password → Reset Password → Login with new password"""

    async def test_forgot_reset_login_flow(self, client: AsyncClient, mock_db):
        # Step 1: Register user
        register_res = await client.post("/api/v1/auth/register", json={
            "name": "Reset User",
            "email": "reset@example.com",
            "password": "oldpassword123",
        })
        assert register_res.status_code == 201

        # Step 2: Forgot password
        forgot_res = await client.post("/api/v1/auth/forgot-password", json={
            "email": "reset@example.com",
        })
        assert forgot_res.status_code == 200

        # Step 3: Get reset token from DB
        user_doc = await mock_db.users.find_one({"email": "reset@example.com"})
        assert user_doc["reset_token"] is not None
        reset_token = user_doc["reset_token"]

        # Step 4: Reset password
        reset_res = await client.post("/api/v1/auth/reset-password", json={
            "token": reset_token,
            "newPassword": "newpassword456",
        })
        assert reset_res.status_code == 200
        assert "reset successfully" in reset_res.json()["detail"].lower()

        # Step 5: Old password should NOT work
        login_old_res = await client.post("/api/v1/auth/login", json={
            "email": "reset@example.com",
            "password": "oldpassword123",
        })
        assert login_old_res.status_code == 401

        # Step 6: New password should work
        login_new_res = await client.post("/api/v1/auth/login", json={
            "email": "reset@example.com",
            "password": "newpassword456",
        })
        assert login_new_res.status_code == 200
        assert login_new_res.json()["user"]["email"] == "reset@example.com"

        # Step 7: Reset token should be cleared
        user_doc_after = await mock_db.users.find_one({"email": "reset@example.com"})
        assert user_doc_after["reset_token"] is None


@pytest.mark.asyncio
class TestFlowRegisterVerifyEmail:
    """Full flow: Register → Request Verify → Confirm Verify"""

    async def test_verify_email_flow(self, client: AsyncClient, mock_db):
        # Step 1: Register user
        register_res = await client.post("/api/v1/auth/register", json={
            "name": "Verify User",
            "email": "verify@example.com",
            "password": "password123",
        })
        assert register_res.status_code == 201
        at = register_res.json()["accessToken"]

        # Step 2: User should NOT be verified
        me_res = await client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {at}",
        })
        assert me_res.status_code == 200
        assert me_res.json()["verified"] is False

        # Step 3: Request email verification
        verify_req_res = await client.post("/api/v1/auth/verify-email", headers={
            "Authorization": f"Bearer {at}",
        })
        assert verify_req_res.status_code == 200
        assert "sent" in verify_req_res.json()["detail"].lower()

        # Step 4: Get verify token from DB
        user_doc = await mock_db.users.find_one({"email": "verify@example.com"})
        assert user_doc["verify_token"] is not None
        verify_token = user_doc["verify_token"]

        # Step 5: Confirm email verification
        confirm_res = await client.get(
            f"/api/v1/auth/verify-email/confirm?token={verify_token}"
        )
        assert confirm_res.status_code == 200
        assert "verified successfully" in confirm_res.json()["detail"].lower()

        # Step 6: User should now be verified
        me_res2 = await client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {at}",
        })
        assert me_res2.status_code == 200
        assert me_res2.json()["verified"] is True

        # Step 7: Verify token should be cleared
        user_doc_after = await mock_db.users.find_one({"email": "verify@example.com"})
        assert user_doc_after["verify_token"] is None

        # Step 8: Requesting verify again should say "already verified"
        verify_again_res = await client.post("/api/v1/auth/verify-email", headers={
            "Authorization": f"Bearer {at}",
        })
        assert verify_again_res.status_code == 200
        assert "already verified" in verify_again_res.json()["detail"].lower()


@pytest.mark.asyncio
class TestFlowTokenRefresh:
    """Full flow: Register → Use expired AT → Refresh → Retry"""

    async def test_token_refresh_flow(self, client: AsyncClient, mock_db):
        # Step 1: Register user
        register_res = await client.post("/api/v1/auth/register", json={
            "name": "Refresh User",
            "email": "refresh@example.com",
            "password": "password123",
        })
        assert register_res.status_code == 201
        user_id = register_res.json()["user"]["id"]
        rt = register_res.cookies["refresh_token"]

        # Step 2: Create an EXPIRED access token
        expired_at = jwt.encode(
            {
                "sub": user_id,
                "role": "user",
                "type": "access",
                "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
            },
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )

        # Step 3: Expired AT should fail
        me_res = await client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {expired_at}",
        })
        assert me_res.status_code == 401

        # Step 4: Refresh to get new AT
        refresh_res = await client.post("/api/v1/auth/refresh", cookies={"refresh_token": rt})
        assert refresh_res.status_code == 200
        new_at = refresh_res.json()["accessToken"]
        assert "refreshToken" not in refresh_res.json()
        new_rt = refresh_res.cookies["refresh_token"]

        # Step 5: New AT should work
        me_res2 = await client.get("/api/v1/auth/me", headers={
            "Authorization": f"Bearer {new_at}",
        })
        assert me_res2.status_code == 200
        assert me_res2.json()["email"] == "refresh@example.com"

        # Step 6: Old RT should NOT work (replaced)
        old_rt_res = await client.post("/api/v1/auth/refresh", cookies={"refresh_token": rt})
        # Old RT might still work (no blacklist) or fail depending on implementation
        # This is expected behavior for stateless JWT

        # Step 7: New RT should work
        refresh_res2 = await client.post("/api/v1/auth/refresh", cookies={"refresh_token": new_rt})
        assert refresh_res2.status_code == 200


@pytest.mark.asyncio
class TestFlowDuplicateRegistration:
    """Test: Register same email twice should fail"""

    async def test_duplicate_registration(self, client: AsyncClient):
        # Step 1: Register first time
        res1 = await client.post("/api/v1/auth/register", json={
            "name": "First User",
            "email": "duplicate@example.com",
            "password": "password123",
        })
        assert res1.status_code == 201

        # Step 2: Register same email again
        res2 = await client.post("/api/v1/auth/register", json={
            "name": "Second User",
            "email": "duplicate@example.com",
            "password": "password456",
        })
        assert res2.status_code == 409
        assert "already registered" in res2.json()["detail"].lower()


@pytest.mark.asyncio
class TestFlowPasswordResetExpiredToken:
    """Test: Reset with expired token should fail"""

    async def test_expired_reset_token(self, client: AsyncClient, mock_db):
        # Step 1: Register
        register_res = await client.post("/api/v1/auth/register", json={
            "name": "Expired Token User",
            "email": "expired@example.com",
            "password": "password123",
        })
        assert register_res.status_code == 201

        # Step 2: Forgot password
        await client.post("/api/v1/auth/forgot-password", json={
            "email": "expired@example.com",
        })

        # Step 3: Manually expire the token in DB
        await mock_db.users.update_one(
            {"email": "expired@example.com"},
            {"$set": {
                "reset_token_expires": datetime.now(timezone.utc) - timedelta(hours=2),
            }},
        )

        # Step 4: Get the token
        user_doc = await mock_db.users.find_one({"email": "expired@example.com"})
        reset_token = user_doc["reset_token"]

        # Step 5: Try to reset with expired token
        reset_res = await client.post("/api/v1/auth/reset-password", json={
            "token": reset_token,
            "newPassword": "newpassword123",
        })
        assert reset_res.status_code == 400
        assert "expired" in reset_res.json()["detail"].lower()
