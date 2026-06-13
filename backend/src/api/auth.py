import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from core.config import settings
from core.database import get_db
from core.deps import get_current_user
from core.email import send_reset_password_email, send_verify_email
from core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from models.auth import (
    LoginRequest,
    RegisterRequest,
    GoogleLoginRequest,
    AuthResponse,
    TokenResponse,
    UserResponse,
    RefreshRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    VerifyEmailRequest,
    MessageResponse,
)
from models.user import UserInDB, user_to_response, create_user_doc

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest):
    db = get_db()
    email = req.email.strip().lower()

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user_doc = create_user_doc(
        name=req.name.strip(),
        email=email,
        password_hash=hash_password(req.password),
    )

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    user = UserInDB.from_mongo(user_doc)

    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id)

    return AuthResponse(
        user=user_to_response(user),
        tokens=TokenResponse(accessToken=access_token, refreshToken=refresh_token),
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    db = get_db()
    email = req.email.strip().lower()

    user_doc = await db.users.find_one({"email": email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user = UserInDB.from_mongo(user_doc)

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id)

    return AuthResponse(
        user=user_to_response(user),
        tokens=TokenResponse(accessToken=access_token, refreshToken=refresh_token),
    )


@router.post("/google", response_model=AuthResponse)
async def google_login(req: GoogleLoginRequest):
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth not configured",
        )

    try:
        idinfo = id_token.verify_oauth2_token(
            req.credential,
            google_requests.Request(),
            settings.google_client_id,
        )

        email = idinfo.get("email", "").strip().lower()
        name = idinfo.get("name", email.split("@")[0] if email else "User")
        avatar = idinfo.get("picture")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not found in Google token",
            )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

    db = get_db()
    user_doc = await db.users.find_one({"email": email})

    if user_doc:
        user = UserInDB.from_mongo(user_doc)
        if avatar and user.avatar != avatar:
            await db.users.update_one(
                {"_id": user_doc["_id"]},
                {"$set": {"avatar": avatar}},
            )
    else:
        new_user = create_user_doc(name=name, email=email, password_hash="")
        new_user["verified"] = True
        new_user["avatar"] = avatar
        result = await db.users.insert_one(new_user)
        new_user["_id"] = result.inserted_id
        user = UserInDB.from_mongo(new_user)

    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id)

    return AuthResponse(
        user=user_to_response(user),
        tokens=TokenResponse(accessToken=access_token, refreshToken=refresh_token),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(req: RefreshRequest):
    payload = decode_token(req.refreshToken)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload.get("sub")
    db = get_db()
    try:
        user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user_doc = None
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    user = UserInDB.from_mongo(user_doc)
    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(accessToken=access_token, refreshToken=refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserInDB = Depends(get_current_user)):
    return user_to_response(current_user)


@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: UserInDB = Depends(get_current_user)):
    db = get_db()
    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {
            "refresh_token": None,
            "refresh_token_expires": None,
        }},
    )
    return MessageResponse(detail="Logged out successfully")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(req: ForgotPasswordRequest):
    db = get_db()
    email = req.email.strip().lower()
    user_doc = await db.users.find_one({"email": email})

    if not user_doc:
        return MessageResponse(detail="If the email exists, a reset link has been sent")

    reset_token = secrets.token_urlsafe(32)
    reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)

    await db.users.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {
            "reset_token": reset_token,
            "reset_token_expires": reset_expires,
        }},
    )

    await send_reset_password_email(email, reset_token)

    return MessageResponse(detail="If the email exists, a reset link has been sent")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(req: ResetPasswordRequest):
    db = get_db()

    user_doc = await db.users.find_one({
        "reset_token": req.token,
        "reset_token_expires": {"$gt": datetime.now(timezone.utc)},
    })

    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    await db.users.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {
            "password_hash": hash_password(req.newPassword),
            "reset_token": None,
            "reset_token_expires": None,
        }},
    )

    return MessageResponse(detail="Password has been reset successfully")


@router.post("/verify-email", response_model=MessageResponse)
async def request_email_verification(
    current_user: UserInDB = Depends(get_current_user),
):
    db = get_db()

    if current_user.verified:
        return MessageResponse(detail="Email already verified")

    verify_token = secrets.token_urlsafe(32)
    verify_expires = datetime.now(timezone.utc) + timedelta(hours=24)

    await db.users.update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {
            "verify_token": verify_token,
            "verify_token_expires": verify_expires,
        }},
    )

    await send_verify_email(current_user.email, verify_token)

    return MessageResponse(detail="Verification email has been sent")


@router.get("/verify-email/confirm", response_model=MessageResponse)
async def confirm_email_verification(token: str):
    db = get_db()

    user_doc = await db.users.find_one({
        "verify_token": token,
        "verify_token_expires": {"$gt": datetime.now(timezone.utc)},
    })

    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    await db.users.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {
            "verified": True,
            "verify_token": None,
            "verify_token_expires": None,
        }},
    )

    return MessageResponse(detail="Email verified successfully")
