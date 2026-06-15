"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ScrollReveal from "@/components/shared/ScrollReveal";
import { getAudioContext } from "@/lib/audio";

export default function Hero() {
  const t = useTranslations("hero");
  const [crunched, setCrunched] = useState(false);

  const playCrunch = () => {
    setCrunched(true);
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio sandbox safeguard
    }
    setTimeout(() => setCrunched(false), 300);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 px-4 sm:px-6 lg:px-8 border-b border-natural-border"
    >
      {/* Decorative blurs */}
      <div className="absolute top-12 right-12 -z-10 h-72 w-72 rounded-full bg-natural-green-tint opacity-60 blur-2xl" />
      <div className="absolute bottom-12 left-12 -z-10 h-64 w-64 rounded-full bg-natural-orange-tint opacity-60 blur-2xl" />

      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-12 items-center">
          {/* Hero Left */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <ScrollReveal>
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-natural-border text-natural-green rounded-full text-[10px] font-black uppercase tracking-wider mb-6 border border-natural-border">
                <span className="h-2 w-2 rounded-full bg-natural-green animate-pulse" />
                <span>{t("badge")}</span>
              </span>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <h1 className="italic text-4xl sm:text-5xl lg:text-6xl leading-[1.1] text-natural-dark font-medium">
                {t("headline1")} <span className="text-natural-orange font-semibold">{t("headline2")}</span> <br />
                {t("headline3")}
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="mt-6 text-base text-natural-charcoal leading-relaxed max-w-2xl opacity-90">
                <strong className="text-natural-dark">{t("descriptionBold")}</strong>{" "}
                {t("description")}
              </p>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="mt-6 space-y-3">
                {[
                  { icon: "🍓", text: t("feature1") },
                  { icon: "🎮", text: t("feature2") },
                  { icon: "🔊", text: t("feature3") },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-natural-charcoal">
                    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center border border-emerald-200 text-xs">
                      {item.icon}
                    </span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <div className="mt-8 flex flex-wrap gap-4 w-full">
                <button
                  onClick={() => scrollTo("hoc-thu")}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-natural-green hover:bg-natural-green-hover px-7 py-3.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-97 shrink-0"
                >
                  <span>{t("cta1")}</span>
                  <span aria-hidden="true">→</span>
                </button>
                <button
                  onClick={() => scrollTo("lo-trinh")}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-natural-border hover:bg-natural-bg px-7 py-3.5 text-sm font-bold text-natural-charcoal transition-all cursor-pointer active:scale-97"
                >
                  <span>{t("cta2")}</span>
                </button>
              </div>
            </ScrollReveal>
          </div>

          {/* Hero Right — Interactive Pizza Card */}
          <div className="lg:col-span-5 mt-12 lg:mt-0 relative flex justify-center">
            <ScrollReveal delay={300} animation="scaleIn">
              <div className="relative w-full max-w-sm rounded-[32px] border border-natural-border bg-white p-7 shadow-lg flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-natural-border pb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-natural-orange" />
                    <span className="h-3 w-3 rounded-full bg-natural-green" />
                    <span className="h-3 w-3 rounded-full bg-slate-200" />
                  </div>
                  <span className="rounded bg-natural-bg px-2.5 py-0.5 text-[9px] font-black text-natural-green uppercase tracking-wider border border-natural-border flex items-center gap-1">
                    <span className="animate-bounce text-xs">🧠</span>
                    <span>{t("visualBox")} 🍕</span>
                  </span>
                </div>

                <div className="my-auto py-6 flex flex-col items-center select-none">
                  <span className="text-[10px] font-mono font-black text-natural-orange uppercase tracking-wider mb-2">
                    {t("visualExample")}
                  </span>

                  <div
                    className={`relative h-28 w-28 flex items-center justify-center bg-natural-bg rounded-full p-2 border border-natural-border cursor-pointer transition-transform ${crunched ? "scale-95" : ""}`}
                    onClick={playCrunch}
                  >
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <path d="M50,50 L90,50 A40,40 0 0,1 50,90 Z" fill="#FF8C42" stroke="#ffffff" strokeWidth="1.5" />
                      <path d="M50,50 L50,90 A40,40 0 0,1 10,50 Z" fill="#FF8C42" stroke="#ffffff" strokeWidth="1.5" />
                      <path d="M50,50 L10,50 A40,40 0 0,1 50,10 Z" fill="#FF8C42" stroke="#ffffff" strokeWidth="1.5" />
                      <path d="M50,50 L50,10 A40,40 0 0,1 90,50 Z" fill="#E8E6D9" stroke="#fff" strokeWidth="1.5" />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center bg-white/95 rounded-full h-11 w-11 shadow-xs">
                      <span className="text-sm font-black text-natural-orange">3</span>
                      <div className="h-0.5 w-6 bg-slate-300 my-0.5" />
                      <span className="text-xs font-black text-slate-800">4</span>
                    </div>
                  </div>

                  <p className="mt-4 text-[10px] text-gray-500 font-bold">
                    {t("visualHint")}
                  </p>
                </div>

                <div className="rounded-[18px] bg-natural-bg p-3 text-left border border-natural-border">
                  <p className="text-[11px] text-natural-charcoal leading-relaxed">
                    💡 {t("visualExplanation")}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
