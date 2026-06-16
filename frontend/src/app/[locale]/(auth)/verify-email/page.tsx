"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import AuthLayout from "@/components/auth/AuthLayout";
import Link from "next/link";
import Button from "@/components/ui/Button";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api/v1";

export default function VerifyEmailPage() {
  const t = useTranslations("auth.verifyEmail");
  const searchParams = useSearchParams();
  const locale = useLocale();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    fetch(`${API_URL}/auth/verify-email/confirm?token=${token}`)
      .then(async (res) => {
        if (res.ok) {
          setStatus("success");
          setMessage(t("successMessage"));
        } else {
          const data = await res.json().catch(() => null);
          setStatus("error");
          setMessage(data?.detail ?? t("errorMessage"));
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage(t("errorMessage"));
      });
  }, [token, t]);

  if (!token) {
    return (
      <AuthLayout title={t("title")} subtitle="">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center">
            <span className="text-2xl">❌</span>
          </div>
          <p className="text-sm text-natural-charcoal">{t("invalidToken")}</p>
          <Link href={`/${locale}/login`}>
            <Button>{t("goToLogin")}</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("title")} subtitle="">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <div className="w-16 h-16 mx-auto rounded-full bg-natural-border animate-pulse" />
        )}
        {status === "success" && (
          <div className="w-16 h-16 mx-auto rounded-full bg-natural-green-tint flex items-center justify-center">
            <span className="text-2xl">✅</span>
          </div>
        )}
        {status === "error" && (
          <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center">
            <span className="text-2xl">❌</span>
          </div>
        )}

        <p className="text-sm text-natural-charcoal">{message}</p>

        {status !== "loading" && (
          <Link href={`/${locale}/login`}>
            <Button>{t("goToLogin")}</Button>
          </Link>
        )}
      </div>
    </AuthLayout>
  );
}
