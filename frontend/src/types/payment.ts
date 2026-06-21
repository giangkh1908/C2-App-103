/**
 * Frontend mirror of the backend `PaymentInDB` model
 * (`backend/src/models/payment.py`).
 *
 * The wire format from the checkout endpoint and the status endpoint
 * is a *subset* of this shape — the API client fills the missing
 * optional fields with safe defaults so the rest of the frontend
 * can treat a `Payment` as a single, complete value.
 */

export type PaymentBilling = "monthly" | "yearly";
export type PaymentGateway = "sepay";
export type PaymentStatus = "pending" | "paid" | "failed" | "expired";

export interface Payment {
  /** Mongo `_id` (stringified). */
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  billing: PaymentBilling;
  amount_vnd: number;
  /** Business code the user enters as the transfer content. */
  payment_code: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  gateway_transaction_id: string | null;
  raw_webhook_payload: Record<string, unknown> | null;
  /** ISO-8601 timestamp. */
  created_at: string;
  /** ISO-8601 timestamp, or `null` if not paid yet. */
  paid_at: string | null;
  /** ISO-8601 timestamp, or `null` if no expiry. */
  expires_at: string | null;
}
