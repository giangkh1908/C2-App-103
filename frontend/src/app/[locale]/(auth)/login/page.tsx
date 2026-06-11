import { useTranslations } from "next-intl";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  const t = useTranslations("auth.login");

  return (
    <AuthLayout title={t("title")} subtitle={t("subtitle")}>
      <LoginForm />
    </AuthLayout>
  );
}
