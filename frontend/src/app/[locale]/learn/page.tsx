import type { Metadata } from 'next';
import AIExplanationChat from '@/components/AIExplanationChat';
import Navbar from '@/components/landing/Navbar';

export const metadata: Metadata = {
  title: 'Mô phỏng học thử | Toán Trực Quan AI',
  description:
    'Hỏi gia sư AI về bất kỳ bài toán tiểu học nào. AI giải thích thân thiện, hỏi lại khi cần, và minh họa bằng hình ảnh trực quan khi thật sự cần thiết.',
};

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
