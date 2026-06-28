import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createCheckout,
  getPaymentStatus,
  PaymentAuthError,
  type ApiFetch,
} from "@/lib/paymentApi";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("createCheckout", () => {
  let apiFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiFetch = vi.fn();
  });

  it("POSTs to /payment/checkout with the correct body and returns {payment, qrUrl}", async () => {
    apiFetch.mockResolvedValueOnce(
      jsonResponse({
        payment_code: "TTV-ABC123",
        amount_vnd: 99000,
        qr_url: "https://qr.sepay.vn/img?acc=foo&amount=99000&content=TTV-ABC123",
        plan_name: "plus",
        billing: "monthly",
        expires_at: "2026-06-21T12:00:00Z",
      }),
    );

    const result = await createCheckout(
      apiFetch as unknown as ApiFetch,
      "plus",
      "monthly",
    );

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path, options] = apiFetch.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/payment/checkout");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toEqual({
      plan_name: "plus",
      billing: "monthly",
    });

    expect(result.qrUrl).toBe(
      "https://qr.sepay.vn/img?acc=foo&amount=99000&content=TTV-ABC123",
    );
    expect(result.payment.payment_code).toBe("TTV-ABC123");
    expect(result.payment.plan_name).toBe("plus");
    expect(result.payment.billing).toBe("monthly");
    expect(result.payment.amount_vnd).toBe(99000);
    expect(result.payment.status).toBe("pending");
    expect(result.payment.gateway).toBe("sepay");
    expect(result.payment.expires_at).toBe("2026-06-21T12:00:00Z");
  });

  it("passes through yearly billing as a literal union type", async () => {
    apiFetch.mockResolvedValueOnce(
      jsonResponse({
        payment_code: "TTV-Y1",
        amount_vnd: 990000,
        qr_url: "https://qr.sepay.vn/img?x=1",
        plan_name: "premium",
        billing: "yearly",
        expires_at: null,
      }),
    );

    await createCheckout(apiFetch as unknown as ApiFetch, "premium", "yearly");

    expect(JSON.parse((apiFetch.mock.calls[0] as [string, RequestInit])[1].body as string)).toEqual({
      plan_name: "premium",
      billing: "yearly",
    });
  });
});

describe("getPaymentStatus", () => {
  let apiFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiFetch = vi.fn();
  });

  it("GETs /payment/status/{paymentCode} with the URL-encoded code", async () => {
    apiFetch.mockResolvedValueOnce(
      jsonResponse({
        payment_code: "TTV/ABC 123",
        status: "paid",
        plan_name: "plus",
        billing: "monthly",
        amount_vnd: 99000,
        paid_at: "2026-06-21T12:05:00Z",
        expires_at: null,
      }),
    );

    const payment = await getPaymentStatus(
      apiFetch as unknown as ApiFetch,
      "TTV/ABC 123",
    );

    expect(apiFetch).toHaveBeenCalledTimes(1);
    const [path, options] = apiFetch.mock.calls[0] as [string, RequestInit?];
    expect(path).toBe("/payment/status/TTV%2FABC%20123");
    expect(options?.method ?? undefined).toBeUndefined();

    expect(payment.payment_code).toBe("TTV/ABC 123");
    expect(payment.status).toBe("paid");
    expect(payment.plan_name).toBe("plus");
    expect(payment.billing).toBe("monthly");
    expect(payment.amount_vnd).toBe(99000);
    expect(payment.paid_at).toBe("2026-06-21T12:05:00Z");
  });

  it("returns pending status untouched when the gateway hasn't settled", async () => {
    apiFetch.mockResolvedValueOnce(
      jsonResponse({
        payment_code: "TTV-PEND",
        status: "pending",
        plan_name: "plus",
        billing: "monthly",
        amount_vnd: 99000,
        paid_at: null,
        expires_at: "2026-06-21T12:00:00Z",
      }),
    );

    const payment = await getPaymentStatus(
      apiFetch as unknown as ApiFetch,
      "TTV-PEND",
    );

    expect(payment.status).toBe("pending");
    expect(payment.paid_at).toBeNull();
  });
});

describe("auth error handling", () => {
  let apiFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    apiFetch = vi.fn();
  });

  it("createCheckout throws PaymentAuthError on 401", async () => {
    apiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Not authenticated" }), { status: 401 }),
    );

    await expect(
      createCheckout(apiFetch as unknown as ApiFetch, "plus", "monthly"),
    ).rejects.toBeInstanceOf(PaymentAuthError);
  });

  it("createCheckout throws PaymentAuthError on 403", async () => {
    apiFetch.mockResolvedValueOnce(new Response(null, { status: 403 }));

    await expect(
      createCheckout(apiFetch as unknown as ApiFetch, "plus", "monthly"),
    ).rejects.toBeInstanceOf(PaymentAuthError);
  });

  it("getPaymentStatus throws PaymentAuthError on 401", async () => {
    apiFetch.mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(
      getPaymentStatus(apiFetch as unknown as ApiFetch, "TTV-X"),
    ).rejects.toBeInstanceOf(PaymentAuthError);
  });

  it("non-2xx responses throw PaymentApiError carrying the status", async () => {
    apiFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Plan not found" }), { status: 404 }),
    );

    await expect(
      getPaymentStatus(apiFetch as unknown as ApiFetch, "TTV-X"),
    ).rejects.toMatchObject({
      name: "PaymentApiError",
      status: 404,
    });
  });
});
