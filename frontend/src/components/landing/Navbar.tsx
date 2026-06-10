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
            alt="Toán Trực Quan AI logo"
            width={36}
            height={36}
            className="rounded-full shadow-md shadow-natural-green/10"
          />
          <div>
            <span className="font-serif italic font-bold text-lg text-natural-dark tracking-tight block leading-none">
              Toán Trực Quan AI
            </span>
            <span className="text-[9px] font-bold text-natural-green tracking-widest block mt-0.5 uppercase">
              Visual Tutor Helper
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-7 text-[13px] font-bold text-natural-charcoal/80">
          <button onClick={() => scrollTo("loi-ich")} className="hover:text-natural-green transition-colors cursor-pointer">
            Lợi ích cốt lõi
          </button>
          <button onClick={() => scrollTo("hoc-thu")} className="hover:text-natural-green transition-colors cursor-pointer">
            Mô phỏng học thử
          </button>
          <button onClick={() => scrollTo("lo-trinh")} className="hover:text-natural-green transition-colors cursor-pointer">
            Lộ trình lớp 1-5
          </button>
          <button onClick={() => scrollTo("cau-hoi")} className="hover:text-natural-green transition-colors cursor-pointer">
            Câu hỏi thường gặp
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[13px] font-bold text-natural-charcoal hover:text-natural-green transition-colors"
          >
            Đăng nhập
          </Link>
          <button
            onClick={() => scrollTo("hoc-thu")}
            className="rounded-full bg-natural-green hover:bg-natural-green-hover transition-all text-white font-bold text-xs py-2.5 px-5 cursor-pointer shadow-md shadow-natural-green/5 active:scale-97"
          >
            Học thử ngay
          </button>
        </div>
      </div>
    </header>
  );
}
