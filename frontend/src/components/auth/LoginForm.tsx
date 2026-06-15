"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function LoginForm() {
  const t = useTranslations("auth.login");
  const tAuth = useTranslations("auth");
  const tErr = useTranslations("auth.errors");
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState<LoginInput>({ email: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof LoginInput) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginInput;
        const key = issue.message as Parameters<typeof tErr>[0];
        fieldErrors[field] = tErr(key) || key;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await login(form.email, form.password);
    if (error) {
      setServerError(error);
    } else {
      router.push("/");
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
        autoComplete="current-password"
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded border-natural-border text-natural-green focus:ring-natural-green/20 cursor-pointer"
          />
          <span className="text-[12px] text-natural-charcoal">{t("remember")}</span>
        </label>
        <Link href="/forgot-password" className="text-[12px] font-medium text-natural-green hover:underline">
          {t("forgot")}
        </Link>
      </div>

      <Button type="submit" loading={loading} className="w-full">
        {t("submit")}
      </Button>

      <p className="text-center text-[12px] text-natural-charcoal">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-bold text-natural-green hover:underline">
          {t("registerLink")}
        </Link>
      </p>
    </form>
  );
}
