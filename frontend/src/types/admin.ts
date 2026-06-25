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

export interface UserCostEntry {
  user_id: string;
  email: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  cost_usd: number;
}

export interface AdminCostStats {
  month: string;
  total_cost_usd: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_users: number;
  previous_month: number | null;
  top_users: UserCostEntry[];
}
