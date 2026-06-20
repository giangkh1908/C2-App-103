import type { Plan, UserUsage } from "@/types/auth";

export async function getPlans(apiFetch: (path: string, options?: RequestInit) => Promise<Response>): Promise<Plan[]> {
  const res = await apiFetch("/plans/");
  if (!res.ok) throw new Error("Failed to fetch plans");
  const data = await res.json();
  return data.plans;
}

export async function getMyUsage(apiFetch: (path: string, options?: RequestInit) => Promise<Response>): Promise<UserUsage> {
  const res = await apiFetch("/user/usage");
  if (!res.ok) throw new Error("Failed to fetch usage");
  return res.json();
}
