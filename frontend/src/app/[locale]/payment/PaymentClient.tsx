"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import Navbar from "@/components/landing/Navbar";
import { useAuth } from "@/hooks/useAuth";
import {
  cancelPayment,
  createCheckout,
  getPaymentStatus,
  PaymentApiError,
  PaymentAuthError,
  type ApiFetch,
} from "@/lib/paymentApi";
import type { Payment, PaymentBilling } from "@/types/payment";

interface PaymentClientProps {
  locale: string;
  planName: string | null;
  billing: PaymentBilling | null;
}

const POLL_INTERVAL_MS = 5_000;
const SEPAY_BANK_CODE = process.env.NEXT_PUBLIC_SEPAY_BANK_CODE ?? "";
const SEPAY_ACCOUNT_NUMBER = process.env.NEXT_PUBLIC_SEPAY_ACCOUNT_NUMBER ?? "";

function buildSepayQrUrl(args: {
  amount: number;
  paymentCode: string;
}): string | null {
  if (!SEPAY_BANK_CODE || !SEPAY_ACCOUNT_NUMBER) return null;
  const params = new URLSearchParams({
    bank: SEPAY_BANK_CODE,
    acc: SEPAY_ACCOUNT_NUMBER,
    template: "compact",
    amount: String(args.amount),
    content: args.paymentCode,
  });
  return `https://qr.sepay.vn/img?${params.toString()}`;
}

function formatVnd(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PaymentClient({
  locale,
  planName,
  billing,
}: PaymentClientProps) {
  const t = useTranslations("payment");
  const router = useRouter();
  const { apiFetch, isAuthenticated } = useAuth() as {
    apiFetch: ApiFetch;
    isAuthenticated: boolean;
  };

  const [payment, setPayment] = useState<Payment | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const stoppedRef = useRef(false);

  // 1. Create checkout intent on mount.
  useEffect(() => {
    if (!planName || !billing) return;
    if (!isAuthenticated) {
      router.replace(`/${locale}/login`);
      return;
    }

    let cancelled = false;
    stoppedRef.current = false;

    (async () => {
      try {
        const result = await createCheckout(apiFetch, planName, billing);
        if (cancelled) return;
        setPayment(result.payment);
        // Prefer the server-built QR; fall back to a client-side VietQR URL
        // if the backend didn't include one (e.g. offline fixtures).
        setQrUrl(
          result.qrUrl ||
            buildSepayQrUrl({
              amount: result.payment.amount_vnd,
              paymentCode: result.payment.payment_code,
            }),
        );
      } catch (err) {
        if (cancelled) return;
        if (err instanceof PaymentAuthError) {
          router.replace(`/${locale}/login`);
          return;
        }
        const message =
          err instanceof PaymentApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : t("errors.createCheckout");
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      stoppedRef.current = true;
    };
  }, [apiFetch, billing, isAuthenticated, locale, planName, router, t]);

  // 2. Poll status every 5s once we have a payment_code.
  useEffect(() => {
    const code = payment?.payment_code;
    if (!code) return;

    let cancelled = false;
    stoppedRef.current = false;

    const tick = async () => {
      if (cancelled || stoppedRef.current) return;
      try {
        const next = await getPaymentStatus(apiFetch, code);
        if (cancelled || stoppedRef.current) return;
        setPayment(next);
        if (next.status === "paid") {
          stoppedRef.current = true;
          router.replace(`/${locale}/payment/success`);
        } else if (next.status === "failed" || next.status === "expired") {
          stoppedRef.current = true;
          router.replace(`/${locale}/payment/failed`);
        }
      } catch {
        // Network blips are expected during polling; keep going.
      }
    };

    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      stoppedRef.current = true;
      clearInterval(id);
    };
  }, [apiFetch, locale, payment?.payment_code, router]);

  const handleCopy = useCallback(async () => {
    if (!payment?.payment_code) return;
    try {
      await navigator.clipboard.writeText(payment.payment_code);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      toast.error(t("errors.copy"));
    }
  }, [payment, t]);

  const handleCancel = useCallback(async () => {
    try {
      if (payment?.payment_code) {
        await cancelPayment(apiFetch, payment.payment_code);
      }
    } catch {
      // Silently ignore cancel API failure — user already navigated away
    }
    stoppedRef.current = true;
    router.push(`/${locale}/payment/cancel`);
  }, [apiFetch, locale, payment, router]);

  if (!planName || !billing) {
    return (
      <main className="min-h-screen bg-natural-bg">
        <Navbar />
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <div className="rounded-full bg-red-50 p-3 text-red-600">
            <X className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-natural-charcoal">
            {t("errorTitle")}
          </h1>
          <p className="mt-2 text-sm text-natural-charcoal/70">
            {t("errors.missingPlan")}
          </p>
          <button
            onClick={() => router.push(`/${locale}/pricing`)}
            className="mt-6 rounded-full bg-natural-green px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-natural-green-hover"
          >
            {t("backToPricing")}
          </button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-natural-bg">
        <Navbar />
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-natural-green" />
          <p className="mt-4 text-sm text-natural-charcoal/70">
            {t("loading")}
          </p>
        </div>
      </main>
    );
  }

  if (error || !payment) {
    return (
      <main className="min-h-screen bg-natural-bg">
        <Navbar />
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <div className="rounded-full bg-red-50 p-3 text-red-600">
            <X className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-natural-charcoal">
            {t("errorTitle")}
          </h1>
          <p className="mt-2 text-sm text-natural-charcoal/70">
            {error ?? t("errors.generic")}
          </p>
          <button
            onClick={() => router.push(`/${locale}/pricing`)}
            className="mt-6 rounded-full bg-natural-green px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-natural-green-hover"
          >
            {t("backToPricing")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-natural-bg">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-natural-charcoal sm:text-3xl">
            {t("checkoutTitle")}
          </h1>
          <p className="mt-2 text-sm text-natural-charcoal/70">
            {t("planLabel", {
              plan: payment.plan_name,
              billing:
                payment.billing === "monthly"
                  ? t("billingMonthly")
                  : t("billingYearly"),
            })}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-natural-border bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center">
            <p className="text-sm font-bold text-natural-charcoal">
              {t("scanQr")}
            </p>
            <div className="mt-4 flex h-64 w-64 items-center justify-center overflow-hidden rounded-xl border border-natural-border bg-white">
              {qrUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrUrl}
                  alt={t("qrAlt")}
                  width={256}
                  height={256}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="p-4 text-center text-xs text-natural-charcoal/50">
                  {t("qrUnavailable")}
                </span>
              )}
            </div>

            <div className="mt-6 w-full space-y-3">
              <div className="rounded-xl bg-natural-bg/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-natural-charcoal/60">
                  {t("amount")}
                </p>
                <p className="mt-1 text-2xl font-bold text-natural-charcoal">
                  {formatVnd(payment.amount_vnd, locale)}
                </p>
              </div>

              <div className="rounded-xl bg-natural-bg/60 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-natural-charcoal/60">
                  {t("paymentCode")}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <code className="break-all font-mono text-base font-bold text-natural-charcoal">
                    {payment.payment_code}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-natural-border bg-white px-3 py-1.5 text-xs font-bold text-natural-charcoal transition-colors hover:border-natural-green hover:text-natural-green"
                    aria-label={t("copyCode")}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        {t("copied")}
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        {t("copyCode")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-natural-border bg-white p-6">
          <h2 className="text-base font-bold text-natural-charcoal">
            {t("instructionsTitle")}
          </h2>
          <ol className="mt-3 space-y-2 text-sm text-natural-charcoal/80">
            <li className="flex gap-2">
              <span className="font-bold text-natural-green">1.</span>
              {t("step1")}
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-natural-green">2.</span>
              {t("step2")}
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-natural-green">3.</span>
              {t("step3")}
            </li>
          </ol>
        </div>

        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="flex items-center gap-2 text-sm text-natural-charcoal/70">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-natural-green" />
            {t("waiting")}
          </p>
          <button
            onClick={handleCancel}
            className="rounded-full border border-natural-border bg-white px-5 py-2 text-sm font-bold text-natural-charcoal/70 transition-colors hover:border-red-300 hover:text-red-600"
          >
            {t("cancelPayment")}
          </button>
        </div>
      </div>
    </main>
  );
}
