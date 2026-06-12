# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Next.js Frontend (SSR + Static)                         │   │
│  │  - Landing Page (SEO)                                    │   │
│  │  - Auth Pages (Login, Register, Forgot Password)         │   │
│  │  - Dashboard (Protected)                                 │   │
│  │  - AuthProvider (localStorage + auto-refresh)            │   │
│  └──────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Layer (/api/v1)                                     │   │
│  │  - /auth/* (Register, Login, Logout, Refresh, etc.)      │   │
│  │  - /auth/me (Protected endpoint)                         │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│  ┌──────────────────────────┼───────────────────────────────┐   │
│  │  Core Layer                │                               │   │
│  │  - config.py (Settings)    │                               │   │
│  │  - database.py (MongoDB)   │                               │   │
│  │  - security.py (JWT+bcrypt)│                               │   │
│  │  - deps.py (Auth middleware)│                              │   │
│  │  - email.py (Resend)       │                               │   │
│  └──────────────────────────┼───────────────────────────────┘   │
│  ┌──────────────────────────┼───────────────────────────────┐   │
│  │  Models Layer              │                               │   │
│  │  - user.py (UserInDB)      │                               │   │
│  │  - auth.py (Request/Response schemas)                     │   │
│  └──────────────────────────┼───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ MongoDB  │   │  Resend  │   │  Google  │
        │  Atlas   │   │  Email   │   │  OAuth   │
        └──────────┘   └──────────┘   └──────────┘
```

## Directory Structure

```
backend/
├── src/
│   ├── main.py              # FastAPI app entry point
│   ├── core/                # Core utilities
│   │   ├── config.py        # Environment settings
│   │   ├── database.py      # MongoDB connection
│   │   ├── security.py      # JWT + bcrypt
│   │   ├── deps.py          # FastAPI dependencies
│   │   └── email.py         # Email service
│   ├── models/              # Pydantic models
│   │   ├── user.py          # User document model
│   │   └── auth.py          # Auth request/response
│   ├── api/                 # API routes
│   │   ├── __init__.py      # Router aggregator
│   │   └── auth.py          # Auth endpoints
│   └── agent/               # AI agent (future)
├── tests/
│   ├── conftest.py          # Shared fixtures
│   ├── unit/                # Unit tests
│   │   ├── test_auth.py     # Auth endpoint tests
│   │   └── test_security.py # Security utility tests
│   ├── integration/         # Integration tests
│   │   └── test_auth_flow.py # Full auth flow tests
│   └── eval/                # Agent evaluation tests
├── docs/                    # Documentation
├── eval/                    # Evaluation datasets
└── pyproject.toml           # Dependencies
```

## Data Flow

### Authentication Flow

```
1. Register:
   Client → POST /auth/register → Hash password → Save to MongoDB → Return AT+RT

2. Login:
   Client → POST /auth/login → Verify password → Issue AT+RT → Return AT+RT

3. Access Protected Resource:
   Client → GET /auth/me (Bearer AT) → Verify AT → Return user data

4. Token Refresh:
   Client → POST /auth/refresh (RT) → Verify RT → Issue new AT+RT

5. Logout:
   Client → POST /auth/logout (Bearer AT) → Clear RT in DB → Return success
```

### Token Strategy

- **Access Token (AT)**: 15 min expiry, contains user_id + role
- **Refresh Token (RT)**: 7 day expiry, stored in MongoDB for revocation
- **Storage**: Frontend localStorage (httpOnly cookies for production)

## Security Considerations

1. Password hashing with bcrypt
2. JWT tokens with expiry
3. CORS restricted to frontend origin
4. Rate limiting (TODO)
5. Input validation with Pydantic
6. SQL injection prevention (MongoDB parameterized queries)
