import type {
  AdminCostStats,
  AdminLlmLog,
  AdminPayment,
  AdminStats,
  AdminUser,
  LlmLogFilter,
  LlmStatsResponse,
  PaginatedResponse,
  PaymentFilter,
  UserFilter,
} from "@/types/admin";

export interface AdminPlan {
  name: string;
  display_name: Record<string, string>;
  price_monthly: number;
  price_yearly: number;
}

export interface AdminPlanDisplay {
  name: string;
  label: string;
  price_monthly: number;
  price_yearly: number;
}

export class AdminAuthError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "AdminAuthError";
  }
}

export class AdminApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

export type ApiFetch = (
  path: string,
  options?: RequestInit,
) => Promise<Response>;

/**
 * Build a query string from a record of optional values.
 * Only defined values are included.
 */
function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string | number] => entry[1] !== undefined,
  );
  if (entries.length === 0) return "";
  const searchParams = new URLSearchParams();
  for (const [key, value] of entries) {
    searchParams.set(key, String(value));
  }
  return `?${searchParams.toString()}`;
}

/**
 * Throw the appropriate admin error for a non-2xx response.
 */
async function throwAdminError(res: Response): Promise<never> {
  if (res.status === 401 || res.status === 403) {
    throw new AdminAuthError();
  }
  const detail = (await res.json().catch(() => null))?.detail as
    | string
    | undefined;
  throw new AdminApiError(
    detail ?? `Request failed with status ${res.status}`,
    res.status,
  );
}

/**
 * GET /admin/payments — list payments with optional filters.
 *
 * Throws `AdminAuthError` on 401/403, `AdminApiError` on other errors.
 */
export async function fetchPayments(
  apiFetch: ApiFetch,
  filter?: PaymentFilter,
): Promise<PaginatedResponse<AdminPayment>> {
  const qs = buildQuery({
    status: filter?.status,
    search: filter?.search,
    page: filter?.page,
    page_size: filter?.page_size,
  });
  const res = await apiFetch(`/admin/payments${qs}`);

  if (!res.ok) {
    await throwAdminError(res);
  }

  return res.json() as Promise<PaginatedResponse<AdminPayment>>;
}

/**
 * GET /admin/payments/{id} — fetch a single payment by ID.
 *
 * Throws `AdminAuthError` on 401/403, `AdminApiError` on other errors.
 */
export async function fetchPayment(
  apiFetch: ApiFetch,
  id: string,
): Promise<AdminPayment> {
  const res = await apiFetch(`/admin/payments/${encodeURIComponent(id)}`);

  if (!res.ok) {
    await throwAdminError(res);
  }

  return res.json() as Promise<AdminPayment>;
}

/**
 * POST /admin/payments/{id}/activate — manually activate a payment.
 *
 * Throws `AdminAuthError` on 401/403, `AdminApiError` on other errors.
 */
export async function activatePayment(
  apiFetch: ApiFetch,
  id: string,
): Promise<AdminPayment> {
  const res = await apiFetch(
    `/admin/payments/${encodeURIComponent(id)}/activate`,
    { method: "POST" },
  );

  if (!res.ok) {
    await throwAdminError(res);
  }

  return res.json() as Promise<AdminPayment>;
}

/**
 * GET /admin/users — list users with pagination.
 *
 * Throws `AdminAuthError` on 401/403, `AdminApiError` on other errors.
 */
export async function fetchUsers(
  apiFetch: ApiFetch,
  filter?: UserFilter,
): Promise<PaginatedResponse<AdminUser>> {
  const qs = buildQuery({
    page: filter?.page,
    page_size: filter?.page_size,
  });
  const res = await apiFetch(`/admin/users${qs}`);

  if (!res.ok) {
    await throwAdminError(res);
  }

  return res.json() as Promise<PaginatedResponse<AdminUser>>;
}

/**
 * POST /admin/users/{id}/extend — extend a user's subscription by +30 days.
 *
 * Throws `AdminAuthError` on 401/403, `AdminApiError` on other errors.
 */
export async function extendUser(
  apiFetch: ApiFetch,
  id: string,
): Promise<AdminUser> {
  const res = await apiFetch(
    `/admin/users/${encodeURIComponent(id)}/extend`,
    { method: "POST" },
  );

  if (!res.ok) {
    await throwAdminError(res);
  }

  return res.json() as Promise<AdminUser>;
}

/**
 * GET /admin/stats — fetch admin dashboard statistics.
 *
 * Throws `AdminAuthError` on 401/403, `AdminApiError` on other errors.
 */
export async function fetchStats(
  apiFetch: ApiFetch,
): Promise<AdminStats> {
  const res = await apiFetch("/admin/stats");

  if (!res.ok) {
    await throwAdminError(res);
  }

  return res.json() as Promise<AdminStats>;
}

/**
 * GET /admin/plans — fetch available subscription plans.
 *
 * Throws `AdminAuthError` on 401/403, `AdminApiError` on other errors.
 */
export async function fetchPlans(
  apiFetch: ApiFetch,
): Promise<AdminPlan[]> {
  const res = await apiFetch("/admin/plans");

  if (!res.ok) {
    await throwAdminError(res);
  }

  return res.json() as Promise<AdminPlan[]>;
}

/**
 * POST /admin/users/{id}/change-plan — change a user's subscription plan.
 *
 * Throws `AdminAuthError` on 401/403, `AdminApiError` on other errors.
 */
export async function changeUserPlan(
  apiFetch: ApiFetch,
  userId: string,
  planName: string,
): Promise<AdminUser> {
  const res = await apiFetch(
    `/admin/users/${encodeURIComponent(userId)}/change-plan`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_name: planName }),
    },
  );

  if (!res.ok) {
    await throwAdminError(res);
  }

  return res.json() as Promise<AdminUser>;
}

/**
 * GET /admin/costs?month=YYYY-MM — fetch LLM cost statistics for admin dashboard.
 *
 * Throws `AdminAuthError` on 401/403, `AdminApiError` on other errors.
 */
export async function fetchCostStats(
  apiFetch: ApiFetch,
  month: string,
): Promise<AdminCostStats> {
  const qs = `?${new URLSearchParams({ month })}`;
  const res = await apiFetch(`/admin/costs${qs}`);

  if (!res.ok) {
    await throwAdminError(res);
  }

  return res.json() as Promise<AdminCostStats>;
}

/**
 * GET /admin/llm-logs — fetch recent LLM audit log entries with optional filters.
 *
 * Throws `AdminAuthError` on 401/403, `AdminApiError` on other errors.
 */
export async function fetchLlmLogs(
  apiFetch: ApiFetch,
  filter?: LlmLogFilter,
): Promise<PaginatedResponse<AdminLlmLog>> {
  const qs = buildQuery({
    model: filter?.model,
    user_id: filter?.user_id,
    status: filter?.status,
    date: filter?.date,
    page: filter?.page,
    page_size: filter?.page_size,
  });
  const res = await apiFetch(`/admin/llm-logs${qs}`);

  if (!res.ok) {
    await throwAdminError(res);
  }

  const data = (await res.json()) as PaginatedResponse<
    AdminLlmLog & {
      _id?: string;
      tokens_in?: number;
      tokens_out?: number;
    }
  >;

  return {
    ...data,
    items: data.items.map((log) => ({
      ...log,
      id: log.id ?? log._id ?? "",
      prompt_tokens: log.prompt_tokens ?? log.tokens_in ?? 0,
      completion_tokens: log.completion_tokens ?? log.tokens_out ?? 0,
      cost_usd: log.cost_usd ?? 0,
      latency_ms: log.latency_ms ?? 0,
    })),
  };
}

/**
 * GET /admin/llm-stats?days=7 — fetch real-time LLM stats for dashboard charts.
 *
 * Throws `AdminAuthError` on 401/403, `AdminApiError` on other errors.
 */
export async function fetchLlmStats(
  apiFetch: ApiFetch,
  days: number = 7,
): Promise<LlmStatsResponse> {
  const qs = `?${new URLSearchParams({ days: String(days) })}`;
  const res = await apiFetch(`/admin/llm-stats${qs}`);

  if (!res.ok) {
    await throwAdminError(res);
  }

  return res.json() as Promise<LlmStatsResponse>;
}

/**
 * GET /admin/llm-stats?days=1 — fetch today's cost for budget bar.
 *
 * Throws `AdminAuthError` on 401/403, `AdminApiError` on other errors.
 */
export async function fetchTodayBudget(
  apiFetch: ApiFetch,
): Promise<{ today_cost_usd: number }> {
  const res = await apiFetch("/admin/llm-stats?days=1");

  if (!res.ok) {
    await throwAdminError(res);
  }

  const data = (await res.json()) as LlmStatsResponse;
  return { today_cost_usd: data.overall.total_cost_usd };
}
