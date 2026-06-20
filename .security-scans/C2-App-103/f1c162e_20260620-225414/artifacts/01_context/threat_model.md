# Overview

This repository implements a child/student-facing mathematics learning application with a public Next.js frontend and FastAPI backend. MongoDB is authoritative storage; OpenRouter supplies LLM responses; Google OAuth, Resend, and optional Langfuse are external dependencies. A separate developer workflow records AI-tool activity and may submit it to an operator-configured logging service.

Primary runtime surfaces are authentication, chat/SSE, lesson generation, practice, chat history, public plan metadata, user subscription/usage state, and admin metrics. Grounding controls include `backend/src/main.py`, `backend/src/api/__init__.py`, `backend/src/core/deps.py`, `backend/src/core/security.py`, and `backend/src/services/`.

# Threat Model, Trust Boundaries, and Assumptions

## Assets and privileges

- Accounts, password hashes, access/refresh tokens, Google identities, reset and verification tokens.
- Child/student chat content, grade/topic context, learning history, practice answers/scores, and usage records.
- Admin role and metrics access.
- Plan catalog, paid entitlement/subscription state, quotas, usage counters, and monetized LLM capacity.
- MongoDB contents plus JWT, OpenRouter, Resend, Langfuse, Google OAuth, and AI-hook credentials.
- System prompts, tool schemas, model responses, and observability data.

## Trust boundaries

1. Internet/browser to the Next.js frontend.
2. Browser to FastAPI over REST/SSE with untrusted JSON, paths, queries, tokens, cookies, Origin, and request IDs.
3. FastAPI authentication to JWT validation and MongoDB-backed user/role.
4. Authenticated user to per-user chat, practice, usage, subscription, and history records.
5. FastAPI to MongoDB Atlas.
6. FastAPI to OpenRouter; student context leaves the app and provider output returns as untrusted data.
7. Model output to the math-tool registry and frontend renderer.
8. FastAPI to Google, Resend, and optional Langfuse.
9. Operator/developer configuration and seed data to runtime behavior.
10. Developer AI tools to local hook logs and the external course logging server.

Deployment assumptions requiring confirmation: TLS/reverse-proxy protections exist outside the repository; MongoDB is network restricted; provider accounts are trusted; production uses `APP_ENV=production`; and secrets are injected rather than committed.

## Security invariants

- JWTs are strongly signed, type/expiry checked, and map to an extant user; effective role comes from the database.
- Refresh/reset/verification tokens are confidential, expiring, one-time or revocable, and protected from CSRF/replay.
- Every user-owned operation is constrained by authenticated user ID; client object IDs cannot cross tenant boundaries.
- Admin and plan-management operations are server-authorized.
- Paid entitlements require an authoritative payment/admin decision; users cannot self-grant plans or reset quotas.
- Quota checks and usage recording are concurrency-safe and fail closed for monetized operations.
- PII, child content, and secrets do not leak through logs, telemetry, email, LLM requests, responses, or hooks.
- Model output cannot invoke arbitrary code/tools, access secrets, mutate authorization state, or become active browser content.
- Practice answers and grading remain server-authoritative.
- Inputs and expensive endpoints are bounded and rate limited.

# Attack Surface, Mitigations, and Attacker Stories

## Attacker-controlled inputs

- Registration/login values, Google credentials, reset/verification tokens, cookies, and bearer tokens.
- Chat/lesson text, grade/topic, session IDs, practice IDs/answers, plan selection, locale/routes, Origin, request IDs, and SSE behavior.
- LLM/provider responses and tool-call arguments.

Developer-controlled but security-sensitive inputs include environment URLs/keys, provider base URLs, telemetry hosts, hook server URLs, datasets, and dependencies.

## Existing mitigations

- Bcrypt password hashing, algorithm-restricted JWT decode, and production rejection of weak/default JWT secrets.
- Authentication resolves the user from MongoDB; admin checks database-backed role.
- User-scoped repositories generally include authenticated user IDs.
- Pydantic schemas validate many inputs and model-output shapes; tool calls use a limited registry.
- Configured CORS origins; HttpOnly refresh cookies, Secure outside development.
- Logging redacts common credentials; Langfuse content capture defaults off.
- Containers run as non-root.

## Realistic attacker stories

- A user manipulates subscription inputs to obtain paid entitlements or evade quota enforcement.
- A user supplies another user's object ID to access chat, practice, or usage data.
- Automated clients abuse auth, email, SSE, bcrypt, MongoDB, or paid LLM calls where limits are absent.
- Malicious prompts/provider output escape guardrails, trigger unsafe tools, leak context, or become stored active content.
- Cookie/token replay or weak revocation enables account takeover.
- Misconfigured observability or hooks exfiltrate child data, prompts, credentials, or secrets.

Out of scope absent evidence: host/kernel compromise, malicious cloud-provider operators, direct access to properly restricted MongoDB, and compromised deployment credentials.

# Severity Calibration (Critical, High, Medium, Low)

- **Critical:** auth/JWT/admin bypass; remote code/tool execution; production signing/provider/database secret exposure; arbitrary paid-entitlement grant/payment bypass; scalable child-data compromise.
- **High:** account takeover; BOLA in private history/practice; material quota/cost bypass; prompt/tool injection exposing protected context; stored XSS; bulk PII leakage.
- **Medium:** localized cost/availability abuse from unbounded inputs; limited state-changing CSRF; user enumeration; privacy overcollection; practice-integrity errors.
- **Low:** benign public metadata leakage, minor errors without secrets, or client-only authorization inconsistencies when backend enforcement is correct.

