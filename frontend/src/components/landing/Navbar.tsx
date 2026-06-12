"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import LocaleSwitcher from "@/components/ui/LocaleSwitcher";

export default function Navbar() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b py-3.5 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md border-natural-border shadow-xs"
          : "bg-white/90 backdrop-blur-md border-natural-border"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => scrollTo("hero")}
        >
          <Image
            src="/logo.png"
            alt={`${tCommon("brand")} logo`}
            width={36}
            height={36}
            className="rounded-full shadow-md shadow-natural-green/10"
          />
          <div>
            <span className="font-serif italic font-bold text-lg text-natural-dark tracking-tight block leading-none">
              {tCommon("brand")}
            </span>
            <span className="text-[9px] font-bold text-natural-green tracking-widest block mt-0.5 uppercase">
              {tCommon("brandSubtitle")}
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-[13px] font-bold text-natural-charcoal/80">
          <button onClick={() => scrollTo("loi-ich")} className="hover:text-natural-green transition-colors cursor-pointer">
            {t("benefits")}
          </button>
          <button onClick={() => scrollTo("hoc-thu")} className="hover:text-natural-green transition-colors cursor-pointer">
            {t("sandbox")}
          </button>
          <button onClick={() => scrollTo("lo-trinh")} className="hover:text-natural-green transition-colors cursor-pointer">
            {t("roadmap")}
          </button>
          <button onClick={() => scrollTo("cau-hoi")} className="hover:text-natural-green transition-colors cursor-pointer">
            {t("faq")}
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />

          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-natural-border animate-pulse" />
          ) : isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 hover:bg-natural-bg transition-colors cursor-pointer"
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
                  <div className="w-7 h-7 rounded-full bg-natural-green flex items-center justify-center text-white text-xs font-bold">
                    {(user.name ?? user.email ?? "U")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-[12px] font-bold text-natural-charcoal hidden sm:block max-w-[100px] truncate">
                  {user.name ?? user.email}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border border-natural-border shadow-lg py-2 z-50">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-[12px] font-bold text-natural-charcoal hover:bg-natural-bg transition-colors"
                  >
                    {t("dashboard")}
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-[12px] font-bold text-natural-charcoal hover:bg-natural-bg transition-colors"
                  >
                    {t("profile")}
                  </Link>
                  <div className="border-t border-natural-border my-1" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="block w-full text-left px-4 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[13px] font-bold text-natural-charcoal hover:text-natural-green transition-colors"
              >
                {t("login")}
              </Link>
              <button
                onClick={() => scrollTo("hoc-thu")}
                className="rounded-full bg-natural-green hover:bg-natural-green-hover transition-all text-white font-bold text-xs py-2.5 px-5 cursor-pointer shadow-md shadow-natural-green/5 active:scale-97"
              >
                {t("cta")}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
