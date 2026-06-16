# ADR-001: Authentication Architecture

## Status

Accepted

## Context

We need to implement authentication for the Toán Trực Quan AI application. The system needs to support:
- Email/password registration and login
- Google OAuth login
- Password reset via email
- Email verification
- Token-based authentication for API access

## Decision

### JWT Token Strategy

We chose JWT (JSON Web Tokens) with two tokens:

1. **Access Token (AT)**
   - Short-lived (15 minutes)
   - Contains user_id and role
   - Used for API authentication
   - Stateless verification

2. **Refresh Token (RT)**
   - Long-lived (7 days)
   - Stored in MongoDB for revocation capability
   - Used to obtain new AT when expired
   - Can be revoked on logout

### Why JWT over Session-based?

- **Stateless**: AT doesn't require database lookup
- **Scalable**: No server-side session storage needed
- **Mobile-friendly**: Works well with mobile apps
- **CORS-friendly**: Can be sent in Authorization header

### Password Hashing

- Algorithm: bcrypt
- Library: passlib with bcrypt backend
- Reason: Industry standard, built-in salt, configurable rounds

### Google OAuth

- Frontend: Google Identity Services SDK
- Backend: google-auth library for token verification
- Flow: Frontend gets ID token → Backend verifies → Creates/finds user

### Email Service

- Provider: Resend API
- Reason: Simple API, good deliverability, free tier available
- Fallback: Console logging when API key not configured

## Consequences

### Positive

- Stateless authentication for AT
- Can revoke RT on logout
- Works with both web and mobile clients
- Google OAuth provides social login
- Email verification reduces spam accounts

### Negative

- JWT tokens can't be revoked before expiry (AT)
- Need to handle token refresh in frontend
- More complex than session-based auth
- Need to secure JWT secret key

### Mitigations

- Short AT expiry (15 min) limits revocation window
- Frontend auto-refresh handles token renewal
- RT stored in DB allows logout revocation
- Secret key stored in environment variables

---

# ADR-002: Database Choice

## Status

Accepted

## Context

We need a database to store:
- User accounts
- Authentication tokens
- Password reset tokens
- Email verification tokens
- (Future) Lesson data, progress, etc.

## Decision

We chose **MongoDB Atlas** (cloud-hosted MongoDB).

### Why MongoDB?

1. **Schema flexibility**: User documents can evolve without migrations
2. **JSON-native**: Natural fit for API responses
3. **Cloud-managed**: Atlas handles backups, scaling, monitoring
4. **Free tier**: 512MB free tier for development
5. **Python support**: Motor (async) + PyMongo (sync) drivers

### Why not PostgreSQL?

- More complex setup for document-like data
- Requires migrations for schema changes
- Overkill for current use case

### Why not Firebase/Supabase?

- Vendor lock-in concerns
- Less control over data model
- MongoDB gives more flexibility for future AI features

## Consequences

### Positive

- Flexible schema for evolving data models
- Easy to get started with Atlas free tier
- Good async support with Motor
- Can scale horizontally

### Negative

- No ACID transactions across collections (single-document only)
- Need to handle ObjectId conversions
- Less mature tooling compared to SQL

---

# ADR-003: Frontend Auth Strategy

## Status

Accepted

## Context

The frontend needs to:
- Store authentication state
- Auto-refresh expired tokens
- Protect routes from unauthenticated access
- Call authenticated API endpoints

## Decision

We chose a **custom AuthContext** with in-memory access tokens and httpOnly refresh cookies:

### Why not NextAuth.js?

- NextAuth adds server-side complexity
- We want frontend to be purely client-side
- Backend handles all auth logic
- Simpler architecture

### Why httpOnly refresh cookies over localStorage?

- Refresh tokens are not readable by frontend JavaScript
- Access tokens are short-lived and kept only in memory
- Sessions can still survive reloads through `/auth/refresh`
- This reduces token exposure during XSS incidents

### Token Storage

```typescript
// Access token is kept in React memory.
accessTokenRef.current = authResponse.accessToken;

// Refresh token is set by the backend as an httpOnly cookie.
fetch("/api/v1/auth/refresh", { method: "POST", credentials: "include" });
```

### Auto-refresh Strategy

1. Frontend makes API call with AT
2. If 401/403 response, automatically call /auth/refresh with cookies
3. Store new access token in memory
4. Retry original request

## Consequences

### Positive

- Refresh token is shielded from JavaScript access
- No token persistence in browser storage
- Works with FastAPI-managed auth cookies

### Negative

- Need to handle token refresh logic
- Requires correct CORS and cookie settings

### Mitigations

- Short AT expiry limits exposure
- RT can be revoked on logout
- CSP headers to prevent XSS
- Refresh cookie is `httpOnly`, `SameSite=Lax`, and `Secure` outside development
