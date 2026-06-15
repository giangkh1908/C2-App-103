"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const t = useTranslations("common");

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col items-center justify-center px-4 py-10">
      {/* Back to home */}
      <Link
        href="/"
        className="flex items-center gap-1.5 text-[13px] font-bold text-natural-charcoal hover:text-natural-green transition-colors mb-6"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t("backToHome")}
      </Link>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <Image
          src="/logo.webp"
          alt={`${t("brand")} logo`}
          width={40}
          height={40}
          className="rounded-full"
        />
        <span className="font-serif italic font-bold text-xl text-natural-dark tracking-tight">
          {t("brand")}
        </span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="font-serif italic text-2xl sm:text-3xl text-natural-dark mb-1.5">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-natural-charcoal">
            {subtitle}
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-natural-border shadow-xs p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
