import { getTranslations } from "next-intl/server";
import ScrollReveal from "@/components/shared/ScrollReveal";

const reviews = [
  { avatar: "👩‍👦", textKey: "review1Text", authorKey: "review1Author" },
  { avatar: "🏫", textKey: "review2Text", authorKey: "review2Author" },
  { avatar: "👨‍👧", textKey: "review3Text", authorKey: "review3Author" },
];

export default async function Testimonials() {
  const t = await getTranslations("testimonials");
  const tCommon = await getTranslations("common");

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-natural-bg border-b border-natural-border">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-xl mx-auto mb-11">
            <h2 className="text-3xl font-serif italic text-natural-dark">
              {t("title")}
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-natural-charcoal/85 max-w-md mx-auto">
              {t("description")}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rv, i) => (
            <ScrollReveal key={rv.textKey} delay={i * 150}>
              <div className="bg-white p-6 rounded-3xl border border-natural-border text-left flex flex-col justify-between shadow-xs h-full">
                <p className="text-[12px] sm:text-[13px] text-natural-charcoal/90 italic leading-relaxed">
                  &ldquo;{t(rv.textKey as "review1Text" | "review2Text" | "review3Text")}&rdquo;
                </p>
                <div className="mt-5 pt-4 border-t border-natural-bg flex items-center gap-3">
                  <span className="text-2xl bg-natural-green-tint w-10 h-10 rounded-full flex items-center justify-center border border-natural-green/10 shrink-0">
                    {rv.avatar}
                  </span>
                  <div>
                    <h5 className="text-[10px] sm:text-[11px] font-black text-natural-dark leading-none mb-1">
                      {t(rv.authorKey as "review1Author" | "review2Author" | "review3Author")}
                    </h5>
                    <span className="text-[9px] text-natural-green font-bold uppercase tracking-widest block">
                      {tCommon("verified")}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
