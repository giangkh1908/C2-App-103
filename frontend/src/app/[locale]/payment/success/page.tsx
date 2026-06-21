import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import Navbar from "@/components/landing/Navbar";
import PaymentSuccessClient from "./PaymentSuccessClient";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    plan?: string;
    billing?: string;
    paid_at?: string;
    expires_at?: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("paymentSuccessTitle"),
    description: t("paymentSuccessDescription"),
  };
}

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { plan, billing, paid_at, expires_at } = await searchParams;

  return (
    <main className="min-h-screen bg-natural-bg">
      <Navbar />
      <PaymentSuccessClient
        locale={locale}
        planName={plan ?? null}
        billing={billing === "monthly" || billing === "yearly" ? billing : null}
        paidAt={paid_at ?? null}
        expiresAt={expires_at ?? null}
      />
    </main>
  );
}
