"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "Dashboard", href: (locale: string) => `/${locale}/admin` },
  { label: "Thanh toán", href: (locale: string) => `/${locale}/admin/payments` },
  { label: "Người dùng", href: (locale: string) => `/${locale}/admin/users` },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? "vi";

  // Route guard: redirect non-admin users
  // - Not authenticated → /login?redirectTo=/admin (để login xong quay lại)
  // - Authenticated but not admin → home (không cho xem admin)
  // Inside useEffect to avoid React warning "Cannot update a component while
  // rendering a different component".
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(
        `/${locale}/login?redirectTo=${encodeURIComponent(`/${locale}/admin`)}`,
      );
      return;
    }
    if (!isAdmin) {
      router.replace(`/${locale}`);
    }
  }, [isLoading, isAuthenticated, isAdmin, locale, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-natural-bg">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-natural-green border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-natural-border bg-gray-50">
        <div className="px-6 py-6">
          <h1 className="text-xl font-bold text-natural-charcoal">Quản trị</h1>
        </div>
        <nav className="flex-1 px-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const href = item.href(locale);
              const isActive =
                pathname === href ||
                (href !== `/${locale}/admin` && pathname.startsWith(href));

              return (
                <li key={item.label}>
                  <Link
                    href={href}
                    className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-natural-green text-white"
                        : "text-natural-charcoal hover:bg-natural-green-tint"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-natural-bg p-6">{children}</main>
    </div>
  );
}
