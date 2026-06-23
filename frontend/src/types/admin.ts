export interface AdminPayment {
  id: string;
  user_id: string;
  user_email?: string;
  plan_id: string;
  plan_name: string;
  billing: "monthly" | "yearly";
  amount_vnd: number;
  payment_code: string;
  gateway: string;
  status: "pending" | "paid" | "failed" | "expired";
  gateway_transaction_id: string | null;
  raw_webhook_payload: Record<string, unknown> | null;
  created_at: string;
  paid_at: string | null;
  expires_at: string | null;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  verified: boolean;
  plan_id: string;
  plan_name?: string;
  subscription_status: "active" | "cancelled" | "expired";
  subscription_expires_at: string | null;
  created_at: string;
}

export interface AdminStats {
  total_revenue: number;
  total_subscriptions: number;
  pending_payments: number;
  active_users: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface PaymentFilter {
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface UserFilter {
  page?: number;
  page_size?: number;
}
