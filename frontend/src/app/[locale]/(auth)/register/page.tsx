import { useTranslations } from "next-intl";
import AuthLayout from "@/components/auth/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  const t = useTranslations("auth.register");

  return (
    <AuthLayout title={t("title")} subtitle={t("subtitle")}>
      <RegisterForm />
    </AuthLayout>
  );
}
