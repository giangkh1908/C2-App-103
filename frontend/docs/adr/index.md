# Frontend ADRs

## ADR-001: No NextAuth - Custom AuthContext

### Status

Accepted

### Context

We need authentication in the Next.js frontend. Options considered:
1. NextAuth.js - Full-featured auth library for Next.js
2. Custom AuthContext with direct API calls

### Decision

We chose **Custom AuthContext** because:
- Frontend should be purely client-side (SEO + UI only)
- All auth logic lives in FastAPI backend
- Simpler architecture without server-side auth
- Easier to debug and maintain

### Consequences

**Positive:**
- Simple implementation
- No server-side session management
- Works with any backend
- Easy to understand

**Negative:**
- localStorage vulnerable to XSS (mitigated with short token expiry)
- Need to handle token refresh manually

---

## ADR-002: Zod for Validation

### Status

Accepted

### Context

We need form validation for login, register, and other forms. Options:
1. Hand-rolled validation (regex, manual checks)
2. Yup
3. Zod
4. React Hook Form + Zod

### Decision

We chose **Zod** because:
- TypeScript-first with type inference
- Single source of truth for validation + types
- Works on both client and server
- Smaller bundle than Yup

### Consequences

**Positive:**
- Types generated from schemas
- Consistent validation logic
- Easy to test
- Good error messages

**Negative:**
- Learning curve for Zod syntax

---

## ADR-003: localStorage for Token Storage

### Status

Accepted

### Context

Where to store JWT tokens? Options:
1. localStorage
2. sessionStorage
3. httpOnly cookies
4. In-memory (React state)

### Decision

We chose **localStorage** because:
- Persists across tab closes and browser restarts
- Easy to access from any component
- Works with SSR (check on client side)

### Consequences

**Positive:**
- Simple implementation
- Persistent sessions
- Easy to debug

**Negative:**
- Vulnerable to XSS attacks
- Not accessible from server

### Mitigations:
- Short access token expiry (15 min)
- CSP headers to prevent XSS
- Can upgrade to httpOnly cookies for production

---

## ADR-004: i18n with next-intl

### Status

Accepted

### Context

The app needs to support Vietnamese (default) and English.

### Decision

We chose **next-intl** because:
- Built for Next.js App Router
- Server and client components support
- JSON message files
- URL-based locale routing (`/vi/login`, `/en/login`)

### Consequences

**Positive:**
- SEO-friendly locale URLs
- Server-side translations
- Easy to add new languages

**Negative:**
- Adds routing complexity with `[locale]` segment

---

## ADR-005: Tailwind CSS v4

### Status

Accepted

### Context

Styling approach for the application.

### Decision

We chose **Tailwind CSS v4** because:
- Utility-first approach
- Small bundle size (only used classes)
- Custom theme with CSS variables
- v4 has improved performance

### Consequences

**Positive:**
- Fast development
- Consistent design system
- Small production bundle
- Easy to customize

**Negative:**
- HTML can look cluttered with many classes
- Learning curve for new developers
