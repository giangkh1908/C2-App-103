"use client";

import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import AuthLayout from "@/components/auth/AuthLayout";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import Link from "next/link";

export default function ResetPasswordPage() {
  const t = useTranslations("auth.resetPassword");
  const searchParams = useSearchParams();
  const locale = useLocale();
  const token = searchParams.get("token");

  if (!token) {
    return (
      <AuthLayout title={t("title")} subtitle="">
        <div className="text-center space-y-4">
          <p className="text-sm text-red-500">{t("invalidToken")}</p>
          <Link href={`/${locale}/forgot-password`} className="text-[12px] font-bold text-natural-green hover:underline">
            {t("requestNewLink")}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("title")} subtitle={t("subtitle")}>
      <ResetPasswordForm token={token} />
    </AuthLayout>
  );
}
