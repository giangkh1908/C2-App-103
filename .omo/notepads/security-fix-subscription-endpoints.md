# Security Fix: Subscription Endpoint Privilege Escalation

## Vulnerability

The /subscription/upgrade and /subscription/change endpoints allowed any authenticated user to self-assign paid plans ("plus", "premium") without making a payment.

### Attack Vector
An attacker could send:
`json
POST /subscription/change
{"plan_name": "premium", "billing": "yearly"}
`

And immediately gain premium access because the endpoint accepted any plan name from the ("free", "plus", "premium") set without verifying payment.

## Backend Fixes

### /subscription/upgrade (lines 15-45)
- **Before**: Accepted "free", "plus", "premium"
- **After**: ONLY accepts "free"
- Paid plan activation must go through /payment/checkout + SePay webhook
- Returns 400 Bad Request with clear message if a paid plan is attempted

### /subscription/change (lines 48-91)
- **Before**: Accepted "free", "plus", "premium" for billing switches and downgrades
- **After**: ONLY accepts "free"
- This endpoint becomes a downgrade-to-free-only path
- Same-plan billing switches and paid downgrades are rejected with 400 Bad Request

## Frontend Fixes

### PricingClient.tsx
1. **Same-plan billing switch** (e.g., Plus user clicking Plus to switch monthly/yearly)
   - **Before**: Called /subscription/change with paid plan name
   - **After**: Shows message: "Để thay đổi chu kỳ thanh toán, vui lòng liên hệ hỗ trợ"

2. **Downgrade to lower-paid plan** (e.g., Premium -> Plus)
   - **Before**: Opened confirm dialog then called /subscription/change with "plus"
   - **After**: Shows message: "Vui lòng liên hệ hỗ trợ để giảm gói"

3. **Downgrade to Free** (e.g., Premium -> Free)
   - **Unchanged**: Still opens confirm dialog and calls /subscription/change with "free"

4. **Upgrade to paid plan** (e.g., Free -> Plus, Plus -> Premium)
   - **Unchanged**: Still routes to /payment/checkout flow
## Verification
- `ruff check backend/src/api/subscription.py` — passed
- `eslint frontend/src/app/[locale]/pricing/PricingClient.tsx` — 0 errors

## Date
2026-06-22
