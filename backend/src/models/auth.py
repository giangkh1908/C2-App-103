from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2)
    email: str
    password: str = Field(min_length=6)


class GoogleLoginRequest(BaseModel):
    credential: str


class TokenResponse(BaseModel):
    accessToken: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    verified: bool
    avatar: str | None = None
    createdAt: str


class AuthResponse(BaseModel):
    user: UserResponse
    accessToken: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str = Field(min_length=6)


class VerifyEmailRequest(BaseModel):
    token: str


class MessageResponse(BaseModel):
    detail: str
