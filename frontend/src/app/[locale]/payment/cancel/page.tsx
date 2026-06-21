import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { X } from "lucide-react";

import Navbar from "@/components/landing/Navbar";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("paymentCancelTitle"),
    description: t("paymentCancelDescription"),
  };
}

export default async function PaymentCancelPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "payment" });

  return (
    <main className="min-h-screen bg-natural-bg">
      <Navbar />
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:px-6">
        <div className="rounded-full bg-natural-bg p-4 text-natural-charcoal/60">
          <X className="h-12 w-12" />
        </div>

        <h1 className="mt-6 text-2xl font-bold text-natural-charcoal sm:text-3xl">
          {t("cancelTitle")}
        </h1>
        <p className="mt-2 text-sm text-natural-charcoal/70">
          {t("cancelHint")}
        </p>

        <Link
          href={`/${locale}/pricing`}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-natural-green px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-natural-green-hover"
        >
          {t("backToPricing")}
        </Link>
      </div>
    </main>
  );
}
