"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  fetchPayment,
  activatePayment,
  AdminAuthError,
} from "@/lib/adminApi";
import type { AdminPayment } from "@/types/admin";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Đang chờ",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  expired: "Hết hạn",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-800"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null, fallback: string): string {
  if (!dateStr) return fallback;
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPaymentDetailPage() {
  const locale = useLocale();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { apiFetch } = useAuth();

  const [payment, setPayment] = useState<AdminPayment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activateSuccess, setActivateSuccess] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchPayment(apiFetch, id);
      setPayment(result);
    } catch (err) {
      if (err instanceof AdminAuthError) {
        router.push(`/${locale}/login`);
        return;
      }
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đã xảy ra lỗi");
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, id, locale, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleActivate = async () => {
    setIsActivating(true);
    setError(null);
    setActivateSuccess(false);
    try {
      const updated = await activatePayment(apiFetch, id);
      setPayment(updated);
      setActivateSuccess(true);
    } catch (err) {
      if (err instanceof AdminAuthError) {
        router.push(`/${locale}/login`);
        return;
      }
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đã xảy ra lỗi khi kích hoạt");
      }
    } finally {
      setIsActivating(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        </div>
      </main>
    );
  }

  if (error && !payment) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
          <div className="mt-4">
            <Link
              href={`/${locale}/admin/payments`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              ← Quay lại danh sách
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!payment) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500">Không tìm thấy thanh toán</p>
          <div className="mt-4">
            <Link
              href={`/${locale}/admin/payments`}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              ← Quay lại danh sách
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}/admin/payments`}
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Quay lại
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Chi tiết thanh toán: {payment.payment_code}
        </h1>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {activateSuccess && (
          <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            Kích hoạt thành công
          </div>
        )}

        {/* Info card */}
        <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm">
          <dl className="divide-y divide-gray-200">
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Mã giao dịch
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {payment.payment_code}
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Người dùng
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {payment.user_id}
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Gói</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {payment.plan_name}
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Số tiền</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900 sm:col-span-2 sm:mt-0">
                {formatVnd(payment.amount_vnd)}
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Hình thức</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {payment.billing === "monthly" ? "Tháng" : "Năm"}
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Cổng thanh toán
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {payment.gateway}
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Trạng thái</dt>
              <dd className="mt-1 sm:col-span-2 sm:mt-0">
                <StatusBadge status={payment.status} />
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Ngày tạo</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {formatDate(payment.created_at, "")}
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Ngày thanh toán
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {formatDate(payment.paid_at, "Chưa thanh toán")}
              </dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Ngày hết hạn
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {formatDate(payment.expires_at, "Không có")}
              </dd>
            </div>
          </dl>
        </div>

        {/* Raw webhook payload */}
        <div className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="px-6 py-4">
            <h2 className="text-base font-bold text-gray-900">
              Dữ liệu webhook gốc
            </h2>
            {payment.raw_webhook_payload ? (
              <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-100 p-4 text-xs text-gray-800">
                {JSON.stringify(payment.raw_webhook_payload, null, 2)}
              </pre>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                Không có dữ liệu
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {payment.status === "pending" && (
          <div className="mt-6">
            <button
              onClick={handleActivate}
              disabled={isActivating}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isActivating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Đang kích hoạt...
                </>
              ) : (
                "Kích hoạt thủ công"
              )}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
