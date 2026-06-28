"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  fetchUsers,
  extendUser,
  changeUserPlan,
  fetchPlans,
  AdminAuthError,
} from "@/lib/adminApi";
import type { AdminPlan } from "@/lib/adminApi";
import type { AdminUser } from "@/types/admin";

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const { apiFetch } = useAuth();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "vi";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [changingPlanId, setChangingPlanId] = useState<string | null>(null);
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const getPlanLabel = useCallback(
    (planName: string | undefined): string => {
      if (!planName || planName === "free") return "Miễn phí";
      const plan = plans.find((p) => p.name === planName);
      if (plan) return plan.display_name.vi ?? plan.name;
      return planName;
    },
    [plans],
  );

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchUsers(apiFetch, {
        page,
        page_size: PAGE_SIZE,
      });
      setUsers(result.items);
      setTotal(result.total);
    } catch (err) {
      if (err instanceof AdminAuthError) {
        router.push(`/${locale}/login`);
        return;
      }
      setError(
        err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải danh sách",
      );
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch, page, router, locale]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await fetchUsers(apiFetch, {
          page,
          page_size: PAGE_SIZE,
        });
        if (!cancelled) {
          setUsers(result.items);
          setTotal(result.total);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof AdminAuthError) {
          router.push(`/${locale}/login`);
          return;
        }
        setError(
          err instanceof Error ? err.message : "Đã xảy ra lỗi khi tải danh sách",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiFetch, page, router, locale]);

  useEffect(() => {
    fetchPlans(apiFetch)
      .then(setPlans)
      .catch(() => {
        /* silently ignore — plans are non-critical */
      });
  }, [apiFetch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChangePlan = async (userId: string, planName: string) => {
    setChangingPlanId(userId);
    setDropdownOpenId(null);
    setError(null);
    setSuccessMessage(null);
    try {
      await changeUserPlan(apiFetch, userId, planName);
      await loadUsers();
      setSuccessMessage("Đổi gói thành công!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (err instanceof AdminAuthError) {
        router.push(`/${locale}/login`);
        return;
      }
      setError(
        err instanceof Error ? err.message : "Đổi gói thất bại",
      );
    } finally {
      setChangingPlanId(null);
    }
  };

  const handleExtend = async (userId: string) => {
    setExtendingId(userId);
    setError(null);
    setSuccessMessage(null);
    try {
      await extendUser(apiFetch, userId);
      await loadUsers();
      setSuccessMessage("Gia hạn thành công!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (err instanceof AdminAuthError) {
        router.push(`/${locale}/login`);
        return;
      }
      setError(
        err instanceof Error ? err.message : "Gia hạn thất bại",
      );
    } finally {
      setExtendingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "Không có";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const statusBadge = (status: AdminUser["subscription_status"]) => {
    const config: Record<
      AdminUser["subscription_status"],
      { label: string; className: string }
    > = {
      active: {
        label: "Hoạt động",
        className: "bg-green-100 text-green-800",
      },
      cancelled: {
        label: "Đã hủy",
        className: "bg-yellow-100 text-yellow-800",
      },
      expired: {
        label: "Hết hạn",
        className: "bg-red-100 text-red-800",
      },
    };
    const { label, className } = config[status] ?? {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Quản lý người dùng</h1>

      {successMessage && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <svg
            className="h-8 w-8 animate-spin text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      ) : users.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          Không có người dùng nào
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Tên
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Gói
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Hạn đăng ký
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Vai trò
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {getPlanLabel(user.plan_name)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {statusBadge(user.subscription_status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatDate(user.subscription_expires_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.role === "admin" ? "Admin" : "Người dùng"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExtend(user.id)}
                          disabled={extendingId === user.id}
                          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {extendingId === user.id ? (
                            <svg
                              className="h-4 w-4 animate-spin"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                          ) : (
                            "Gia hạn +30 ngày"
                          )}
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setDropdownOpenId(
                                dropdownOpenId === user.id ? null : user.id,
                              )
                            }
                            disabled={changingPlanId === user.id}
                            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {changingPlanId === user.id ? (
                              <svg
                                className="h-4 w-4 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                              </svg>
                            ) : (
                              "Đổi gói"
                            )}
                          </button>

                          {dropdownOpenId === user.id && (
                            <div
                              ref={dropdownRef}
                              className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg"
                            >
                              <div className="py-1">
                                {plans.map((plan) => {
                                  const isCurrent =
                                    plan.name ===
                                    (user.plan_name || "free");
                                  return (
                                    <button
                                      key={plan.name}
                                      type="button"
                                      onClick={() => {
                                        if (isCurrent) {
                                          setError(
                                            "Người dùng đang dùng gói này",
                                          );
                                          setDropdownOpenId(null);
                                          setTimeout(
                                            () => setError(null),
                                            3000,
                                          );
                                          return;
                                        }
                                        handleChangePlan(
                                          user.id,
                                          plan.name,
                                        );
                                      }}
                                      className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
                                        isCurrent
                                          ? "text-gray-400"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      <span>
                                        {plan.display_name.vi ?? plan.name}
                                      </span>
                                      {isCurrent && (
                                        <span className="text-xs text-gray-400">
                                          (hiện tại)
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trước
            </button>
            <span className="text-sm text-gray-600">
              Trang {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </>
      )}
    </div>
  );
}
