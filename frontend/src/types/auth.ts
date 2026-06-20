export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  verified: boolean;
  avatar?: string;
  planId: string;
  subscriptionStatus: "active" | "cancelled" | "expired";
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface TokenResponse {
  accessToken: string;
}

export interface PlanQuotas {
  chatTurns: number;
  ttsRequests: number;
  sttRequests: number;
  practiceExams: number;
}

export interface PlanFeatures {
  topics: string[];
  progressTracking: boolean;
  parentDashboard: boolean;
  multiAccounts: boolean;
}

export interface Plan {
  id: string;
  name: string;
  displayName: { vi: string; en: string };
  priceMonthly: number;
  priceYearly: number;
  quotas: PlanQuotas;
  features: PlanFeatures;
  sort_order?: number;
}

export interface UsageItem {
  remaining: number;
  limit: number;
  unlimited: boolean;
  used: number;
}

export interface UserUsage {
  plan: Plan | null;
  usage: {
    chatTurns: UsageItem;
    ttsRequests: UsageItem;
    sttRequests: UsageItem;
    practiceExams: UsageItem;
  };
}
