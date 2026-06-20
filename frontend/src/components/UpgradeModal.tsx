"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Check, Crown } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FALLBACK_PLANS = [
  {
    id: "free",
    name: "free",
    displayName: { vi: "Miễn phí", en: "Free" },
    priceMonthly: 0,
    priceYearly: 0,
    quotas: { chatTurns: 10, ttsRequests: 5, sttRequests: 5, practiceExams: 2 },
    features: { topics: ["*"], progressTracking: false, parentDashboard: false, multiAccounts: false },
  },
  {
    id: "plus",
    name: "plus",
    displayName: { vi: "Plus", en: "Plus" },
    priceMonthly: 49000,
    priceYearly: 399000,
    quotas: { chatTurns: -1, ttsRequests: -1, sttRequests: -1, practiceExams: -1 },
    features: { topics: ["*"], progressTracking: true, parentDashboard: false, multiAccounts: false },
  },
  {
    id: "premium",
    name: "premium",
    displayName: { vi: "Premium", en: "Premium" },
    priceMonthly: 99000,
    priceYearly: 799000,
    quotas: { chatTurns: -1, ttsRequests: -1, sttRequests: -1, practiceExams: -1 },
    features: { topics: ["*"], progressTracking: true, parentDashboard: true, multiAccounts: true },
  },
];

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const locale = useLocale();
  const router = useRouter();
  const [plans, setPlans] = useState(FALLBACK_PLANS);

  useEffect(() => {
    if (!isOpen) return;

    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api/v1";

    fetch(`${API_URL}/plans/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.plans && data.plans.length > 0) {
          setPlans(data.plans);
        }
      })
      .catch(() => {
        // Use fallback plans if API fails
      });
  }, [isOpen]);

  const formatPrice = useCallback(
    (price: number) => {
      if (price === 0) return "Miễn phí";
      return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(price);
    },
    [locale],
  );

  const handleUpgrade = useCallback(
    (planName: string) => {
      onClose();
      // Use window.location for reliable navigation
      window.location.href = `/${locale}/pricing`;
    },
    [onClose, locale],
  );

  const quotaLabels: Record<string, string> = {
    chatTurns: "Chat AI",
    ttsRequests: "Nghe đọc (TTS)",
    sttRequests: "Nói câu hỏi (STT)",
    practiceExams: "Luyện đề",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-natural-green" />
                <h2 className="text-lg font-bold text-gray-800">Nâng cấp gói học</h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="mb-4 text-sm text-gray-600">
                Bạn đã hết lượt chat miễn phí hôm nay. Chọn gói phù hợp để tiếp tục học không giới hạn:
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                {plans.map((plan) => {
                  const isFree = plan.name === "free";
                  const isRecommended = plan.name === "plus";

                  return (
                    <div
                      key={plan.id || plan.name}
                      className={`relative rounded-xl border-2 p-4 transition-all ${
                        isRecommended
                          ? "border-natural-green bg-natural-green/5"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      {isRecommended && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-natural-green px-3 py-0.5 text-xs font-bold text-white whitespace-nowrap">
                          <Crown className="mr-1 inline h-3 w-3" />
                          Khuyên dùng
                        </span>
                      )}

                      <h3 className="text-base font-bold text-gray-800">
                        {plan.displayName?.[locale as keyof typeof plan.displayName] ||
                          plan.displayName?.vi ||
                          plan.name}
                      </h3>

                      <div className="mt-1 mb-3">
                        <span className="text-2xl font-bold text-gray-800">
                          {formatPrice(plan.priceMonthly)}
                        </span>
                        {plan.priceMonthly > 0 && (
                          <span className="ml-1 text-sm text-gray-500">/tháng</span>
                        )}
                      </div>

                      <ul className="mb-4 space-y-1.5">
                        {Object.entries(plan.quotas || {}).map(([key, value]) => {
                          const label = quotaLabels[key] || key;
                          const displayValue =
                            value === -1 ? "Không giới hạn" : `${value} lượt/ngày`;

                          return (
                            <li key={key} className="flex items-center gap-2 text-xs text-gray-600">
                              <Check className="h-3.5 w-3.5 shrink-0 text-natural-green" />
                              <span>
                                {label}: <span className="font-semibold">{displayValue}</span>
                              </span>
                            </li>
                          );
                        })}
                        {plan.features?.progressTracking && (
                          <li className="flex items-center gap-2 text-xs text-gray-600">
                            <Check className="h-3.5 w-3.5 shrink-0 text-natural-green" />
                            <span>Theo dõi tiến độ</span>
                          </li>
                        )}
                        {plan.features?.parentDashboard && (
                          <li className="flex items-center gap-2 text-xs text-gray-600">
                            <Check className="h-3.5 w-3.5 shrink-0 text-natural-green" />
                            <span>Dashboard phụ huynh</span>
                          </li>
                        )}
                        {plan.features?.multiAccounts && (
                          <li className="flex items-center gap-2 text-xs text-gray-600">
                            <Check className="h-3.5 w-3.5 shrink-0 text-natural-green" />
                            <span>Đa tài khoản con</span>
                          </li>
                        )}
                      </ul>

                      <button
                        onClick={() => handleUpgrade(plan.name)}
                        disabled={isFree}
                        className={`w-full rounded-lg py-2.5 text-sm font-bold transition-colors ${
                          isFree
                            ? "cursor-not-allowed bg-gray-100 text-gray-400"
                            : isRecommended
                              ? "bg-natural-green text-white hover:bg-natural-green-hover"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {isFree ? "Gói hiện tại" : "Nâng cấp ngay"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
