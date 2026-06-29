import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchPayments,
  fetchPayment,
  activatePayment,
  fetchUsers,
  extendUser,
  fetchStats,
  fetchPlans,
  changeUserPlan,
  fetchLlmLogs,
  fetchLlmStats,
  AdminAuthError,
  type ApiFetch,
} from "@/lib/adminApi";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

const mockPayment = {
  id: "pay_001",
  user_id: "user_001",
  plan_id: "plan_001",
  plan_name: "plus",
  billing: "monthly",
  amount_vnd: 99000,
  payment_code: "TTV-ABC123",
  gateway: "sepay",
  status: "pending",
  gateway_transaction_id: null,
  raw_webhook_payload: null,
  created_at: "2026-06-21T10:00:00Z",
  paid_at: null,
  expires_at: "2026-07-21T10:00:00Z",
};

const mockUser = {
  id: "user_001",
  name: "Test User",
  email: "test@example.com",
  role: "user",
  verified: true,
  plan_id: "plan_001",
  subscription_status: "active",
  subscription_expires_at: "2026-07-21T10:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
};

const mockStats = {
  total_revenue: 990000,
  total_subscriptions: 10,
  pending_payments: 2,
  active_users: 8,
};

describe("fetchPayments", () => {
  let apiFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiFetch = vi.fn();
  });

  it("GETs /admin/payments and returns paginated response", async () => {
    apiFetch.mockResolvedValueOnce(
      jsonResponse({
        items: [mockPayment],
        total: 1,
        page: 1,
        page_size: 20,
      }),
    );

    const result = await fetchPayments(apiFetch as unknown as ApiFetch);

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path] = apiFetch.mock.calls[0] as [string];
    expect(path).toBe("/admin/payments");

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("pay_001");
    expect(result.items[0].status).toBe("pending");
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.page_size).toBe(20);
  });

  it("passes filter params as query string", async () => {
    apiFetch.mockResolvedValueOnce(
      jsonResponse({
        items: [],
        total: 0,
        page: 1,
        page_size: 10,
      }),
    );

    await fetchPayments(apiFetch as unknown as ApiFetch, {
      status: "paid",
      search: "test@example.com",
      page: 2,
      page_size: 10,
    });

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path] = apiFetch.mock.calls[0] as [string];
    expect(path).toBe(
      "/admin/payments?status=paid&search=test%40example.com&page=2&page_size=10",
    );
  });

  it("omits undefined filter params from query string", async () => {
    apiFetch.mockResolvedValueOnce(
      jsonResponse({
        items: [],
        total: 0,
        page: 1,
        page_size: 20,
      }),
    );

    await fetchPayments(apiFetch as unknown as ApiFetch, { status: "pending" });

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path] = apiFetch.mock.calls[0] as [string];
    expect(path).toBe("/admin/payments?status=pending");
  });
});

describe("fetchPayment", () => {
  let apiFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiFetch = vi.fn();
  });

  it("GETs /admin/payments/{id} and returns a single payment", async () => {
    apiFetch.mockResolvedValueOnce(jsonResponse(mockPayment));

    const result = await fetchPayment(apiFetch as unknown as ApiFetch, "pay_001");

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path] = apiFetch.mock.calls[0] as [string];
    expect(path).toBe("/admin/payments/pay_001");

    expect(result.id).toBe("pay_001");
    expect(result.payment_code).toBe("TTV-ABC123");
    expect(result.status).toBe("pending");
  });

  it("URL-encodes the payment ID", async () => {
    apiFetch.mockResolvedValueOnce(jsonResponse(mockPayment));

    await fetchPayment(apiFetch as unknown as ApiFetch, "pay/001");

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path] = apiFetch.mock.calls[0] as [string];
    expect(path).toBe("/admin/payments/pay%2F001");
  });
});

describe("activatePayment", () => {
  let apiFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiFetch = vi.fn();
  });

  it("POSTs to /admin/payments/{id}/activate and returns the updated payment", async () => {
    const activated = { ...mockPayment, status: "paid", paid_at: "2026-06-21T12:05:00Z" };
    apiFetch.mockResolvedValueOnce(jsonResponse(activated));

    const result = await activatePayment(apiFetch as unknown as ApiFetch, "pay_001");

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path, options] = apiFetch.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/admin/payments/pay_001/activate");
    expect(options.method).toBe("POST");

    expect(result.status).toBe("paid");
    expect(result.paid_at).toBe("2026-06-21T12:05:00Z");
  });

  it("URL-encodes the payment ID in the activate path", async () => {
    apiFetch.mockResolvedValueOnce(
      jsonResponse({ ...mockPayment, status: "paid" }),
    );

    await activatePayment(apiFetch as unknown as ApiFetch, "pay/002");

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path] = apiFetch.mock.calls[0] as [string];
    expect(path).toBe("/admin/payments/pay%2F002/activate");
  });
});

describe("fetchUsers", () => {
  let apiFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiFetch = vi.fn();
  });

  it("GETs /admin/users and returns paginated response", async () => {
    apiFetch.mockResolvedValueOnce(
      jsonResponse({
        items: [mockUser],
        total: 1,
        page: 1,
        page_size: 20,
      }),
    );

    const result = await fetchUsers(apiFetch as unknown as ApiFetch);

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path] = apiFetch.mock.calls[0] as [string];
    expect(path).toBe("/admin/users");

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("user_001");
    expect(result.items[0].email).toBe("test@example.com");
    expect(result.items[0].subscription_status).toBe("active");
  });

  it("passes page and page_size query params", async () => {
    apiFetch.mockResolvedValueOnce(
      jsonResponse({
        items: [],
        total: 0,
        page: 2,
        page_size: 10,
      }),
    );

    await fetchUsers(apiFetch as unknown as ApiFetch, { page: 2, page_size: 10 });

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path] = apiFetch.mock.calls[0] as [string];
    expect(path).toBe("/admin/users?page=2&page_size=10");
  });
});

describe("extendUser", () => {
  let apiFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiFetch = vi.fn();
  });

  it("POSTs to /admin/users/{id}/extend and returns the updated user", async () => {
    const updated = {
      ...mockUser,
      subscription_expires_at: "2026-08-21T10:00:00Z",
    };
    apiFetch.mockResolvedValueOnce(jsonResponse(updated));

    const result = await extendUser(apiFetch as unknown as ApiFetch, "user_001");

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path, options] = apiFetch.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/admin/users/user_001/extend");
    expect(options.method).toBe("POST");

    expect(result.subscription_expires_at).toBe("2026-08-21T10:00:00Z");
  });

  it("URL-encodes the user ID", async () => {
    apiFetch.mockResolvedValueOnce(jsonResponse(mockUser));

    await extendUser(apiFetch as unknown as ApiFetch, "user/002");

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path] = apiFetch.mock.calls[0] as [string];
    expect(path).toBe("/admin/users/user%2F002/extend");
  });
});

describe("fetchStats", () => {
  let apiFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiFetch = vi.fn();
  });

  it("GETs /admin/stats and returns stats object", async () => {
    apiFetch.mockResolvedValueOnce(jsonResponse(mockStats));

    const result = await fetchStats(apiFetch as unknown as ApiFetch);

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path] = apiFetch.mock.calls[0] as [string];
    expect(path).toBe("/admin/stats");

    expect(result.total_revenue).toBe(990000);
    expect(result.total_subscriptions).toBe(10);
    expect(result.pending_payments).toBe(2);
    expect(result.active_users).toBe(8);
  });
});

describe("error handling", () => {
  let apiFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiFetch = vi.fn();
  });

  it("fetchPayments throws AdminAuthError on 401", async () => {
    apiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Not authenticated" }), {
        status: 401,
      }),
    );

    await expect(
      fetchPayments(apiFetch as unknown as ApiFetch),
    ).rejects.toBeInstanceOf(AdminAuthError);
  });

  it("fetchStats throws AdminAuthError on 403", async () => {
    apiFetch.mockResolvedValueOnce(new Response(null, { status: 403 }));

    await expect(
      fetchStats(apiFetch as unknown as ApiFetch),
    ).rejects.toBeInstanceOf(AdminAuthError);
  });

  it("fetchPayment throws AdminApiError on 404 with detail", async () => {
    apiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Payment not found" }), {
        status: 404,
      }),
    );

    await expect(
      fetchPayment(apiFetch as unknown as ApiFetch, "nonexistent"),
    ).rejects.toMatchObject({
      name: "AdminApiError",
      status: 404,
      message: "Payment not found",
    });
  });

  it("activatePayment throws AdminApiError on 409 with detail", async () => {
    apiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Payment already activated" }), {
        status: 409,
      }),
    );

    await expect(
      activatePayment(apiFetch as unknown as ApiFetch, "pay_001"),
    ).rejects.toMatchObject({
      name: "AdminApiError",
      status: 409,
      message: "Payment already activated",
    });
  });

  it("fetchUsers throws AdminApiError with fallback message when no detail", async () => {
    apiFetch.mockResolvedValueOnce(new Response("Internal error", { status: 500 }));

    await expect(
      fetchUsers(apiFetch as unknown as ApiFetch),
    ).rejects.toMatchObject({
      name: "AdminApiError",
      status: 500,
      message: "Request failed with status 500",
    });
  });
});

const mockPlans = [
  {
    name: "free",
    display_name: { vi: "Miễn phí", en: "Free" },
    price_monthly: 0,
    price_yearly: 0,
  },
  {
    name: "plus",
    display_name: { vi: "Plus", en: "Plus" },
    price_monthly: 49000,
    price_yearly: 490000,
  },
  {
    name: "premium",
    display_name: { vi: "Premium", en: "Premium" },
    price_monthly: 99000,
    price_yearly: 990000,
  },
];

describe("fetchPlans", () => {
  let apiFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiFetch = vi.fn();
  });

  it("GETs /admin/plans and returns plan list", async () => {
    apiFetch.mockResolvedValueOnce(jsonResponse(mockPlans));

    const result = await fetchPlans(apiFetch as unknown as ApiFetch);

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path] = apiFetch.mock.calls[0] as [string];
    expect(path).toBe("/admin/plans");

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("free");
    expect(result[0].display_name.vi).toBe("Miễn phí");
    expect(result[0].price_monthly).toBe(0);
    expect(result[1].name).toBe("plus");
    expect(result[1].price_monthly).toBe(49000);
    expect(result[2].name).toBe("premium");
    expect(result[2].price_monthly).toBe(99000);
  });

  it("throws AdminAuthError on 401", async () => {
    apiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Not authenticated" }), {
        status: 401,
      }),
    );

    await expect(
      fetchPlans(apiFetch as unknown as ApiFetch),
    ).rejects.toBeInstanceOf(AdminAuthError);
  });

  it("throws AdminApiError on 500", async () => {
    apiFetch.mockResolvedValueOnce(new Response("Server error", { status: 500 }));

    await expect(
      fetchPlans(apiFetch as unknown as ApiFetch),
    ).rejects.toMatchObject({
      name: "AdminApiError",
      status: 500,
    });
  });
});

describe("changeUserPlan", () => {
  let apiFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiFetch = vi.fn();
  });

  it("POSTs to /admin/users/{id}/change-plan with plan_name and returns updated user", async () => {
    const updated = {
      ...mockUser,
      plan_id: "plan_plus",
      plan_name: "plus",
    };
    apiFetch.mockResolvedValueOnce(jsonResponse(updated));

    const result = await changeUserPlan(
      apiFetch as unknown as ApiFetch,
      "user_001",
      "plus",
    );

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path, options] = apiFetch.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/admin/users/user_001/change-plan");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(options.body).toBe(JSON.stringify({ plan_name: "plus" }));

    expect(result.plan_name).toBe("plus");
  });

  it("URL-encodes the user ID", async () => {
    apiFetch.mockResolvedValueOnce(jsonResponse(mockUser));

    await changeUserPlan(
      apiFetch as unknown as ApiFetch,
      "user/002",
      "free",
    );

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path] = apiFetch.mock.calls[0] as [string];
    expect(path).toBe("/admin/users/user%2F002/change-plan");
  });

  it("throws AdminAuthError on 403", async () => {
    apiFetch.mockResolvedValueOnce(new Response(null, { status: 403 }));

    await expect(
      changeUserPlan(apiFetch as unknown as ApiFetch, "user_001", "plus"),
    ).rejects.toBeInstanceOf(AdminAuthError);
  });

  it("throws AdminApiError on 400 with detail", async () => {
    apiFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ detail: "Invalid plan name" }),
        { status: 400 },
      ),
    );

    await expect(
      changeUserPlan(apiFetch as unknown as ApiFetch, "user_001", "invalid"),
    ).rejects.toMatchObject({
      name: "AdminApiError",
      status: 400,
      message: "Invalid plan name",
    });
  });
});

describe("fetchLlmStats", () => {
  let apiFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiFetch = vi.fn();
  });

  it("GETs /admin/llm-stats?days=7 and returns LlmStatsResponse", async () => {
    const mockResponse = {
      daily_costs: [
        { date: "2026-06-22", cost_usd: 0.042, requests: 150, tokens: 45000 },
      ],
      cost_by_model: [
        { model: "deepseek/deepseek-v4-flash", cost_usd: 0.83 },
      ],
      tokens_by_user: [
        { user_id: "user1", tokens: 5000, cost_usd: 0.01 },
      ],
      overall: {
        total_cost_usd: 0.92,
        total_requests: 1200,
        error_rate: 0.02,
        latency_p50_ms: 320,
        latency_p95_ms: 890,
      },
    };
    apiFetch.mockResolvedValueOnce(jsonResponse(mockResponse));

    const result = await fetchLlmStats(
      apiFetch as unknown as ApiFetch,
      7,
    );

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path] = apiFetch.mock.calls[0] as [string];
    expect(path).toBe("/admin/llm-stats?days=7");

    expect(result.daily_costs).toHaveLength(1);
    expect(result.daily_costs[0].cost_usd).toBe(0.042);
    expect(result.cost_by_model[0].model).toBe("deepseek/deepseek-v4-flash");
    expect(result.tokens_by_user[0].user_id).toBe("user1");
    expect(result.overall.total_cost_usd).toBe(0.92);
    expect(result.overall.error_rate).toBe(0.02);
  });

  it("throws AdminAuthError on 401", async () => {
    apiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Not authenticated" }), {
        status: 401,
      }),
    );

    await expect(
      fetchLlmStats(apiFetch as unknown as ApiFetch),
    ).rejects.toBeInstanceOf(AdminAuthError);
  });
});

describe("fetchLlmLogs", () => {
  let apiFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiFetch = vi.fn();
  });

  it("normalizes legacy token fields from /admin/llm-logs", async () => {
    apiFetch.mockResolvedValueOnce(
      jsonResponse({
        items: [
          {
            _id: "log_001",
            user_id: "user_001",
            model: "openai/gpt-4o-mini",
            status: "success",
            tokens_in: 12,
            tokens_out: 34,
            cost_usd: 0.001,
            latency_ms: 250,
            created_at: "2026-06-29T00:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        page_size: 20,
      }),
    );

    const result = await fetchLlmLogs(apiFetch as unknown as ApiFetch);

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path] = apiFetch.mock.calls[0] as [string];
    expect(path).toBe("/admin/llm-logs");
    expect(result.items[0].id).toBe("log_001");
    expect(result.items[0].prompt_tokens).toBe(12);
    expect(result.items[0].completion_tokens).toBe(34);
  });
});
