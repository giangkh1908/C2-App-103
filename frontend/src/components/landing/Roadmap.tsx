import { getTranslations } from "next-intl/server";
import ScrollReveal from "@/components/shared/ScrollReveal";

export default async function Roadmap() {
  const t = await getTranslations("roadmap");

  const milestones = [
    {
      grade: t("grade1Title"),
      title: t("grade1Subtitle"),
      color: "border-emerald-100 bg-emerald-50/25",
      desc: t("grade1Desc"),
    },
    {
      grade: t("grade2Title"),
      title: t("grade2Subtitle"),
      color: "border-amber-100 bg-amber-50/25",
      desc: t("grade2Desc"),
    },
    {
      grade: t("grade3Title"),
      title: t("grade3Subtitle"),
      color: "border-orange-100 bg-orange-50/25",
      desc: t("grade3Desc"),
    },
    {
      grade: t("grade4Title"),
      title: t("grade4Subtitle"),
      color: "border-sky-100 bg-sky-50/25",
      desc: t("grade4Desc"),
    },
    {
      grade: t("grade5Title"),
      title: t("grade5Subtitle"),
      color: "border-purple-100 bg-purple-50/25",
      desc: t("grade5Desc"),
    },
  ];

  return (
    <section id="lo-trinh" className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-natural-border">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-natural-orange text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-2 font-mono">
              {t("badge")}
            </span>
            <h2 className="text-3xl italic text-natural-dark leading-tight">
              {t("title")}
            </h2>
            <p className="mt-3 text-sm text-natural-charcoal/80 leading-relaxed">
              {t("description")}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {milestones.map((m, i) => (
            <ScrollReveal key={m.grade} delay={i * 100}>
              <div
                className={`p-5 rounded-2xl border border-natural-border text-left flex flex-col justify-between h-56 transition-all duration-150 ease-out hover:-translate-y-1 hover:border-natural-green/40 ${m.color}`}
              >
                <div>
                  <span className="text-xs font-black tracking-widest text-natural-green uppercase bg-white px-2.5 py-0.5 rounded-md border border-natural-border inline-block mb-3.5">
                    {m.grade}
                  </span>
                  <h4 className="text-sm font-bold text-natural-dark mb-2 leading-snug">
                    {m.title}
                  </h4>
                  <p className="text-[11px] text-natural-charcoal/75 leading-relaxed">{m.desc}</p>
                </div>
                <div className="h-1 bg-natural-border rounded-full w-2/3 mt-3 overflow-hidden">
                  <div className="h-full bg-natural-green w-3/4 rounded-full" />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
