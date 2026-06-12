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
│       ├── layout.tsx             # NextIntlClientProvider + AuthProvider
│       ├── page.tsx               # Landing page
│       └── (auth)/
│           ├── layout.tsx         # Auth layout
│           ├── login/page.tsx
│           ├── register/page.tsx
│           ├── forgot-password/page.tsx
│           ├── reset-password/page.tsx
│           └── verify-email/page.tsx
├── components/
│   ├── auth/                      # Auth form components
│   │   ├── AuthLayout.tsx
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── GoogleSignInButton.tsx
│   │   ├── ForgotPasswordForm.tsx
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
    │  Store response in localStorage
    ▼
Backend API (FastAPI)
    │
    ▼
MongoDB
```

## Authentication Flow

### Register
```
RegisterForm → useAuth().register() → POST /auth/register → Save to localStorage → Redirect /
```

### Login
```
LoginForm → useAuth().login() → POST /auth/login → Save to localStorage → Redirect /
```

### Auto Refresh
```
apiFetch() → 401 response → POST /auth/refresh → Retry original request
```

### Logout
```
Navbar → useAuth().logout() → POST /auth/logout → Clear localStorage → Redirect /
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
| `/dashboard` | Yes | Redirect to `/login` if not logged in |
| `/profile` | Yes | Redirect to `/login` if not logged in |

**Note**: Route protection is handled by Next.js middleware (`middleware.ts`) which checks for auth token in cookies/localStorage.

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
