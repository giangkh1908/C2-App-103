"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getMyUsage } from "@/lib/planApi";
import type { UserUsage } from "@/types/auth";
import { MessageSquare, AlertCircle, Loader2 } from "lucide-react";

export default function UsageCounter({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const { apiFetch, isAuthenticated } = useAuth();
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const prevTriggerRef = useRef(0);

  // Fetch 1 lần khi mount
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getMyUsage(apiFetch)
      .then((data) => {
        if (!cancelled) setUsage(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [apiFetch, isAuthenticated]);

  // Khi chat thành công (trigger tăng), giảm số local thay vì fetch API
  useEffect(() => {
    if (refreshTrigger > 0 && refreshTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = refreshTrigger;
      
      setUsage((prev) => {
        if (!prev?.usage?.chatTurns) return prev;
        
        const chatTurns = prev.usage.chatTurns;
        if (chatTurns.unlimited || chatTurns.remaining <= 0) return prev;
        
        return {
          ...prev,
          usage: {
            ...prev.usage,
            chatTurns: {
              ...chatTurns,
              remaining: chatTurns.remaining - 1,
              used: chatTurns.used + 1,
            },
          },
        };
      });
    }
  }, [refreshTrigger]);

  if (!isAuthenticated) return null;

  if (loading && !usage) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      </div>
    );
  }

  const chatUsage = usage?.usage?.chatTurns;

  if (!chatUsage) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-natural-green/10 px-3 py-1 text-xs font-bold text-natural-green">
        <MessageSquare className="h-3.5 w-3.5" />
        <span>Free</span>
      </div>
    );
  }

  if (chatUsage.unlimited) {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-natural-green/10 px-3 py-1 text-xs font-bold text-natural-green">
        <MessageSquare className="h-3.5 w-3.5" />
        <span>Unlimited</span>
      </div>
    );
  }

  const isLow = chatUsage.remaining <= 2;
  const isEmpty = chatUsage.remaining === 0;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all duration-300 ${
        isEmpty
          ? "bg-red-100 text-red-600"
          : isLow
          ? "bg-orange-100 text-orange-600"
          : "bg-natural-green/10 text-natural-green"
      }`}
      title={`Còn lại ${chatUsage.remaining}/${chatUsage.limit} lượt trong 24h qua`}
    >
      {isEmpty ? (
        <AlertCircle className="h-3.5 w-3.5" />
      ) : (
        <MessageSquare className="h-3.5 w-3.5" />
      )}
      <span>
        {chatUsage.remaining}/{chatUsage.limit}
      </span>
    </div>
  );
}
