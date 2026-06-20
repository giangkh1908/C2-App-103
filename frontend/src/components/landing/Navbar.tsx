"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import LocaleSwitcher from "@/components/ui/LocaleSwitcher";

export default function Navbar() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const homePath = `/${locale}`;
  const learnPath = `${homePath}/learn`;
  const practicePath = `${homePath}/practice`;
  const pricingPath = `${homePath}/pricing`;
  const loginPath = `${homePath}/login`;
  const faqPath = `${homePath}/faq`;
  const normalizedPathname = pathname.replace(/\/$/, "") || "/";
  const isHomeActive = normalizedPathname === homePath || normalizedPathname === "/";
  const isActivePath = (path: string) =>
    normalizedPathname === path || normalizedPathname.startsWith(`${path}/`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b px-4 py-3.5 transition-all duration-300 sm:px-6 lg:px-8 ${
        scrolled
          ? "border-natural-border bg-white/90 shadow-xs backdrop-blur-md"
          : "border-natural-border bg-white/90 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link
          href={homePath}
          className="flex cursor-pointer items-center gap-2"
        >
          <Image
            src="/logo.webp"
            alt={`${tCommon("brand")} logo`}
            width={36}
            height={36}
            className="rounded-full shadow-md shadow-natural-green/10"
          />
          <div className="text-left">
            <span className="block text-lg font-bold leading-none tracking-tight text-natural-dark italic">
              {tCommon("brand")}
            </span>
            <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-widest text-natural-green">
              {tCommon("brandSubtitle")}
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 text-[13px] font-bold text-natural-charcoal/80 md:flex">
          <Link
            href={homePath}
            className={`cursor-pointer transition-colors hover:text-natural-green ${
              isHomeActive ? "text-natural-green" : ""
            }`}
          >
            {t("home")}
          </Link>
          <Link
            href={learnPath}
            className={`flex cursor-pointer items-center gap-1.5 transition-colors hover:text-natural-orange ${
              isActivePath(learnPath) ? "text-natural-orange" : ""
            }`}
          >
            {isActivePath(learnPath) && (
              <span className="inline-block h-2 w-2 rounded-full bg-natural-orange animate-pulse" />
            )}
            {t("learn")}
          </Link>
          <Link
            href={practicePath}
            className={`cursor-pointer transition-colors hover:text-natural-green ${
              isActivePath(practicePath) ? "text-natural-green" : ""
            }`}
          >
            {t("practice")}
          </Link>
          <Link
            href={pricingPath}
            className={`cursor-pointer transition-colors hover:text-natural-green ${
              isActivePath(pricingPath) ? "text-natural-green" : ""
            }`}
          >
            {t("pricing")}
          </Link>
          <Link
            href={faqPath}
            className={`cursor-pointer transition-colors hover:text-natural-green ${
              isActivePath(faqPath) ? "text-natural-green" : ""
            }`}
          >
            {t("faq")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />

          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-natural-border animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex cursor-pointer items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition-colors hover:bg-natural-bg"
              >
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name ?? "User"}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-natural-green text-xs font-bold text-white">
                    {(user.name ?? user.email ?? "U")[0].toUpperCase()}
                  </div>
                )}
                <span className="hidden max-w-[120px] truncate text-[12px] font-bold text-natural-charcoal sm:block">
                  {user.name ?? user.email}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-natural-border bg-white py-2 shadow-lg">
                  <Link
                    href={learnPath}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-[12px] font-bold text-natural-charcoal transition-colors hover:bg-natural-bg"
                  >
                    {t("dashboard")}
                  </Link>
                  <Link
                    href={pricingPath}
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-[12px] font-bold text-natural-charcoal transition-colors hover:bg-natural-bg"
                  >
                    {t("pricing")}
                  </Link>
                  <div className="my-1 border-t border-natural-border" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="block w-full cursor-pointer px-4 py-2 text-left text-[12px] font-bold text-red-500 transition-colors hover:bg-red-50"
                  >
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href={loginPath}
                className="text-[13px] font-bold text-natural-charcoal transition-colors hover:text-natural-green"
              >
                {t("login")}
              </Link>
              <Link
                href={learnPath}
                className="rounded-full bg-natural-green px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-natural-green/5 transition-all hover:bg-natural-green-hover active:scale-97"
              >
                {t("cta")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
