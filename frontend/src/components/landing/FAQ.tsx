"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ScrollReveal from "@/components/shared/ScrollReveal";

export default function FAQ() {
  const t = useTranslations("faq");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    { q: t("q1"), a: t("a1") },
    { q: t("q2"), a: t("a2") },
    { q: t("q3"), a: t("a3") },
    { q: t("q4"), a: t("a4") },
  ];

  return (
    <section id="cau-hoi" className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-natural-border">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-11">
            <h2 className="text-3xl font-serif italic text-natural-dark">
              {t("title")}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              {t("description")}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div className="space-y-3">
            {faqs.map((faq, fIdx) => {
              const isOpen = activeFaq === fIdx;
              return (
                <div
                  key={fIdx}
                  className="border border-natural-border bg-natural-bg/30 rounded-2xl overflow-hidden transition-all text-left"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : fIdx)}
                    className="w-full flex items-center justify-between p-5 font-semibold text-xs sm:text-sm text-natural-dark hover:bg-natural-bg transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <svg
                      className={`h-4 w-4 text-slate-400 transition-transform duration-300 shrink-0 ml-4 ${isOpen ? "rotate-180 text-natural-green" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    <div className="border-t border-natural-border bg-white p-5 text-xs text-natural-charcoal/95 leading-relaxed">
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
