"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getPlans } from "@/lib/planApi";
import { type ApiFetch } from "@/lib/paymentApi";
import type { Plan, User } from "@/types/auth";
import type { PaymentBilling } from "@/types/payment";
import Navbar from "@/components/landing/Navbar";
import { Check, X, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PricingClient({ locale }: { locale: string }) {
  const t = useTranslations("pricing");
  const { apiFetch, isAuthenticated, user: authUser } = useAuth() as {
    apiFetch: ApiFetch;
    isAuthenticated: boolean;
    user: User | null;
  };
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<PaymentBilling>("monthly");
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [upgradeResult, setUpgradeResult] = useState<{ success: boolean; message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    planName: string;
    planDisplayName: string;
    currentPlanName: string;
    targetPlanName: string;
    currentSortOrder: number;
    targetSortOrder: number;
  } | null>(null);

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

  const getSortOrder = (planName: string) => {
    const order: Record<string, number> = { free: 0, plus: 1, premium: 2 };
    return order[planName] ?? -1;
  };

  const handleUpgrade = async (planName: string) => {
    setUpgrading(planName);
    setUpgradeResult(null);

    try {
      const currentPlan = plans.find((p) => p.id === authUser?.planId);
      const currentPlanName = currentPlan?.name ?? "free";
      const currentSort = getSortOrder(currentPlanName);
      const targetSort = getSortOrder(planName);

      // Case 1: Free plan → go to learning page (no API call, no plan change)
      if (planName === "free") {
        router.push(`/${locale}/learn`);
        return;
      }

      // Case 2: Same plan → billing switch not supported
      if (planName === currentPlanName) {
        setUpgradeResult({
          success: false,
          message: "Liên hệ hỗ trợ để đổi chu kỳ thanh toán",
        });
        setTimeout(() => setUpgradeResult(null), 3000);
        return;
      }

      // Case 3: Downgrade (target sort < current sort)
      // Backend validates: same-tier or downgrade allowed, upgrade rejected.
      if (targetSort < currentSort) {
        const targetPlan = plans.find((p) => p.name === planName);
        setConfirmDialog({
          open: true,
          planName,
          planDisplayName: targetPlan?.displayName?.vi ?? planName,
          currentPlanName,
          targetPlanName: planName,
          currentSortOrder: currentSort,
          targetSortOrder: targetSort,
        });
        return;
      }

      // Case 4: Upgrade (target sort > current sort) → payment flow
      router.push(`/${locale}/payment?plan=${encodeURIComponent(planName)}&billing=${billing}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("errorGeneric");
      setUpgradeResult({
        success: false,
        message,
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

        {confirmDialog?.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-natural-charcoal">Xác nhận thay đổi gói</h3>
              <p className="mt-2 text-sm text-natural-charcoal/70">
                Bạn đang giảm gói từ <strong>{confirmDialog.currentPlanName}</strong> xuống{" "}
                <strong>{confirmDialog.planDisplayName}</strong>. Một số tính năng sẽ bị giới hạn.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 rounded-full border border-natural-border py-2.5 text-sm font-bold text-natural-charcoal"
                >
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    const res = await apiFetch("/subscription/change", {
                      method: "POST",
                      body: JSON.stringify({ plan_name: confirmDialog.planName, billing }),
                    });
                    if (res.ok) {
                      router.push(`/${locale}`);
                    }
                    setConfirmDialog(null);
                  }}
                  className="flex-1 rounded-full bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600"
                >
                  Đồng ý
                </button>
              </div>
            </div>
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
              const isCurrentPlan = authUser?.planId === plan.id;
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
                      disabled={upgrading !== null || isCurrentPlan}
                      className={`flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold transition-colors ${
                        isRecommended
                          ? "bg-natural-green text-white hover:bg-natural-green-hover disabled:opacity-60"
                          : "bg-natural-bg text-natural-charcoal hover:bg-natural-border disabled:opacity-60"
                      }`}
                    >
                      {isCurrentPlan ? (
                        "Gói hiện tại"
                      ) : isUpgrading ? (
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
