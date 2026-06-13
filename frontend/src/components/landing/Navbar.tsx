"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b px-4 py-3.5 transition-all duration-300 sm:px-6 lg:px-8 ${
        scrolled
          ? "border-natural-border bg-white/90 shadow-xs backdrop-blur-md"
          : "border-natural-border bg-white/90 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <button
          type="button"
          className="flex cursor-pointer items-center gap-2"
          onClick={() => scrollTo("hero")}
        >
          <Image
            src="/logo.png"
            alt="Toan Truc Quan AI logo"
            width={36}
            height={36}
            className="rounded-full shadow-md shadow-natural-green/10"
          />
          <div className="text-left">
            <span className="block font-serif text-lg font-bold leading-none tracking-tight text-natural-dark italic">
              Toan Truc Quan AI
            </span>
            <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-widest text-natural-green">
              Visual Tutor Helper
            </span>
          </div>
        </button>

        <nav className="hidden items-center gap-7 text-[13px] font-bold text-natural-charcoal/80 md:flex">
          <button
            type="button"
            onClick={() => scrollTo('loi-ich')}
            className="cursor-pointer transition-colors hover:text-natural-green"
          >
            Loi ich cot loi
          </button>
          <Link
            href="/learn"
            className="cursor-pointer transition-colors hover:text-natural-orange text-natural-orange/90 flex items-center gap-1.5"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-natural-orange animate-pulse" />
            Mo phong hoc thu
          </Link>
          <button
            type="button"
            onClick={() => scrollTo('lo-trinh')}
            className="cursor-pointer transition-colors hover:text-natural-green"
          >
            Lo trinh lop 1-5
          </button>
          <button
            type="button"
            onClick={() => scrollTo('cau-hoi')}
            className="cursor-pointer transition-colors hover:text-natural-green"
          >
            Cau hoi thuong gap
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[13px] font-bold text-natural-charcoal transition-colors hover:text-natural-green"
          >
            Dang nhap
          </Link>
          <Link
            href="/learn"
            className="rounded-full bg-natural-green px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-natural-green/5 transition-all hover:bg-natural-green-hover active:scale-97"
          >
            Hoc thu ngay
          </Link>
        </div>
      </div>
    </header>
  );
}
