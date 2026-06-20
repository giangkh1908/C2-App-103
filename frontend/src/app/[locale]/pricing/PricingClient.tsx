"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getPlans } from "@/lib/planApi";
import type { Plan } from "@/types/auth";
import Navbar from "@/components/landing/Navbar";
import { Check, X, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PricingClient({ locale }: { locale: string }) {
  const t = useTranslations("pricing");
  const { apiFetch, isAuthenticated } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [upgradeResult, setUpgradeResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    getPlans(apiFetch)
      .then(setPlans)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [apiFetch]);

  const formatPrice = (price: number) => {
    if (price === 0) return t("free");
    return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPrice = (plan: Plan) => {
    return billing === "monthly" ? plan.priceMonthly : plan.priceYearly;
  };

  const getBillingLabel = (plan: Plan) => {
    if (plan.priceMonthly === 0) return "";
    return billing === "monthly" ? t("perMonth") : t("perYear");
  };

  const sortedPlans = [...plans].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // Sanitize plan display names to prevent XSS
  const sanitizeText = (text: string) => {
    return text.replace(/[<>]/g, (char) => ({
      '<': '&lt;',
      '>': '&gt;',
    }[char] || char));
  };

  const featureLabels: Record<string, string> = {
    chatTurns: t("featureChatTurns"),
    ttsRequests: t("featureTts"),
    sttRequests: t("featureStt"),
    practiceExams: t("featurePractice"),
  };

  const getQuotaLabel = (value: number) => {
    if (value === -1) return t("unlimited");
    return `${value} ${t("perDay")}`;
  };

  const handleUpgrade = async (planName: string) => {
    setUpgrading(planName);
    setUpgradeResult(null);

    try {
      const res = await apiFetch("/subscription/upgrade", {
        method: "POST",
        body: JSON.stringify({ plan_name: planName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Upgrade failed");
      }

      setUpgradeResult({ success: true, message: "Nâng cấp thành công!" });
      setTimeout(() => {
        router.push(`/${locale}/learn`);
      }, 1500);
    } catch (err) {
      setUpgradeResult({
        success: false,
        message: err instanceof Error ? err.message : "Có lỗi xảy ra",
      });
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <main className="min-h-screen bg-natural-bg">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-natural-charcoal sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-natural-charcoal/70">
            {t("subtitle")}
          </p>
        </div>

        {upgradeResult && (
          <div
            className={`mx-auto mt-6 max-w-md rounded-xl px-4 py-3 text-center text-sm font-bold ${
              upgradeResult.success
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {upgradeResult.message}
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${
              billing === "monthly"
                ? "bg-natural-green text-white"
                : "bg-white text-natural-charcoal/70 hover:bg-natural-green/10"
            }`}
          >
            {t("monthly")}
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${
              billing === "yearly"
                ? "bg-natural-green text-white"
                : "bg-white text-natural-charcoal/70 hover:bg-natural-green/10"
            }`}
          >
            {t("yearly")}
            <span className="ml-1.5 rounded-full bg-natural-orange/20 px-2 py-0.5 text-xs text-natural-orange">
              -35%
            </span>
          </button>
        </div>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-natural-green border-t-transparent" />
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedPlans.map((plan) => {
              const isRecommended = plan.name === "plus";
              const isCurrentPlan = false; // TODO: compare with user.planId
              const isUpgrading = upgrading === plan.name;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border-2 bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
                    isRecommended
                      ? "border-natural-green shadow-natural-green/10"
                      : "border-natural-border"
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-natural-green px-3 py-1 text-xs font-bold text-white">
                        <Sparkles className="h-3 w-3" />
                        {t("recommended")}
                      </span>
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-natural-charcoal">
                      {sanitizeText(
                        plan.displayName[locale as keyof typeof plan.displayName] || plan.displayName.vi
                      )}
                    </h3>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-natural-charcoal">
                        {formatPrice(getPrice(plan))}
                      </span>
                      {getBillingLabel(plan) && (
                        <span className="ml-1 text-sm text-natural-charcoal/60">
                          /{getBillingLabel(plan)}
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="mb-6 flex-1 space-y-3">
                    {Object.entries(plan.quotas).map(([key, value]) => (
                      <li key={key} className="flex items-start gap-2 text-sm">
                        {value === -1 ? (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-natural-green" />
                        ) : value > 0 ? (
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-natural-green" />
                        ) : (
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-natural-charcoal/30" />
                        )}
                        <span className="text-natural-charcoal/80">
                          {featureLabels[key] || key}:{" "}
                          <span className="font-semibold">
                            {getQuotaLabel(value)}
                          </span>
                        </span>
                      </li>
                    ))}
                    {plan.features.progressTracking && (
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-natural-green" />
                        <span className="text-natural-charcoal/80">
                          {t("featureProgress")}
                        </span>
                      </li>
                    )}
                    {plan.features.parentDashboard && (
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-natural-green" />
                        <span className="text-natural-charcoal/80">
                          {t("featureParentDashboard")}
                        </span>
                      </li>
                    )}
                    {plan.features.multiAccounts && (
                      <li className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-natural-green" />
                        <span className="text-natural-charcoal/80">
                          {t("featureMultiAccounts")}
                        </span>
                      </li>
                    )}
                  </ul>

                  {isAuthenticated ? (
                    <button
                      onClick={() => handleUpgrade(plan.name)}
                      disabled={isUpgrading}
                      className={`flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold transition-colors ${
                        isRecommended
                          ? "bg-natural-green text-white hover:bg-natural-green-hover disabled:opacity-60"
                          : "bg-natural-bg text-natural-charcoal hover:bg-natural-border disabled:opacity-60"
                      }`}
                    >
                      {isUpgrading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : plan.priceMonthly === 0 ? (
                        t("startFree")
                      ) : (
                        t("upgrade")
                      )}
                    </button>
                  ) : (
                    <Link
                      href={`/${locale}/login`}
                      className={`block rounded-full py-3 text-center text-sm font-bold transition-colors ${
                        isRecommended
                          ? "bg-natural-green text-white hover:bg-natural-green-hover"
                          : "bg-natural-bg text-natural-charcoal hover:bg-natural-border"
                      }`}
                    >
                      {t("getStarted")}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
