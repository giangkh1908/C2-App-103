"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";

interface Props {
  token: string;
}

export default function ResetPasswordForm({ token }: Props) {
  const t = useTranslations("auth.resetPassword");
  const tErr = useTranslations("auth.errors");
  const { resetPassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setErrors({});

    const newErrors: typeof errors = {};
    if (!password) {
      newErrors.password = tErr("passwordRequired");
    } else if (password.length < 6) {
      newErrors.password = tErr("passwordMin");
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = tErr("passwordMismatch");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(token, password);
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
          <span className="text-2xl">✅</span>
        </div>
        <p className="text-sm text-natural-charcoal">{t("successMessage")}</p>
        <Link href="/login" className="inline-block">
          <Button>{t("goToLogin")}</Button>
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

      <PasswordInput
        label={t("newPassword")}
        placeholder={t("newPasswordPlaceholder")}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setErrors((prev) => ({ ...prev, password: undefined }));
        }}
        error={errors.password}
        autoComplete="new-password"
      />

      <PasswordInput
        label={t("confirmPassword")}
        placeholder={t("confirmPasswordPlaceholder")}
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
        }}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />

      <Button type="submit" loading={loading} className="w-full">
        {t("submit")}
      </Button>
    </form>
  );
}
