"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import type { PaymentBilling } from "@/types/payment";

interface PaymentSuccessClientProps {
  locale: string;
  planName: string | null;
  billing: PaymentBilling | null;
  paidAt: string | null;
  expiresAt: string | null;
}

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

export default function PaymentSuccessClient({
  locale,
  planName,
  billing,
  paidAt,
  expiresAt,
}: PaymentSuccessClientProps) {
  const t = useTranslations("payment");

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:px-6">
      <div className="rounded-full bg-emerald-50 p-4 text-emerald-600">
        <CheckCircle2 className="h-12 w-12" />
      </div>

      <h1 className="mt-6 text-2xl font-bold text-natural-charcoal sm:text-3xl">
        {t("successTitle")}
      </h1>
      <p className="mt-2 text-sm text-natural-charcoal/70">
        {t("paymentConfirmed")}
      </p>

      <div className="mt-8 w-full rounded-2xl border border-natural-border bg-white p-6 text-left">
        <dl className="space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-natural-charcoal/60">{t("summary.plan")}</dt>
            <dd className="font-bold text-natural-charcoal">
              {planName ?? t("summary.unknownPlan")}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-natural-charcoal/60">
              {t("summary.billing")}
            </dt>
            <dd className="font-bold text-natural-charcoal">
              {billing === "monthly"
                ? t("billingMonthly")
                : billing === "yearly"
                  ? t("billingYearly")
                  : "—"}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-natural-charcoal/60">{t("summary.paidAt")}</dt>
            <dd className="font-bold text-natural-charcoal">
              {formatDate(paidAt, locale)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-natural-charcoal/60">
              {t("summary.expiresAt")}
            </dt>
            <dd className="font-bold text-natural-charcoal">
              {formatDate(expiresAt, locale)}
            </dd>
          </div>
        </dl>
      </div>

      <Link
        href={`/${locale}/learn`}
        className="mt-8 inline-flex items-center justify-center rounded-full bg-natural-green px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-natural-green-hover"
      >
        {t("startLearning")}
      </Link>
      <Link
        href={`/${locale}/pricing`}
        className="mt-3 text-sm font-bold text-natural-charcoal/60 transition-colors hover:text-natural-green"
      >
        {t("backToPricing")}
      </Link>
    </div>
  );
}
