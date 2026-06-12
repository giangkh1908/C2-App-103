import { useTranslations } from "next-intl";
import AuthLayout from "@/components/auth/AuthLayout";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");

  return (
    <AuthLayout title={t("title")} subtitle={t("subtitle")}>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
