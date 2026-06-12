"use client";

import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer className="bg-natural-dark text-natural-border/80 py-12 px-4 sm:px-6 lg:px-8 border-t border-natural-border/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="font-serif italic font-bold text-lg text-white">
            {t("brand")} © {new Date().getFullYear()}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {t("tagline")}
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-7 text-[11px] font-bold">
          <button onClick={() => scrollTo("hero")} className="hover:text-white transition-colors cursor-pointer">
            {t("top")}
          </button>
          <button onClick={() => scrollTo("loi-ich")} className="hover:text-white transition-colors cursor-pointer">
            {t("benefits")}
          </button>
          <button onClick={() => scrollTo("hoc-thu")} className="hover:text-white transition-colors cursor-pointer">
            {t("sandbox")}
          </button>
          <button onClick={() => scrollTo("lo-trinh")} className="hover:text-white transition-colors cursor-pointer">
            {t("roadmap")}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-7 text-center">
        <p className="text-[10px] text-gray-500 leading-relaxed font-mono">
          {t("copyright")}
        </p>
      </div>
    </footer>
  );
}
