import type { Metadata } from 'next';

import SpeechEvalWorkbench from '@/components/speech/SpeechEvalWorkbench';
import Navbar from '@/components/landing/Navbar';

export const metadata: Metadata = {
  title: 'Speech Eval',
  description: 'Speech evaluation workbench for TTS and STT.',
};

export default function SpeechEvalPage() {
  return (
    <main className="min-h-screen bg-[#F6F2EA]">
      <Navbar />
      <SpeechEvalWorkbench />
    </main>
  );
}
