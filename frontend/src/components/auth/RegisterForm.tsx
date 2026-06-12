"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

export default function RegisterForm() {
  const t = useTranslations("auth.register");
  const tAuth = useTranslations("auth");
  const tErr = useTranslations("auth.errors");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = tErr("nameRequired");
    if (!email.trim()) {
      newErrors.email = tErr("emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = tErr("emailInvalid");
    }
    if (!password) {
      newErrors.password = tErr("passwordRequired");
    } else if (password.length < 6) {
      newErrors.password = tErr("passwordMin");
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = tErr("passwordMismatch");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    // TODO: Gọi API backend khi có
    console.log("Register:", { name, email, password });
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
        label={t("name")}
        type="text"
        placeholder={t("namePlaceholder")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoComplete="name"
      />

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
        autoComplete="new-password"
      />

      <PasswordInput
        label={t("confirmPassword")}
        placeholder={t("confirmPasswordPlaceholder")}
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />

      <Button type="submit" loading={loading} className="w-full">
        {t("submit")}
      </Button>

      <p className="text-center text-[12px] text-natural-charcoal">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-bold text-natural-green hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}
