import type { Metadata } from 'next';
import AIExplanationChat from '@/components/AIExplanationChat';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Mô phỏng học thử | Toán Trực Quan AI',
  description:
    'Hỏi gia sư AI về bất kỳ bài toán tiểu học nào. AI giải thích thân thiện, hỏi lại khi cần, và minh họa bằng hình ảnh trực quan khi thật sự cần thiết.',
};

export default function LearnPage() {
  return (
    <main className="min-h-screen bg-natural-bg">
      {/* Top bar dẫn về trang chủ */}
      <div className="flex items-center justify-between border-b border-natural-border bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6">
        <Link href="/" className="flex items-center gap-2 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Toán Trực Quan AI"
            className="h-8 w-8 rounded-full shadow-md"
          />
          <div className="text-left">
            <span className="block font-serif text-sm font-bold italic leading-none text-natural-dark group-hover:text-natural-green transition-colors">
              Toán Trực Quan AI
            </span>
            <span className="block text-[9px] font-bold uppercase tracking-widest text-natural-green">
              Mô phỏng học thử
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
          <span className="hidden sm:block">Powered by DeepSeek · OpenRouter</span>
          <Link
            href="/"
            className="rounded-full border border-gray-200 px-3 py-1.5 text-gray-600 transition-all hover:border-natural-green/40 hover:text-natural-green"
          >
            ← Trang chủ
          </Link>
        </div>
      </div>

      {/* Chat container */}
      <div className="mx-auto max-w-4xl px-3 pt-4 pb-2 sm:px-6 sm:pt-5">
        <AIExplanationChat />
      </div>
    </main>
  );
}
