import AuthLayout from "@/components/auth/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Đăng ký",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Tạo tài khoản mới"
      subtitle="Bắt đầu hành trình học Toán trực quan cho con"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
