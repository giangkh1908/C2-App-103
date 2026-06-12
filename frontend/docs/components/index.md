# Component Documentation

## Auth Components

### AuthLayout

Centered card layout for auth pages.

```tsx
<AuthLayout title="Đăng nhập" subtitle="Đăng nhập để học Toán">
  <LoginForm />
</AuthLayout>
```

**Props:**
- `title: string` - Page title
- `subtitle: string` - Page subtitle
- `children: ReactNode` - Form content

---

### LoginForm

Email/password login form with Zod validation.

**Features:**
- Email validation (required, format)
- Password validation (required)
- Server error display
- Loading state
- Google sign-in button
- Link to register

**Usage:**
```tsx
<LoginForm />
```

---

### RegisterForm

Registration form with name, email, password, confirmPassword.

**Features:**
- Name validation (required, min 2 chars)
- Email validation (required, format)
- Password validation (required, min 6 chars)
- Confirm password validation (must match)
- Auto-login after registration

**Usage:**
```tsx
<RegisterForm />
```

---

### GoogleSignInButton

Google OAuth button using Google Identity Services SDK.

**Features:**
- Loads Google SDK dynamically
- Renders Google's native button
- Calls backend `/auth/google` with credential

**Usage:**
```tsx
<GoogleSignInButton />
```

**Environment Variable:**
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID

---

### ForgotPasswordForm

Form to request password reset email.

**Features:**
- Email validation
- Success message display
- Link back to login

**Usage:**
```tsx
<ForgotPasswordForm />
```

---

### ResetPasswordForm

Form to reset password with token.

**Props:**
- `token: string` - Reset token from URL

**Features:**
- Password validation (min 6 chars)
- Confirm password validation
- Success state with login link

**Usage:**
```tsx
<ResetPasswordForm token={token} />
```

---

## UI Components

### Button

Reusable button with loading state.

```tsx
<Button variant="primary" loading={isLoading} onClick={handleClick}>
  Submit
</Button>
```

**Props:**
- `variant?: "primary" | "secondary"` - Button style (default: "primary")
- `loading?: boolean` - Show spinner
- `disabled?: boolean` - Disable button
- Standard HTML button attributes

---

### Input

Labeled text input with error state.

```tsx
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  value={email}
  onChange={handleChange}
  error={errors.email}
/>
```

**Props:**
- `label: string` - Input label
- `error?: string` - Error message
- Standard HTML input attributes

---

### PasswordInput

Password field with show/hide toggle.

```tsx
<PasswordInput
  label="Password"
  placeholder="Enter password"
  value={password}
  onChange={handleChange}
  error={errors.password}
/>
```

**Props:**
- `label: string` - Input label
- `error?: string` - Error message
- Standard HTML input attributes (excluding type)

---

### LocaleSwitcher

Dropdown to switch between Vietnamese and English.

```tsx
<LocaleSwitcher />
```

---

## Landing Components

### Navbar

Sticky header with navigation, auth state, and locale switcher.

**Features:**
- Scroll detection (background change)
- User menu when authenticated
- Login/register links when not authenticated
- Responsive design

---

### Hero

Landing page hero section with CTA buttons.

---

### Sandbox

Interactive math simulation with tabs for different topics.

**Topics:**
- Multiplication (Grade 2)
- Division (Grade 2)
- Fractions (Grade 3)
- Area & Perimeter (Grade 4)
