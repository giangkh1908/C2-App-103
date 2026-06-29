"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchCostStats, fetchLlmLogs, fetchStats } from "@/lib/adminApi";
import type { AdminCostStats, AdminLlmLog, AdminStats } from "@/types/admin";

export default function AdminDashboard() {
  const { apiFetch } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [costStats, setCostStats] = useState<AdminCostStats | null>(null);
  const [llmLogs, setLlmLogs] = useState<AdminLlmLog[]>([]);
  const [llmTotal, setLlmTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [, setCostLoading] = useState(true);
  const [llmLoading, setLlmLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llmFilter, setLlmFilter] = useState({
    model: "",
    user_id: "",
    status: "",
    date: "",
  });

  useEffect(() => {
    let cancelled = false;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    (async () => {
      try {
        const [statsData, costData] = await Promise.all([
          fetchStats(apiFetch),
          fetchCostStats(apiFetch, currentMonth),
        ]);
        if (!cancelled) {
          setStats(statsData);
          setCostStats(costData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Không thể tải dữ liệu",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setCostLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  const loadLlmLogs = async (filters?: typeof llmFilter) => {
    setLlmLoading(true);
    try {
      const data = await fetchLlmLogs(apiFetch, {
        model: filters?.model || undefined,
        user_id: filters?.user_id || undefined,
        status: filters?.status || undefined,
        date: filters?.date || undefined,
        page: 1,
        page_size: 20,
      });
      setLlmLogs(data.items);
      setLlmTotal(data.total);
    } catch {
      setLlmLogs([]);
      setLlmTotal(0);
    } finally {
      setLlmLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => loadLlmLogs(llmFilter));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFetch]);

  const handleLlmSearch = () => {
    loadLlmLogs(llmFilter);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-natural-green border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm font-bold text-red-700">{error}</p>
      </div>
    );
  }

  const cards = [
    {
      label: "Tổng doanh thu",
      value: stats
        ? `${stats.total_revenue.toLocaleString("vi-VN")}₫`
        : "—",
    },
    {
      label: "Gói đã bán",
      value: stats?.total_subscriptions.toLocaleString("vi-VN") ?? "—",
    },
    {
      label: "Đang chờ xử lý",
      value: stats?.pending_payments.toLocaleString("vi-VN") ?? "—",
    },
    {
      label: "Người dùng hoạt động",
      value: stats?.active_users.toLocaleString("vi-VN") ?? "—",
    },
    {
      label: "Chi phí LLM (tháng)",
      value: costStats?.total_cost_usd != null
        ? `$${costStats.total_cost_usd.toFixed(4)}`
        : "—",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-natural-charcoal">
        Tổng quan
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-natural-border bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-natural-charcoal/60">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-natural-charcoal">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Chi phí LLM chi tiết ── */}
      {costStats && (
        <div className="mt-6 rounded-xl border border-natural-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-natural-charcoal">
            Chi tiết chi phí LLM
          </h2>

          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Tổng chi phí tháng */}
            <div>
              <p className="text-sm font-medium text-natural-charcoal/60">
                Tổng chi phí (tháng {costStats.month})
              </p>
              <p className="mt-1 text-2xl font-bold text-natural-charcoal">
                ${costStats.total_cost_usd.toFixed(4)}
              </p>
            </div>

            {/* So sánh với tháng trước */}
            <div>
              <p className="text-sm font-medium text-natural-charcoal/60">
                So với tháng trước
              </p>
              <p className="mt-1 text-2xl font-bold text-natural-charcoal">
                {costStats.previous_month != null
                  ? (() => {
                      const diff =
                        costStats.total_cost_usd - costStats.previous_month!;
                      const pct =
                        costStats.previous_month! > 0
                          ? ((diff / costStats.previous_month!) * 100).toFixed(
                              1,
                            )
                          : "—";
                      if (diff > 0)
                        return `↑ +${pct}%`;
                      if (diff < 0) return `↓ ${pct}%`;
                      return "—";
                    })()
                  : "—"}
              </p>
            </div>

            {/* Tổng số người dùng */}
            <div>
              <p className="text-sm font-medium text-natural-charcoal/60">
                Số người dùng có chi phí
              </p>
              <p className="mt-1 text-2xl font-bold text-natural-charcoal">
                {costStats.total_users.toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

          {/* Top 3 người dùng */}
          {costStats.top_users.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-bold text-natural-charcoal/80">
                Top người dùng chi tiêu nhiều nhất
              </h3>
              <div className="space-y-2">
                {costStats.top_users.slice(0, 3).map((user, i) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between rounded-lg border border-natural-border/50 px-4 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-natural-charcoal/40">
                        #{i + 1}
                      </span>
                      <span className="text-sm font-medium text-natural-charcoal">
                        {user.email ?? "—"}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-natural-charcoal">
                      ${user.cost_usd.toFixed(4)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LLM Audit ── */}
      <div className="mt-6 rounded-xl border border-natural-border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-natural-charcoal">
          Kiểm tra LLM
        </h2>

        {/* Bộ lọc */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-natural-charcoal/60">
              Model
            </label>
            <input
              type="text"
              value={llmFilter.model}
              onChange={(e) =>
                setLlmFilter((f) => ({ ...f, model: e.target.value }))
              }
              placeholder="gpt-4, claude..."
              className="rounded-lg border border-natural-border px-3 py-1.5 text-sm focus:border-natural-green focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-natural-charcoal/60">
              User ID
            </label>
            <input
              type="text"
              value={llmFilter.user_id}
              onChange={(e) =>
                setLlmFilter((f) => ({ ...f, user_id: e.target.value }))
              }
              placeholder="user_id"
              className="rounded-lg border border-natural-border px-3 py-1.5 text-sm focus:border-natural-green focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-natural-charcoal/60">
              Trạng thái
            </label>
            <select
              value={llmFilter.status}
              onChange={(e) =>
                setLlmFilter((f) => ({ ...f, status: e.target.value }))
              }
              className="rounded-lg border border-natural-border px-3 py-1.5 text-sm focus:border-natural-green focus:outline-none"
            >
              <option value="">Tất cả</option>
              <option value="success">Thành công</option>
              <option value="failure">Thất bại</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-natural-charcoal/60">
              Ngày (YYYY-MM-DD)
            </label>
            <input
              type="text"
              value={llmFilter.date}
              onChange={(e) =>
                setLlmFilter((f) => ({ ...f, date: e.target.value }))
              }
              placeholder="2024-01-15"
              className="rounded-lg border border-natural-border px-3 py-1.5 text-sm focus:border-natural-green focus:outline-none"
            />
          </div>
          <button
            onClick={handleLlmSearch}
            disabled={llmLoading}
            className="rounded-lg bg-natural-green px-4 py-1.5 text-sm font-medium text-white hover:bg-natural-green/90 disabled:opacity-50"
          >
            Tìm kiếm
          </button>
        </div>

        {/* Bảng kết quả */}
        {llmLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-natural-green border-t-transparent" />
          </div>
        ) : llmLogs.length === 0 ? (
          <p className="py-8 text-center text-sm text-natural-charcoal/50">
            Không có dữ liệu
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-natural-border text-left text-xs font-medium text-natural-charcoal/60">
                    <th className="px-3 py-2">Thời gian</th>
                    <th className="px-3 py-2">Model</th>
                    <th className="px-3 py-2">Trạng thái</th>
                    <th className="px-3 py-2 text-right">Tokens In</th>
                    <th className="px-3 py-2 text-right">Tokens Out</th>
                    <th className="px-3 py-2 text-right">Chi phí ($)</th>
                    <th className="px-3 py-2 text-right">Độ trễ (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {llmLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-natural-border/50 hover:bg-natural-charcoal/[0.02]"
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-natural-charcoal">
                        {new Date(log.created_at).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-3 py-2 font-medium text-natural-charcoal">
                        {log.model}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            log.status === "success"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {log.status === "success" ? "Thành công" : "Thất bại"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-natural-charcoal">
                        {log.prompt_tokens.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-natural-charcoal">
                        {log.completion_tokens.toLocaleString("vi-VN")}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-natural-charcoal">
                        ${log.cost_usd.toFixed(6)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-natural-charcoal">
                        {log.latency_ms.toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-natural-charcoal/50">
              Hiển thị {llmLogs.length} / {llmTotal} bản ghi
            </p>
          </>
        )}
      </div>
    </div>
  );
}
