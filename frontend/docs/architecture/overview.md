# Frontend Architecture

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **i18n**: next-intl (Vietnamese + English)
- **State**: React Context (AuthProvider)
- **Validation**: Zod

## Directory Structure

```
frontend/src/
├── app/
│   ├── layout.tsx                 # Root layout (fonts, metadata)
│   ├── globals.css                # Tailwind + custom theme
│   └── [locale]/
│       ├── layout.tsx             # NextIntlClientProvider + AuthProvider + Toaster
│       ├── page.tsx               # Landing page
│       ├── (auth)/
│       │   ├── layout.tsx         # Auth layout
│       │   ├── login/page.tsx
│       │   ├── register/page.tsx
│       │   ├── forgot-password/page.tsx
│       │   ├── reset-password/page.tsx
│       │   └── verify-email/page.tsx
│       └── (protected)/
│           ├── layout.tsx         # RequireAuth + Suspense
│           ├── learn/page.tsx     # AI chat tutor
│           └── practice/page.tsx  # Interactive sandbox
├── components/
│   ├── auth/                      # Auth form components
│   │   ├── AuthLayout.tsx
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── GoogleSignInButton.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   ├── RequireAuth.tsx       # Route guard (toast + redirect login)
│   │   └── ResetPasswordForm.tsx
│   ├── landing/                   # Landing page components
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── Sandbox.tsx
│   │   └── ...
│   ├── providers/
│   │   └── AuthProvider.tsx       # Auth context + apiFetch
│   ├── shared/
│   │   └── ScrollReveal.tsx
│   └── ui/                        # Reusable UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── PasswordInput.tsx
│       └── LocaleSwitcher.tsx
├── hooks/
│   └── useAuth.ts                 # Auth hook re-export
├── lib/
│   ├── audio.ts                   # AudioContext singleton
│   ├── redirect.ts               # Safe redirect validation
│   └── validations/
│       └── auth.ts                # Zod schemas
├── messages/
│   ├── vi.json                    # Vietnamese translations
│   └── en.json                    # English translations
├── middleware.ts                   # i18n routing only
└── types/
    └── auth.ts                    # TypeScript types
```

## Data Flow

```
User Action (click button)
    │
    ▼
Component (LoginForm, RegisterForm, etc.)
    │  Call useAuth() hook
    ▼
AuthProvider (Context)
    │  fetch() to backend API
    │  Keep access token in memory; refresh token stays in httpOnly cookie
    ▼
Backend API (FastAPI)
    │
    ▼
MongoDB
```

## Authentication Flow

### Register
```
RegisterForm → useAuth().register() → POST /auth/register → Store access token in memory → Redirect to redirectTo (or home)
```

### Login
```
LoginForm → useAuth().login() → POST /auth/login → Store access token in memory → Redirect to redirectTo (or home)
```

### Protected Page Access
```
User opens /vi/learn → RequireAuth (useAuth) → Not authenticated → Toast → Redirect to /vi/login?redirectTo=/vi/learn
User logs in → LoginForm reads redirectTo → getSafeRedirect() → Redirect to /vi/learn
```

### Auto Refresh
```
apiFetch() → 401/403 response → POST /auth/refresh with httpOnly cookie → Retry original request
```

### Logout
```
Navbar → useAuth().logout() → POST /auth/logout → Clear in-memory auth state and cookie → Redirect /
```

### Chat / Lessons API (Protected)
```
AIExplanationChat → useAuth().apiFetch("/chat/turn", ...) → Bearer token auto-injected → POST /api/v1/chat/turn
```

## Route Protection

| Route | Auth Required | Behavior |
|---|---|---|
| `/` | No | Landing page |
| `/login` | No | Redirect to `/` if logged in |
| `/register` | No | Redirect to `/` if logged in |
| `/forgot-password` | No | Public |
| `/reset-password` | No | Public |
| `/verify-email` | No | Public |
| `/learn` | Yes | Toast + redirect to `/login?redirectTo=/vi/learn` |
| `/practice` | Yes | Toast + redirect to `/login?redirectTo=/vi/practice` |

### Protected Route Flow

1. User opens `/vi/learn` without login
2. `RequireAuth` shows toast "Vui lòng đăng nhập để tiếp tục."
3. Redirects to `/vi/login?redirectTo=%2Fvi%2Flearn`
4. User logs in → `getSafeRedirect` validates → redirects to `/vi/learn`

### Backend API Protection

- `POST /api/v1/chat/turn` — requires Bearer token
- `POST /api/v1/lessons/generate` — requires Bearer token
- `GET /api/v1/topics` — public (no auth)

`user_id` in request body is ignored. Authenticated user is used for session persistence.

**Note**: Access tokens are kept only in memory. Refresh tokens are held in `httpOnly` cookies and are not readable by frontend JavaScript.

## Styling

### Theme Colors (globals.css)
```css
--color-natural-bg: #FAF9F5
--color-natural-dark: #2D2A26
--color-natural-charcoal: #3D3B37
--color-natural-green: #4A6741
--color-natural-green-hover: #3D5435
--color-natural-orange: #FF8C42
--color-natural-border: #E8E6D9
```

### Component Patterns
- Rounded corners: `rounded-2xl`, `rounded-full`
- Shadows: `shadow-xs`, `shadow-md`
- Transitions: `transition-all duration-150 ease-out`
- Active states: `active:scale-97`
