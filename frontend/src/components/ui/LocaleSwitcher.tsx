"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const LOCALES = [
  { code: "vi", label: "VI" },
  { code: "en", label: "EN" },
] as const;

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const switchLocale = (newLocale: string) => {
    if (pathname === "/") {
      router.push(`/${newLocale}`);
    } else {
      const segments = pathname.split("/");
      segments[1] = newLocale;
      router.push(segments.join("/"));
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[12px] font-bold text-natural-charcoal hover:text-natural-green transition-colors cursor-pointer px-2 py-1.5 rounded-lg hover:bg-natural-bg"
        aria-label="Switch language"
      >
        <span>{current.label}</span>
        <svg
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-natural-border rounded-xl shadow-lg py-1 min-w-[120px] z-50">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => switchLocale(l.code)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] font-bold cursor-pointer transition-colors ${
                l.code === locale
                  ? "text-natural-green bg-natural-green-tint"
                  : "text-natural-charcoal hover:bg-natural-bg"
              }`}
            >
              <span>{l.label}</span>
              {l.code === locale && (
                <svg className="h-3.5 w-3.5 text-natural-green ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
