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
│  │  - AuthProvider (memory access token + cookie refresh)   │   │
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
│   │   ├── deps.py          # get_current_user, get_current_admin
│   │   └── email.py         # Email service
│   ├── models/              # Pydantic models
│   │   ├── user.py          # User document model
│   │   ├── auth.py          # Auth request/response
│   │   ├── chat.py          # ChatTurnRequest/Response
│   │   └── lesson.py        # LessonGenerateRequest/Response
│   ├── api/                 # API routes
│   │   ├── __init__.py      # Router aggregator
│   │   ├── auth.py          # Auth endpoints
│   │   ├── chat.py          # POST /chat/turn (auth required)
│   │   ├── lessons.py       # POST /lessons/generate (auth required)
│   │   └── topics.py        # GET /topics (public)
│   ├── services/            # Business logic
│   │   ├── learning_core.py # LearningCoreService
│   │   └── ...
│   └── agents/              # AI agents
│       ├── chat_orchestrator.py
│       └── tutor_agent.py
├── tests/
│   ├── conftest.py          # Shared fixtures (test_user, auth_headers)
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   │   ├── test_auth_flow.py
│   │   ├── test_chat_flow.py
│   │   └── test_learning_contracts.py
│   └── agents/              # Agent tests
├── docs/                    # Documentation
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

### Protected API Flow

```
Chat: Client → apiFetch("/chat/turn", ...) → Bearer AT injected → Verify AT → TutorChatOrchestrator.handle_turn(request, user_id) → LearningCoreService

Lessons: Client → apiFetch("/lessons/generate", ...) → Bearer AT injected → Verify AT → LearningCoreService.generate(LearningCoreRequest(user_id=auth_user.id))

Topics: Client → fetch("/topics") → Public (no auth) → Return topic list
```

### Token Strategy

- **Access Token (AT)**: 15 min expiry, contains user_id + role
- **Refresh Token (RT)**: 7 day expiry, stored in MongoDB for revocation
- **Storage**: Access token in frontend memory; refresh token in httpOnly cookie

## Security Considerations

1. Password hashing with bcrypt
2. JWT tokens with expiry
3. CORS restricted to frontend origin
4. Rate limiting (TODO)
5. Input validation with Pydantic
6. SQL injection prevention (MongoDB parameterized queries)
