import { Suspense } from "react";
import RequireAuth from "@/components/auth/RequireAuth";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-natural-bg">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-natural-green border-t-transparent" />
        </div>
      }
    >
      <RequireAuth>{children}</RequireAuth>
    </Suspense>
  );
}
