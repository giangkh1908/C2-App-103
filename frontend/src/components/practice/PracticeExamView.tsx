"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, ClipboardCheck, LoaderCircle, Mic, MicOff, Save, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import type { PracticeExamDetail, PracticeExamQuestion } from "@/types";
import { progressPercent, type SaveState } from "./practice-utils";
import { DEFAULT_TTS_LOCALE, normalizeSpeechChoiceTranscript } from "@/lib/speech";

function getPracticeSpeechCopy(locale: string) {
  if (locale === "vi") {
    return {
      listen: "Nghe câu hỏi",
      slow: "Đọc chậm",
      speakAnswer: "Nói đáp án",
      stop: "Dừng",
      unsupported: "Thiết bị này chưa hỗ trợ nói hoặc nghe bằng giọng.",
      transcriptLabel: "Con vừa nói:",
      pendingChoice: "Hệ thống nghe thành đáp án",
      confirmChoice: "Xác nhận đáp án",
      retryChoice: "Nói lại hoặc chọn tay",
      sttError: "Mình chưa nghe rõ đáp án. Con thử nói A, B, C hoặc D nhé.",
      listening: "Đang nghe...",
      reading: "Đang đọc...",
    };
  }

  return {
    listen: "Listen",
    slow: "Slow",
    speakAnswer: "Speak answer",
    stop: "Stop",
    unsupported: "This device does not support voice input or read-aloud.",
    transcriptLabel: "You said:",
    pendingChoice: "Detected answer",
    confirmChoice: "Confirm answer",
    retryChoice: "Try again or tap manually",
    sttError: "I could not hear the answer clearly. Please say A, B, C, or D.",
    listening: "Listening...",
    reading: "Reading...",
  };
}

function getSafePracticeSpeechCopy(locale: string) {
  if (locale === "vi") {
    return {
      listen: "Nghe câu hỏi",
      slow: "Đọc chậm",
      speakAnswer: "Nói đáp án",
      stop: "Dừng",
      unsupported: "Thiết bị này chưa hỗ trợ nói hoặc nghe bằng giọng.",
      transcriptLabel: "Con vừa nói:",
      pendingChoice: "Hệ thống nghe thành đáp án",
      confirmChoice: "Xác nhận đáp án",
      retryChoice: "Nói lại hoặc chọn tay",
      sttError: "Mình chưa nghe rõ đáp án. Con thử nói A, B, C hoặc D nhé.",
      listening: "Đang nghe...",
      reading: "Đang đọc...",
    };
  }

  return getPracticeSpeechCopy(locale);
}

interface PracticeExamViewProps {
  exam: PracticeExamDetail;
  currentQuestion: PracticeExamQuestion;
  currentQuestionIndex: number;
  answers: Record<string, number>;
  answeredCount: number;
  saveState: SaveState;
  isSubmitting: boolean;
  onExit: () => void;
  onSelectQuestion: (index: number) => void;
  onMoveQuestion: (direction: -1 | 1) => void;
  onChooseAnswer: (questionId: string, choiceIndex: number) => void;
  onSave: () => void;
  onSubmit: () => void;
}

export default function PracticeExamView({
  exam,
  currentQuestion,
  currentQuestionIndex,
  answers,
  answeredCount,
  saveState,
  isSubmitting,
  onExit,
  onSelectQuestion,
  onMoveQuestion,
  onChooseAnswer,
  onSave,
  onSubmit,
}: PracticeExamViewProps) {
  const locale = useLocale();
  const t = useTranslations("practice");
  const speechLocale = locale === "vi" ? "vi-VN" : "en-US";
  const { apiFetch } = useAuth();
  const speechCopy = useMemo(() => getSafePracticeSpeechCopy(locale), [locale]);
  const percent = progressPercent(answeredCount, exam.questions.length);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [pendingVoiceChoice, setPendingVoiceChoice] = useState<number | null>(null);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  const [activeNarrationKey, setActiveNarrationKey] = useState<string | null>(null);
  const {
    isSupported: isSpeechToTextSupported,
    isRecording,
    error: speechToTextError,
    transcribe,
    stop: stopTranscription,
    clearError: clearSpeechToTextError,
  } = useSpeechToText(speechLocale);
  const {
    isSupported: isTextToSpeechSupported,
    isSpeaking,
    error: textToSpeechError,
    speak,
    stop: stopSpeaking,
    clearError: clearTextToSpeechError,
  } = useTextToSpeech(DEFAULT_TTS_LOCALE, apiFetch);

  useEffect(() => {
    setVoiceTranscript("");
    setPendingVoiceChoice(null);
    setSpeechNotice(null);
    setActiveNarrationKey(null);
    stopTranscription();
    stopSpeaking();
  }, [currentQuestion.question_id, stopSpeaking, stopTranscription]);

  useEffect(() => {
    if (speechToTextError === "speech_not_supported" || textToSpeechError === "speech_not_supported") {
      setSpeechNotice(speechCopy.unsupported);
      return;
    }
    if (speechToTextError) {
      setSpeechNotice(speechCopy.sttError);
      return;
    }
    if (textToSpeechError) {
      setSpeechNotice(speechCopy.unsupported);
    }
  }, [speechCopy.sttError, speechCopy.unsupported, speechToTextError, textToSpeechError]);

  const handleReadQuestion = async (slow = false) => {
    if (!isTextToSpeechSupported) {
      setSpeechNotice(speechCopy.unsupported);
      return;
    }

    if (activeNarrationKey === "question" && isSpeaking) {
      stopSpeaking();
      setActiveNarrationKey(null);
      return;
    }

    clearTextToSpeechError();
    setSpeechNotice(null);
    setActiveNarrationKey("question");
    await speak(currentQuestion.question_text, { slow, maxChars: 280 });
    setActiveNarrationKey(null);
  };

  const handleSpeakAnswer = async () => {
    if (!isSpeechToTextSupported) {
      setSpeechNotice(speechCopy.unsupported);
      return;
    }

    if (isRecording) {
      stopTranscription();
      return;
    }

    clearSpeechToTextError();
    setSpeechNotice(null);
    const result = await transcribe();
    const transcript = result?.transcript?.trim() ?? "";
    setVoiceTranscript(transcript);
    const choiceIndex = normalizeSpeechChoiceTranscript(transcript);
    if (choiceIndex !== null && choiceIndex < currentQuestion.choices.length) {
      setPendingVoiceChoice(choiceIndex);
    } else {
      setPendingVoiceChoice(null);
      if (transcript) {
        setSpeechNotice(speechCopy.retryChoice);
      }
    }
  };

  const handleConfirmVoiceChoice = () => {
    if (pendingVoiceChoice === null) return;
    onChooseAnswer(currentQuestion.question_id, pendingVoiceChoice);
    setVoiceTranscript("");
    setPendingVoiceChoice(null);
    setSpeechNotice(null);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="rounded-[22px] border border-[#DED7C8] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-[#59635C]">{t("exam.progress")}</p>
            <span className="text-sm font-black text-[#203049]">{percent}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EEF2E8]">
            <motion.div animate={{ width: `${percent}%` }} transition={{ duration: 0.25 }} className="h-full rounded-full bg-[#587849]" />
          </div>
          <p className="mt-3 text-xs text-[#68736C]">{t("workspace.examDesc", { grade: exam.grade, answered: answeredCount, total: exam.questions.length })}</p>
        </div>

        <div className="rounded-[22px] border border-[#DED7C8] bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#5A7A4B]">{t("exam.questionNav")}</p>
          <div className="mt-4 grid grid-cols-5 gap-2 xl:grid-cols-4">
            {exam.questions.map((question, index) => {
              const active = index === currentQuestionIndex;
              const answered = answers[question.question_id] !== undefined;
              return (
                <button
                  key={question.question_id}
                  type="button"
                  aria-label={t("result.questionNumber", { number: index + 1 })}
                  aria-current={active ? "step" : undefined}
                  onClick={() => onSelectQuestion(index)}
                  className={`min-h-11 rounded-xl border text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#587849]/35 ${
                    active
                      ? "border-[#587849] bg-[#587849] text-white"
                      : answered
                        ? "border-[#CBD6C0] bg-[#F1F6EA] text-[#587849]"
                        : "border-[#E4DED0] bg-[#FCFAF5] text-[#66716A] hover:bg-white"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="min-w-0 rounded-[24px] border border-[#DED7C8] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#5A7A4B]">
              {t("exam.questionCounter", { current: currentQuestionIndex + 1, total: exam.questions.length })}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#203049]">{exam.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D9D4C7] px-3 text-sm font-semibold text-[#59635C] transition hover:bg-[#FBF8F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#587849]/30"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">{t("exam.saveDraft")}</span>
            </button>
            <button
              type="button"
              onClick={onExit}
              className="min-h-11 rounded-xl border border-[#D9D4C7] px-4 text-sm font-semibold text-[#59635C] transition hover:bg-[#FBF8F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#587849]/30"
            >
              {t("exam.exit")}
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-[#6A746D]">
          <span className={`h-2 w-2 rounded-full ${saveState === "error" ? "bg-rose-500" : saveState === "saving" ? "animate-pulse bg-amber-500" : "bg-[#587849]"}`} />
          {saveState === "saving" ? t("workspace.saving") : saveState === "saved" ? t("workspace.saved") : saveState === "error" ? t("workspace.saveError") : t("workspace.idle")}
        </div>

        <div className="mt-6 rounded-[20px] border border-[#E7E0D1] bg-[#FBF8F1] p-5">
          <p className="text-base leading-8 text-[#2F3A34]">{currentQuestion.question_text}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleReadQuestion(false)}
            disabled={!isTextToSpeechSupported && !isSpeaking}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D9D4C7] px-4 text-sm font-semibold text-[#59635C] transition hover:bg-[#FBF8F0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {activeNarrationKey === "question" && isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {activeNarrationKey === "question" && isSpeaking ? speechCopy.reading : speechCopy.listen}
          </button>
          <button
            type="button"
            onClick={() => void handleReadQuestion(true)}
            disabled={!isTextToSpeechSupported && !isSpeaking}
            className="inline-flex min-h-11 items-center rounded-xl border border-[#D9D4C7] px-4 text-sm font-semibold text-[#59635C] transition hover:bg-[#FBF8F0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {speechCopy.slow}
          </button>
          <button
            type="button"
            onClick={() => void handleSpeakAnswer()}
            disabled={!isSpeechToTextSupported && !isRecording}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D9D4C7] px-4 text-sm font-semibold text-[#59635C] transition hover:bg-[#FBF8F0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRecording ? <MicOff className="h-4 w-4 text-rose-500" /> : <Mic className="h-4 w-4" />}
            {isRecording ? speechCopy.listening : speechCopy.speakAnswer}
          </button>
        </div>

        {(voiceTranscript || speechNotice || pendingVoiceChoice !== null) ? (
          <div className="mt-4 rounded-[18px] border border-[#E7E0D1] bg-[#FFFDF8] p-4 text-sm text-[#4E5952]">
            {voiceTranscript ? (
              <p>
                <span className="font-bold text-[#203049]">{speechCopy.transcriptLabel}</span> {voiceTranscript}
              </p>
            ) : null}
            {pendingVoiceChoice !== null ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#EEF3E8] px-3 py-1 text-xs font-bold text-[#587849]">
                  {speechCopy.pendingChoice}: {currentQuestion.choices[pendingVoiceChoice]}
                </span>
                <button
                  type="button"
                  onClick={handleConfirmVoiceChoice}
                  className="rounded-xl bg-[#587849] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#48653B]"
                >
                  {speechCopy.confirmChoice}
                </button>
              </div>
            ) : null}
            {speechNotice ? <p className="mt-3 text-xs text-amber-700">{speechNotice}</p> : null}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3">
          {currentQuestion.choices.map((choice, index) => {
            const selected = answers[currentQuestion.question_id] === index;
            return (
              <button
                key={`${currentQuestion.question_id}_${index}`}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setPendingVoiceChoice(null);
                  setVoiceTranscript("");
                  setSpeechNotice(null);
                  onChooseAnswer(currentQuestion.question_id, index);
                }}
                className={`flex min-h-14 items-start gap-3 rounded-[18px] border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#587849]/30 ${
                  selected
                    ? "border-[#587849] bg-[#F0F5E9] shadow-[0_8px_22px_rgba(88,120,73,0.1)]"
                    : "border-[#E4DED0] bg-white hover:border-[#CBD6C0] hover:bg-[#FCFAF5]"
                }`}
              >
                <span className="mt-0.5 text-[#587849]">{selected ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}</span>
                <span className="text-sm leading-7 text-[#334038]">{choice}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 hidden items-center justify-between gap-3 border-t border-[#ECE5D7] pt-5 md:flex">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentQuestionIndex === 0}
              onClick={() => onMoveQuestion(-1)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D9D4C7] px-4 text-sm font-semibold text-[#59635C] transition hover:bg-[#FBF8F0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("exam.prevQuestion")}
            </button>
            <button
              type="button"
              disabled={currentQuestionIndex === exam.questions.length - 1}
              onClick={() => onMoveQuestion(1)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D9D4C7] px-4 text-sm font-semibold text-[#59635C] transition hover:bg-[#FBF8F0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("exam.nextQuestion")}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onSubmit}
            className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#587849] px-6 text-sm font-bold text-white transition hover:bg-[#48653B] disabled:opacity-60"
          >
            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
            {t("exam.submit")}
          </button>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-[1fr_1.3fr_1fr] gap-2 border-t border-[#DED7C8] bg-white/95 p-3 backdrop-blur md:hidden">
        <button type="button" disabled={currentQuestionIndex === 0} onClick={() => onMoveQuestion(-1)} className="min-h-12 rounded-xl border border-[#D9D4C7] text-sm font-semibold text-[#59635C] disabled:opacity-45">
          {t("exam.mobilePrev")}
        </button>
        <button type="button" disabled={isSubmitting} onClick={onSubmit} className="min-h-12 rounded-xl bg-[#587849] text-sm font-bold text-white disabled:opacity-60">
          {t("exam.submit")}
        </button>
        <button type="button" disabled={currentQuestionIndex === exam.questions.length - 1} onClick={() => onMoveQuestion(1)} className="min-h-12 rounded-xl border border-[#D9D4C7] text-sm font-semibold text-[#59635C] disabled:opacity-45">
          {t("exam.mobileNext")}
        </button>
      </div>
    </div>
  );
}
