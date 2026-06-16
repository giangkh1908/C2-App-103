"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { getSafeRedirect } from "@/lib/redirect";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasShownToast = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !hasShownToast.current) {
      hasShownToast.current = true;
      toast.error("Vui lòng đăng nhập để tiếp tục.");
      const currentPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
      const safeRedirect = getSafeRedirect(currentPath, locale);
      router.replace(`/${locale}/login?redirectTo=${encodeURIComponent(safeRedirect)}`);
    }
  }, [isLoading, isAuthenticated, locale, router, pathname, searchParams]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-natural-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-natural-green border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
