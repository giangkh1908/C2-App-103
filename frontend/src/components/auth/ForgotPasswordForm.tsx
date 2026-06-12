"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const tErr = useTranslations("auth.errors");
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setEmailError(null);

    if (!email.trim()) {
      setEmailError(tErr("emailRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError(tErr("emailInvalid"));
      return;
    }

    setLoading(true);
    const { error } = await forgotPassword(email);
    if (error) {
      setServerError(error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-natural-green-tint flex items-center justify-center">
          <span className="text-2xl">📧</span>
        </div>
        <p className="text-sm text-natural-charcoal">{t("successMessage")}</p>
        <Link href="/login" className="text-[12px] font-bold text-natural-green hover:underline">
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-[12px] text-red-600 font-medium">
          {serverError}
        </div>
      )}

      <Input
        label={t("email")}
        type="email"
        placeholder={t("emailPlaceholder")}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setEmailError(null);
          setServerError(null);
        }}
        error={emailError ?? undefined}
        autoComplete="email"
      />

      <Button type="submit" loading={loading} className="w-full">
        {t("submit")}
      </Button>

      <p className="text-center text-[12px] text-natural-charcoal">
        <Link href="/login" className="font-bold text-natural-green hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}
