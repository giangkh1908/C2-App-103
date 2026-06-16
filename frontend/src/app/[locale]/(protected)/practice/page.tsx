import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Navbar from '@/components/landing/Navbar';
import Sandbox from '@/components/landing/Sandbox';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('practiceTitle'),
    description: t('practiceDescription'),
  };
}

export default async function PracticePage() {
  return (
    <main className="min-h-screen bg-natural-bg">
      <Navbar />
      <Sandbox />
    </main>
  );
}
