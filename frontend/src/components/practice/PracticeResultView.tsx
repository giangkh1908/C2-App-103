"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { DEFAULT_TTS_LOCALE } from "@/lib/speech";
import type { PracticeAttemptResult } from "@/types";

interface PracticeResultViewProps {
  result: PracticeAttemptResult;
  onBack: () => void;
}

function getResultSpeechCopy(locale: string) {
  if (locale === "vi") {
    return {
      listenExplanation: "Nghe giải thích",
      slow: "Đọc chậm",
      speaking: "Đang đọc...",
      unsupported: "Thiết bị này chưa hỗ trợ nghe giọng nói.",
    };
  }

  return {
    listenExplanation: "Listen to explanation",
    slow: "Slow",
    speaking: "Reading...",
    unsupported: "This device does not support text-to-speech.",
  };
}

function getSafeResultSpeechCopy(locale: string) {
  if (locale === "vi") {
    return {
      listenExplanation: "Nghe giải thích",
      slow: "Đọc chậm",
      speaking: "Đang đọc...",
      unsupported: "Thiết bị này chưa hỗ trợ nghe giọng nói.",
    };
  }

  return getResultSpeechCopy(locale);
}

export default function PracticeResultView({ result, onBack }: PracticeResultViewProps) {
  const locale = useLocale();
  const t = useTranslations("practice");
  const { apiFetch } = useAuth();
  const speechCopy = useMemo(() => getSafeResultSpeechCopy(locale), [locale]);
  const [activeNarrationKey, setActiveNarrationKey] = useState<string | null>(null);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const { isSupported, isSpeaking, speak, stop } = useTextToSpeech(DEFAULT_TTS_LOCALE, apiFetch);

  const handleSpeak = async (key: string, text: string, slow = false) => {
    if (!isSupported) {
      setSpeechNotice(speechCopy.unsupported);
      return;
    }
    if (activeNarrationKey === key && isSpeaking) {
      stop();
      setActiveNarrationKey(null);
      return;
    }
    setSpeechNotice(null);
    setActiveNarrationKey(key);
    await speak(text, { slow, maxChars: 320 });
    setActiveNarrationKey(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-[24px] border border-[#DED7C8] bg-white p-6 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#5A7A4B]">{t("result.badge")}</p>
          <h2 className="mt-3 text-3xl font-bold text-[#203049]">{result.exam_title}</h2>
          <p className="mt-3 text-sm leading-7 text-[#647068]">{t("result.description", { grade: result.grade })}</p>
        </div>

        <div className="rounded-[24px] border border-[#D7E1CD] bg-[#F4F8EE] p-6 text-center shadow-sm">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-[9px] border-[#E2ECD8] bg-white">
            <span className="text-3xl font-black text-[#203049]">{result.result_summary?.score ?? 0}</span>
          </div>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.16em] text-[#587849]">
            {t("result.score", { correct: result.result_summary?.correct_count ?? 0, total: result.result_summary?.total_count ?? 0 })}
          </p>
          {result.result_summary?.badge_label ? (
            <div className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-[#587849]">{result.result_summary.badge_label}</div>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        {result.questions.map((question, index) => (
          <motion.article
            key={question.question_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.025 }}
            className="rounded-[22px] border border-[#DED7C8] bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#203049]">{t("result.questionNumber", { number: index + 1 })}</p>
                <p className="mt-2 text-sm leading-7 text-[#2F3A34]">{question.question_text}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${question.is_correct ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {question.is_correct ? t("result.correct") : t("result.incorrect")}
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {question.choices.map((choice, choiceIndex) => {
                const selected = question.selected_choice_index === choiceIndex;
                const correct = question.correct_choice_index === choiceIndex;
                const className = correct
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : selected
                    ? "border-rose-300 bg-rose-50 text-rose-700"
                    : "border-[#E4DED0] bg-[#FCFAF5] text-[#4D5850]";
                return <div key={`${question.question_id}_${choiceIndex}`} className={`rounded-xl border px-4 py-3 text-sm ${className}`}>{choice}</div>;
              })}
            </div>

            <div className="mt-4 rounded-xl bg-[#F8F4EC] px-4 py-4 text-sm leading-7 text-[#58625A]">
              <span className="font-bold text-[#203049]">{t("result.explanation")}</span> {question.explanation}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleSpeak(`${question.question_id}:normal`, `${question.question_text}. ${question.explanation}`, false)}
                disabled={!isSupported && !isSpeaking}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D9D4C7] bg-white px-3 text-xs font-semibold text-[#59635C] transition hover:bg-[#FBF8F0] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {activeNarrationKey === `${question.question_id}:normal` && isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {activeNarrationKey === `${question.question_id}:normal` && isSpeaking ? speechCopy.speaking : speechCopy.listenExplanation}
              </button>
              <button
                type="button"
                onClick={() => void handleSpeak(`${question.question_id}:slow`, `${question.question_text}. ${question.explanation}`, true)}
                disabled={!isSupported && !isSpeaking}
                className="inline-flex min-h-10 items-center rounded-xl border border-[#D9D4C7] bg-white px-3 text-xs font-semibold text-[#59635C] transition hover:bg-[#FBF8F0] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {speechCopy.slow}
              </button>
            </div>
          </motion.article>
        ))}
      </div>
      {speechNotice ? <p className="text-sm text-amber-700">{speechNotice}</p> : null}

      <button type="button" onClick={onBack} className="min-h-11 rounded-xl border border-[#D9D4C7] bg-white px-5 text-sm font-semibold text-[#59635C] transition hover:bg-[#FBF8F0]">
        {t("result.backToList")}
      </button>
    </div>
  );
}
