"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { fetchCostStats, fetchLlmLogs, fetchStats } from "@/lib/adminApi";
import type { AdminCostStats, AdminLlmLog, AdminStats, LlmStatsResponse } from "@/types/admin";

const PIE_COLORS = ["#4A6741", "#6B8F5E", "#8FAE7E", "#B0C9A0", "#C7D9B9"];

function buildLlmStatsFromLogs(logs: AdminLlmLog[], days = 7): LlmStatsResponse {
  const now = new Date();
  const since = new Date(now);
  since.setDate(now.getDate() - days);

  const recentLogs = logs.filter((log) => {
    const createdAt = new Date(log.created_at);
    return !Number.isNaN(createdAt.getTime()) && createdAt >= since;
  });

  const dailyCosts = new Map<string, { cost_usd: number; requests: number; tokens: number }>();
  const costByModel = new Map<string, number>();
  const tokensByUser = new Map<string, { tokens: number; cost_usd: number }>();
  const latencies: number[] = [];

  for (const log of recentLogs) {
    const createdAt = new Date(log.created_at);
    const date = createdAt.toISOString().slice(0, 10);
    const promptTokens = log.prompt_tokens ?? 0;
    const completionTokens = log.completion_tokens ?? 0;
    const tokens = promptTokens + completionTokens;
    const cost = log.cost_usd ?? 0;
    const latency = log.latency_ms ?? 0;

    const daily = dailyCosts.get(date) ?? { cost_usd: 0, requests: 0, tokens: 0 };
    daily.cost_usd += cost;
    daily.requests += 1;
    daily.tokens += tokens;
    dailyCosts.set(date, daily);

    costByModel.set(log.model, (costByModel.get(log.model) ?? 0) + cost);

    const userTokens = tokensByUser.get(log.user_id) ?? { tokens: 0, cost_usd: 0 };
    userTokens.tokens += tokens;
    userTokens.cost_usd += cost;
    tokensByUser.set(log.user_id, userTokens);

    latencies.push(latency);
  }

  latencies.sort((a, b) => a - b);
  const totalCost = recentLogs.reduce((sum, log) => sum + (log.cost_usd ?? 0), 0);
  const totalErrors = recentLogs.filter((log) => log.status === "failure").length;
  const percentile = (p: number) =>
    latencies.length ? latencies[Math.min(Math.floor(latencies.length * p), latencies.length - 1)] : 0;

  return {
    daily_costs: Array.from(dailyCosts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        cost_usd: Number(value.cost_usd.toFixed(6)),
        requests: value.requests,
        tokens: value.tokens,
      })),
    cost_by_model: Array.from(costByModel.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([model, cost_usd]) => ({
        model,
        cost_usd: Number(cost_usd.toFixed(6)),
      })),
    tokens_by_user: Array.from(tokensByUser.entries())
      .sort(([, a], [, b]) => b.tokens - a.tokens)
      .slice(0, 10)
      .map(([user_id, value]) => ({
        user_id,
        tokens: value.tokens,
        cost_usd: Number(value.cost_usd.toFixed(6)),
      })),
    overall: {
      total_cost_usd: Number(totalCost.toFixed(6)),
      total_requests: recentLogs.length,
      error_rate: recentLogs.length ? Number((totalErrors / recentLogs.length).toFixed(4)) : 0,
      latency_p50_ms: percentile(0.5),
      latency_p95_ms: percentile(0.95),
    },
  };
}

export default function AdminDashboard() {
  const { apiFetch } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [costStats, setCostStats] = useState<AdminCostStats | null>(null);
  const [llmStats, setLlmStats] = useState<LlmStatsResponse | null>(null);
  const [todayCost, setTodayCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [llmLogs, setLlmLogs] = useState<AdminLlmLog[]>([]);
  const [llmTotal, setLlmTotal] = useState(0);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmFilter, setLlmFilter] = useState({
    model: "",
    user_id: "",
    status: "",
    date: "",
  });

  const loadLlmLogs = useCallback(async (filters?: typeof llmFilter) => {
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
      const hasActiveFilter = Boolean(
        filters?.model || filters?.user_id || filters?.status || filters?.date,
      );
      if (!hasActiveFilter) {
        const statsFromLogs = buildLlmStatsFromLogs(data.items);
        setLlmStats(statsFromLogs);
        const today = new Date().toISOString().slice(0, 10);
        setTodayCost(
          data.items
            .filter((log) => {
              const createdAt = new Date(log.created_at);
              return (
                !Number.isNaN(createdAt.getTime()) &&
                createdAt.toISOString().slice(0, 10) === today
              );
            })
            .reduce((sum, log) => sum + (log.cost_usd ?? 0), 0),
        );
      }
    } catch {
      setLlmLogs([]);
      setLlmTotal(0);
      setLlmError("Không thể tải thống kê LLM");
    } finally {
      setLlmLoading(false);
    }
  }, [apiFetch]);

  const fetchAll = useCallback(async () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    setError(null);
    setLlmError(null);

    try {
      const [statsData, costData] = await Promise.all([
        fetchStats(apiFetch),
        fetchCostStats(apiFetch, currentMonth),
      ]);
      setStats(statsData);
      setCostStats(costData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
      setLoading(false);
      return;
    }

    setLoading(false);
  }, [apiFetch]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchAll().catch(() => {});
    });
  }, [fetchAll]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAll().catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    queueMicrotask(() => {
      loadLlmLogs(llmFilter).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadLlmLogs]);

  const handleLlmSearch = () => {
    loadLlmLogs(llmFilter);
  };

  const dailyBudgetUsd = 1.0;
  const budgetPct = Math.min((todayCost / dailyBudgetUsd) * 100, 100);
  const budgetColor =
    budgetPct > 90 ? "bg-red-500" : budgetPct > 70 ? "bg-yellow-500" : "bg-green-500";

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
      value: stats ? `${(stats.total_revenue ?? 0).toLocaleString("vi-VN")}₫` : "—",
    },
    {
      label: "Gói đã bán",
      value: (stats?.total_subscriptions ?? 0).toLocaleString("vi-VN"),
    },
    {
      label: "Đang chờ xử lý",
      value: (stats?.pending_payments ?? 0).toLocaleString("vi-VN"),
    },
    {
      label: "Người dùng hoạt động",
      value: (stats?.active_users ?? 0).toLocaleString("vi-VN"),
    },
    {
      label: "Chi phí LLM (tháng)",
      value: costStats?.total_cost_usd != null ? `$${costStats.total_cost_usd.toFixed(4)}` : "—",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-natural-charcoal">Tổng quan</h1>

      {/* ── Budget Progress Bar ── */}
      <div className="mb-6 rounded-xl border border-natural-border bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-natural-charcoal/60">Ngân sách LLM hôm nay</p>
        <p className="mt-1 text-2xl font-bold text-natural-charcoal">
          ${todayCost.toFixed(4)} / ${dailyBudgetUsd.toFixed(2)} ({budgetPct.toFixed(0)}%)
        </p>
        <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${budgetColor}`}
            style={{ width: `${budgetPct}%` }}
          />
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-natural-border bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-natural-charcoal/60">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-natural-charcoal">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      {llmError && (
        <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-medium text-yellow-800">
          {llmError}
        </div>
      )}

      {llmStats && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-natural-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-natural-charcoal">Chi phí 7 ngày</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={llmStats.daily_costs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="cost_usd"
                  stroke="#4A6741"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#4A6741" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-natural-border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-natural-charcoal">Chi phí theo model</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={llmStats.cost_by_model}
                  dataKey="cost_usd"
                  nameKey="model"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ model }) => model.split("/").pop() ?? model}
                >
                  {llmStats.cost_by_model.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-natural-border bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="mb-4 text-lg font-bold text-natural-charcoal">
              Top người dùng theo tokens
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={llmStats.tokens_by_user}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="user_id"
                  tick={{ fontSize: 11 }}
                  stroke="#9CA3AF"
                  tickFormatter={(v) => v.slice(-6)}
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip />
                <Bar dataKey="tokens" fill="#6B8F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Chi phí LLM chi tiết ── */}
      {costStats && (
        <div className="mt-6 rounded-xl border border-natural-border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-natural-charcoal">Chi tiết chi phí LLM</h2>

          <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm font-medium text-natural-charcoal/60">
                Tổng chi phí (tháng {costStats.month})
              </p>
              <p className="mt-1 text-2xl font-bold text-natural-charcoal">
                ${costStats.total_cost_usd.toFixed(4)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-natural-charcoal/60">So với tháng trước</p>
              <p className="mt-1 text-2xl font-bold text-natural-charcoal">
                {costStats.previous_month != null
                  ? (() => {
                      const diff = costStats.total_cost_usd - costStats.previous_month!;
                      const pct =
                        costStats.previous_month! > 0
                          ? ((diff / costStats.previous_month!) * 100).toFixed(1)
                          : "—";
                      if (diff > 0) return `\u2191 +${pct}%`;
                      if (diff < 0) return `\u2193 ${pct}%`;
                      return "—";
                    })()
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-natural-charcoal/60">Số người dùng có chi phí</p>
              <p className="mt-1 text-2xl font-bold text-natural-charcoal">
                {costStats.total_users.toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

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
                      <span className="text-sm font-bold text-natural-charcoal/40">#{i + 1}</span>
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

        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-natural-charcoal/60">
              Model
            </label>
            <input
              type="text"
              value={llmFilter.model}
              onChange={(e) => setLlmFilter((f) => ({ ...f, model: e.target.value }))}
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
              onChange={(e) => setLlmFilter((f) => ({ ...f, user_id: e.target.value }))}
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
              onChange={(e) => setLlmFilter((f) => ({ ...f, status: e.target.value }))}
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
              onChange={(e) => setLlmFilter((f) => ({ ...f, date: e.target.value }))}
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
                        {(log.prompt_tokens ?? 0).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-natural-charcoal">
                        {(log.completion_tokens ?? 0).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-natural-charcoal">
                        ${(log.cost_usd ?? 0).toFixed(6)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-natural-charcoal">
                        {(log.latency_ms ?? 0).toLocaleString("vi-VN")}
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
