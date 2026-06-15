import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AIExplanationChat from '@/components/AIExplanationChat';
import Navbar from '@/components/landing/Navbar';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('learnTitle'),
    description: t('learnDescription'),
  };
}

export default async function LearnPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-natural-bg">
      <Navbar />
      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 px-3 py-3 sm:px-6 sm:py-5">
        <AIExplanationChat key={locale} />
      </div>
    </main>
  );
}
