import type { Metadata } from 'next';
import Navbar from '@/components/landing/Navbar';
import Sandbox from '@/components/landing/Sandbox';

export const metadata: Metadata = {
  title: 'Luyện tập | Toán Trực Quan AI',
  description:
    'Luyện tập Toán tiểu học qua mô phỏng trực quan, câu hỏi nhanh và phản hồi tức thì.',
};

export default function PracticePage() {
  return (
    <main className="min-h-screen bg-natural-bg">
      <Navbar />
      <Sandbox />
    </main>
  );
}
