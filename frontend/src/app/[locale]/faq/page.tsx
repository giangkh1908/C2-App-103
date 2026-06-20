import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";

import Navbar from "@/components/landing/Navbar";
import FaqContent from "@/components/faq/FaqContent";
import Footer from "@/components/landing/Footer";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("faqTitle"),
    description: t("faqDescription"),
  };
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "faq" });

  return (
    <div className="min-h-screen bg-natural-bg font-sans text-natural-charcoal antialiased">
      <Navbar />
      <main>
        <div className="pt-24 pb-8 text-center px-4">
          <h1 className="text-3xl italic text-natural-dark">
            {t("title")}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            {t("description")}
          </p>
        </div>
        <FaqContent showHeader={false} containerClass="pb-16 px-4 sm:px-6 lg:px-8" />
      </main>
      <Footer />
    </div>
  );
}
