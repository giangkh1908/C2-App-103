"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function GoogleSignInButton() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { googleLogin } = useAuth();
  const btnRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredential = useCallback(
    async (response: { credential: string }) => {
      setError(null);
      const { error } = await googleLogin(response.credential);
      if (error) {
        setError(error);
      } else {
        router.push("/");
        router.refresh();
      }
    },
    [googleLogin, router]
  );

  useEffect(() => {
    if (!clientId || initialized.current) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      setError("Failed to load Google SDK");
    };

    script.onload = () => {
      if (window.google && btnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredential,
          });
          window.google.accounts.id.renderButton(btnRef.current, {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "continue_with",
            shape: "pill",
          });
          initialized.current = true;
          setSdkLoaded(true);
        } catch {
          setError("Google OAuth configuration error");
        }
      }
    };

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [clientId, handleCredential]);

  // No client ID configured - show disabled button
  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        className="w-full flex items-center justify-center gap-3 rounded-full border border-natural-border bg-gray-50 py-3 px-6 text-sm font-bold text-gray-400 cursor-not-allowed"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#9CA3AF"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#9CA3AF"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#9CA3AF"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#9CA3AF"/>
        </svg>
        {t("googleButton")}
      </button>
    );
  }

  return (
    <div className="w-full">
      <div ref={btnRef} className="w-full flex justify-center [&>div]:!w-full [&>iframe]:!w-full" />
      {!sdkLoaded && !error && (
        <div className="w-full flex items-center justify-center gap-3 rounded-full border border-natural-border bg-white py-3 px-6 text-sm font-bold text-natural-dark animate-pulse">
          <div className="w-5 h-5 rounded-full bg-gray-200" />
          <div className="w-24 h-4 bg-gray-200 rounded" />
        </div>
      )}
      {error && (
        <div className="w-full flex items-center justify-center gap-3 rounded-full border border-red-200 bg-red-50 py-3 px-6 text-sm font-bold text-red-500">
          <span>⚠️</span>
          <span className="text-xs">{error}</span>
        </div>
      )}
    </div>
  );
}
