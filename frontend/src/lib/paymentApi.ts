import type { Payment, PaymentBilling } from "@/types/payment";

/**
 * Shape of `POST /api/v1/payment/checkout` — backend
 * `CheckoutResponse` in `backend/src/api/payment.py`.
 */
interface CheckoutResponse {
  payment_code: string;
  amount_vnd: number;
  qr_url: string;
  plan_name: string;
  billing: PaymentBilling;
  expires_at: string | null;
}

/**
 * Shape of `GET /api/v1/payment/status/{payment_code}` — backend
 * `PaymentStatusResponse` in `backend/src/api/payment.py`.
 */
interface PaymentStatusResponse {
  payment_code: string;
  status: Payment["status"];
  plan_name: string;
  billing: PaymentBilling;
  amount_vnd: number;
  paid_at: string | null;
  expires_at: string | null;
}

export class PaymentAuthError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "PaymentAuthError";
  }
}

export class PaymentApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "PaymentApiError";
    this.status = status;
  }
}

export type ApiFetch = (
  path: string,
  options?: RequestInit,
) => Promise<Response>;

/**
 * Build a complete `Payment` from the subset the checkout endpoint
 * returns. Fields the endpoint doesn't echo (e.g. Mongo `_id`) are
 * left as safe defaults — they're only meaningful for back-office
 * flows and the QR polling loop doesn't need them.
 */
function paymentFromCheckout(res: CheckoutResponse): Payment {
  return {
    id: res.payment_code,
    user_id: "",
    plan_id: "",
    plan_name: res.plan_name,
    billing: res.billing,
    amount_vnd: res.amount_vnd,
    payment_code: res.payment_code,
    gateway: "sepay",
    status: "pending",
    gateway_transaction_id: null,
    raw_webhook_payload: null,
    created_at: new Date().toISOString(),
    paid_at: null,
    expires_at: res.expires_at,
  };
}

/**
 * Build a complete `Payment` from the subset the status endpoint
 * returns. The status endpoint is the polling target after checkout
 * — it omits identifying fields the caller already knows.
 */
function paymentFromStatus(res: PaymentStatusResponse): Payment {
  return {
    id: res.payment_code,
    user_id: "",
    plan_id: "",
    plan_name: res.plan_name,
    billing: res.billing,
    amount_vnd: res.amount_vnd,
    payment_code: res.payment_code,
    gateway: "sepay",
    status: res.status,
    gateway_transaction_id: null,
    raw_webhook_payload: null,
    created_at: "",
    paid_at: res.paid_at,
    expires_at: res.expires_at,
  };
}

/**
 * POST /api/v1/payment/checkout — create a new pending payment
 * intent and return the QR the user scans.
 *
 * Throws `PaymentAuthError` on 401/403 so callers can redirect to
 * login. Throws `PaymentApiError` for any other non-2xx response.
 */
export async function createCheckout(
  apiFetch: ApiFetch,
  planName: string,
  billing: PaymentBilling,
): Promise<{ payment: Payment; qrUrl: string }> {
  const res = await apiFetch("/payment/checkout", {
    method: "POST",
    body: JSON.stringify({ plan_name: planName, billing }),
  });

  if (res.status === 401 || res.status === 403) {
    throw new PaymentAuthError();
  }
  if (!res.ok) {
    const detail = (await res.json().catch(() => null))?.detail as
      | string
      | undefined;
    throw new PaymentApiError(detail ?? "Failed to create checkout", res.status);
  }

  const data: CheckoutResponse = await res.json();
  return {
    payment: paymentFromCheckout(data),
    qrUrl: data.qr_url,
  };
}

/**
 * GET /api/v1/payment/status/{paymentCode} — poll the lifecycle
 * state of a payment intent. Returns `Payment` with `status` set
 * to the latest server-known value (`pending` | `paid` | `failed`
 * | `expired`).
 */
export async function getPaymentStatus(
  apiFetch: ApiFetch,
  paymentCode: string,
): Promise<Payment> {
  const res = await apiFetch(
    `/payment/status/${encodeURIComponent(paymentCode)}`,
  );

  if (res.status === 401 || res.status === 403) {
    throw new PaymentAuthError();
  }
  if (!res.ok) {
    const detail = (await res.json().catch(() => null))?.detail as
      | string
      | undefined;
    throw new PaymentApiError(
      detail ?? "Failed to fetch payment status",
      res.status,
    );
  }

  const data: PaymentStatusResponse = await res.json();
  return paymentFromStatus(data);
}

/**
 * POST /api/v1/payment/cancel/{paymentCode} — mark a payment intent
 * as expired / cancelled server-side so the polling loop stops and
 * the user sees the expected terminal state immediately.
 */
export async function cancelPayment(
  apiFetch: ApiFetch,
  paymentCode: string,
): Promise<void> {
  const res = await apiFetch(
    `/payment/cancel/${encodeURIComponent(paymentCode)}`,
    { method: "POST" },
  );
  if (!res.ok) {
    const detail = (await res.json().catch(() => null))?.detail as
      | string
      | undefined;
    throw new PaymentApiError(detail ?? "Failed to cancel payment", res.status);
  }
}
