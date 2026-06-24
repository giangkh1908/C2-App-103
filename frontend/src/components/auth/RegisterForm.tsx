"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { getSafeRedirect } from "@/lib/redirect";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function RegisterForm() {
  const t = useTranslations("auth.register");
  const tAuth = useTranslations("auth");
  const tErr = useTranslations("auth.errors");
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { register, isAuthenticated, isLoading } = useAuth();

  // Hooks phải được gọi trước mọi conditional return để tránh React error #300
  // ("Rendered more hooks than during the previous render").
  const [form, setForm] = useState<RegisterInput>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterInput, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(`/${locale}`);
    }
  }, [isLoading, isAuthenticated, locale, router]);

  if (isLoading) return null;
  if (isAuthenticated) return null;

  const handleChange = (field: keyof RegisterInput) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof RegisterInput, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RegisterInput;
        const key = issue.message as Parameters<typeof tErr>[0];
        fieldErrors[field] = tErr(key) || key;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await register(form.name, form.email, form.password);
    if (error) {
      setServerError(error);
    } else {
      const redirectTo = searchParams.get("redirectTo");
      router.replace(getSafeRedirect(redirectTo, locale));
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <GoogleSignInButton />

      <div className="relative flex items-center justify-center py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-natural-border" />
        </div>
        <span className="relative bg-white px-4 text-[12px] text-natural-charcoal">
          {tAuth("orDivider")}
        </span>
      </div>

      {serverError && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-[12px] text-red-600 font-medium">
          {serverError}
        </div>
      )}

      <Input
        label={t("name")}
        type="text"
        placeholder={t("namePlaceholder")}
        value={form.name}
        onChange={handleChange("name")}
        error={errors.name}
        autoComplete="name"
      />

      <Input
        label={t("email")}
        type="email"
        placeholder={t("emailPlaceholder")}
        value={form.email}
        onChange={handleChange("email")}
        error={errors.email}
        autoComplete="email"
      />

      <PasswordInput
        label={t("password")}
        placeholder={t("passwordPlaceholder")}
        value={form.password}
        onChange={handleChange("password")}
        error={errors.password}
        autoComplete="new-password"
      />

      <PasswordInput
        label={t("confirmPassword")}
        placeholder={t("confirmPasswordPlaceholder")}
        value={form.confirmPassword}
        onChange={handleChange("confirmPassword")}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />

      <Button type="submit" loading={loading} className="w-full">
        {t("submit")}
      </Button>

      <p className="text-center text-[12px] text-natural-charcoal">
        {t("hasAccount")}{" "}
        <Link href={`/${locale}/login`} className="font-bold text-natural-green hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}
