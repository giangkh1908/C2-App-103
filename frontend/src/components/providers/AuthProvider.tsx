"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AuthResponse, TokenResponse, User } from "@/types/auth";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api/v1";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ error?: string }>;
  googleLogin: (credential: string) => Promise<{ error?: string }>;
  logout: () => void;
  apiFetch: (path: string, options?: RequestInit) => Promise<Response>;
  forgotPassword: (email: string) => Promise<{ error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ error?: string }>;
  verifyEmail: () => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);
  const refreshing = useRef<Promise<string | null> | null>(null);

  const clearAuth = useCallback(() => {
    setUser(null);
    accessTokenRef.current = null;
  }, []);

  const saveAuth = useCallback((data: AuthResponse) => {
    setUser(data.user);
    accessTokenRef.current = data.accessToken;
  }, []);

  const doRefresh = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        clearAuth();
        return null;
      }

      const data: TokenResponse = await res.json();
      accessTokenRef.current = data.accessToken;
      return data.accessToken;
    } catch {
      clearAuth();
      return null;
    }
  }, [clearAuth]);

  const apiFetch = useCallback(
    async (path: string, options: RequestInit = {}): Promise<Response> => {
      const doFetch = async (token: string | null) =>
        fetch(`${API_URL}${path}`, {
          ...options,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
          },
        });

      let res = await doFetch(accessTokenRef.current);

      if (res.status === 401 || res.status === 403) {
        if (!refreshing.current) {
          refreshing.current = doRefresh();
        }

        const newToken = await refreshing.current;
        refreshing.current = null;

        if (newToken) {
          res = await doFetch(newToken);
        }
      }

      return res;
    },
    [doRefresh],
  );

  useEffect(() => {
    let cancelled = false;

    const hydrateSession = async () => {
      const token = await doRefresh();
      if (!token || cancelled) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok && !cancelled) {
          const currentUser: User = await res.json();
          setUser(currentUser);
        } else if (!cancelled) {
          clearAuth();
        }
      } catch {
        if (!cancelled) clearAuth();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [clearAuth, doRefresh]);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout network errors; local state is still cleared.
    }
    clearAuth();
  }, [apiFetch, clearAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          return { error: data?.detail ?? "Login failed" };
        }

        const data: AuthResponse = await res.json();
        saveAuth(data);
        return {};
      } catch {
        return { error: "Network error" };
      }
    },
    [saveAuth],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        const res = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          return { error: data?.detail ?? "Registration failed" };
        }

        const data: AuthResponse = await res.json();
        saveAuth(data);
        return {};
      } catch {
        return { error: "Network error" };
      }
    },
    [saveAuth],
  );

  const googleLogin = useCallback(
    async (credential: string) => {
      try {
        const res = await fetch(`${API_URL}/auth/google`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          return { error: data?.detail ?? "Google login failed" };
        }

        const data: AuthResponse = await res.json();
        saveAuth(data);
        return {};
      } catch {
        return { error: "Network error" };
      }
    },
    [saveAuth],
  );

  const forgotPassword = useCallback(async (email: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        return { error: data?.detail ?? "Request failed" };
      }

      return {};
    } catch {
      return { error: "Network error" };
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        return { error: data?.detail ?? "Reset failed" };
      }

      return {};
    } catch {
      return { error: "Network error" };
    }
  }, []);

  const verifyEmail = useCallback(async () => {
    try {
      const res = await apiFetch("/auth/verify-email", { method: "POST" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        return { error: data?.detail ?? "Request failed" };
      }

      return {};
    } catch {
      return { error: "Network error" };
    }
  }, [apiFetch]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login,
        register,
        googleLogin,
        logout,
        apiFetch,
        forgotPassword,
        resetPassword,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
