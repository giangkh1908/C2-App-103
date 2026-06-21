import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import PaymentClient from "./PaymentClient";
import type { PaymentBilling } from "@/types/payment";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ plan?: string; billing?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("paymentTitle"),
    description: t("paymentDescription"),
  };
}

const VALID_BILLINGS: PaymentBilling[] = ["monthly", "yearly"];

function parseBilling(raw: string | undefined): PaymentBilling | null {
  if (!raw) return null;
  return (VALID_BILLINGS as string[]).includes(raw)
    ? (raw as PaymentBilling)
    : null;
}

function parsePlan(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default async function PaymentPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { plan: rawPlan, billing: rawBilling } = await searchParams;
  const planName = parsePlan(rawPlan);
  const billing = parseBilling(rawBilling);

  // If neither plan nor billing is provided the client component will
  // surface a friendly error, so we don't 404 here.
  if (planName && !billing) {
    notFound();
  }

  return (
    <PaymentClient locale={locale} planName={planName} billing={billing} />
  );
}
