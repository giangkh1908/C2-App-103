"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function LoginForm() {
  const t = useTranslations("auth.login");
  const tAuth = useTranslations("auth");
  const tErr = useTranslations("auth.errors");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) {
      newErrors.email = tErr("emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = tErr("emailInvalid");
    }
    if (!password) {
      newErrors.password = tErr("passwordRequired");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    // TODO: Gọi API backend khi có
    console.log("Login:", { email, password, remember });
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <GoogleSignInButton />

      {/* Divider */}
      <div className="relative flex items-center justify-center py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-natural-border" />
        </div>
        <span className="relative bg-white px-4 text-[12px] text-natural-charcoal">
          {tAuth("orDivider")}
        </span>
      </div>

      <Input
        label={t("email")}
        type="email"
        placeholder={t("emailPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        autoComplete="email"
      />

      <PasswordInput
        label={t("password")}
        placeholder={t("passwordPlaceholder")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
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
        <Link href="#" className="text-[12px] font-medium text-natural-green hover:underline">
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
