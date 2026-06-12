# API Documentation

Base URL: `http://localhost:8000/api/v1`

## Authentication

All protected endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### POST /auth/register

Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "verified": false,
    "avatar": null,
    "createdAt": "2024-01-01T00:00:00+00:00"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

The refresh token is set as an `httpOnly` `refresh_token` cookie scoped to `/api/v1/auth`.
It is not returned in the JSON response and must not be read or stored by frontend JavaScript.

**Errors:**
- `409` - Email already registered
- `422` - Validation error

---

### POST /auth/login

Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response (200):** Same as register response

**Errors:**
- `401` - Invalid email or password

---

### POST /auth/google

Login with Google ID token.

**Request Body:**
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):** Same as register response

**Errors:**
- `401` - Invalid Google token
- `503` - Google OAuth not configured

---

### POST /auth/refresh

Get a new access token using the `httpOnly` `refresh_token` cookie.

**Cookies:** `refresh_token=<refresh_token>`

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

A rotated refresh token is set in the `refresh_token` cookie.

**Errors:**
- `401` - Invalid refresh token

---

### GET /auth/me 🔒

Get current user info.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "verified": false,
  "avatar": null,
  "createdAt": "2024-01-01T00:00:00+00:00"
}
```

**Errors:**
- `401` - Invalid or expired token

---

### POST /auth/logout 🔒

Logout and clear the `refresh_token` cookie.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "detail": "Logged out successfully"
}
```

---

### POST /auth/forgot-password

Request password reset link.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "detail": "If the email exists, a reset link has been sent"
}
```

---

### POST /auth/reset-password

Reset password with token.

**Request Body:**
```json
{
  "token": "random-token-from-email",
  "newPassword": "newsecurepass123"
}
```

**Response (200):**
```json
{
  "detail": "Password has been reset successfully"
}
```

**Errors:**
- `400` - Invalid or expired reset token

---

### POST /auth/verify-email 🔒

Request email verification link.

**Headers:** `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "detail": "Verification email has been sent"
}
```

---

### GET /auth/verify-email/confirm

Confirm email verification.

**Query Parameters:**
- `token` - Verification token from email

**Response (200):**
```json
{
  "detail": "Email verified successfully"
}
```

**Errors:**
- `400` - Invalid or expired verification token

---

### GET /health

Health check endpoint.

**Response (200):**
```json
{
  "status": "ok"
}
```

## Error Response Format

All errors follow this format:
```json
{
  "detail": "Error message description"
}
```

## Rate Limiting

TODO: Implement rate limiting for auth endpoints.
