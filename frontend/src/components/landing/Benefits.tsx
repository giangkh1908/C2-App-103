import { getTranslations } from "next-intl/server";
import ScrollReveal from "@/components/shared/ScrollReveal";

export default async function Benefits() {
  const t = await getTranslations("benefits");

  const benefits = [
    {
      icon: "💡",
      title: t("card1Title"),
      desc: t("card1Desc"),
      tag: t("card1Tag"),
    },
    {
      icon: "🍓",
      title: t("card2Title"),
      desc: t("card2Desc"),
      tag: t("card2Tag"),
    },
    {
      icon: "🔊",
      title: t("card3Title"),
      desc: t("card3Desc"),
      tag: t("card3Tag"),
    },
  ];

  return (
    <section id="loi-ich" className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-natural-border">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-serif italic font-medium tracking-tight text-natural-dark sm:text-4xl">
              {t("badge")} <br />
              <span className="text-natural-green font-semibold">{t("badgeHighlight")}</span>
            </h2>
            <p className="mt-3 text-natural-charcoal max-w-2xl mx-auto text-sm opacity-90">
              {t("description")}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 150}>
              <div className="p-6 rounded-3xl border border-natural-border bg-natural-bg/40 text-left flex flex-col justify-between group transition-all duration-150 ease-out hover:-translate-y-1 hover:border-natural-green h-full">
                <div>
                  <span className="text-3xl bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs border border-emerald-100 mb-5 inline-flex">
                    {item.icon}
                  </span>
                  <h3 className="text-base font-bold text-natural-dark group-hover:text-natural-green transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-natural-charcoal/80 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/55 flex items-center justify-between text-xs font-bold text-natural-green">
                  <span>{item.tag}</span>
                  <span>→</span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
