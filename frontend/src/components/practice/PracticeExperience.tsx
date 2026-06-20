"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, MotionConfig } from "motion/react";
import { ArrowLeft, LoaderCircle, Sparkles } from "lucide-react";
import PracticeBrowserView from "./PracticeBrowserView";
import PracticeDialogs from "./PracticeDialogs";
import PracticeExamView from "./PracticeExamView";
import PracticeResultView from "./PracticeResultView";
import usePracticeWorkspace, { type PracticeWorkspaceController } from "./usePracticeWorkspace";
import { formatDateTime } from "./practice-utils";

function LoginPrompt({ locale }: { locale: string }) {
  const t = useTranslations("practice");

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="relative overflow-hidden rounded-[28px] border border-[#D9D4C7] bg-[#FBF8F0] p-8 shadow-[0_24px_70px_rgba(74,88,60,0.08)]">
        <div className="absolute inset-y-0 right-0 w-64 bg-[radial-gradient(circle_at_top,_rgba(87,120,73,0.14),_transparent_70%)]" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D5DFC9] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#5A7A4B]">
            <Sparkles className="h-4 w-4" />
            {t("loginPrompt.badge")}
          </div>
          <h1 className="mt-5 text-3xl font-bold leading-tight text-[#203049] sm:text-4xl">{t("loginPrompt.title")}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5F685F] sm:text-base">{t("loginPrompt.description")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`/${locale}/login`} className="rounded-xl bg-[#587849] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#48653B]">{t("loginPrompt.loginButton")}</Link>
            <Link href={`/${locale}/learn`} className="rounded-xl border border-[#D9D4C7] bg-white px-6 py-3 text-sm font-semibold text-[#56605B] transition hover:border-[#BFCDB4]">{t("loginPrompt.aiTutorLink")}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkspaceHeader({ controller }: { controller: PracticeWorkspaceController }) {
  const locale = useLocale();
  const t = useTranslations("practice");
  const { mode, currentExam, currentResult, answeredCount, resetWorkspace } = controller;

  return (
    <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <button type="button" onClick={resetWorkspace} aria-label={t("result.backToList")} className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D9D3C5] bg-white text-[#5B665E] transition hover:bg-[#FBF8F0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#587849]/30">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#5A7A4B]">
            {mode === "exam" ? t("workspace.headerExam") : t("workspace.headerResult")}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#203049] sm:text-3xl">{currentExam?.title ?? currentResult?.exam_title}</h1>
          <p className="mt-2 text-sm text-[#637068]">
            {mode === "exam" && currentExam
              ? t("workspace.examDesc", { grade: currentExam.grade, answered: answeredCount, total: currentExam.questions.length })
              : t("workspace.resultDesc", { grade: currentResult?.grade ?? 0, time: formatDateTime(currentResult?.submitted_at ?? null, locale) })}
          </p>
        </div>
      </div>
    </header>
  );
}

export default function PracticeExperience() {
  const locale = useLocale();
  const t = useTranslations("practice");
  const controller = usePracticeWorkspace();

  if (controller.isLoading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-[#6B736E]">{t("loading")}</div>;
  }

  if (!controller.isAuthenticated) return <LoginPrompt locale={locale} />;

  return (
    <MotionConfig reducedMotion="user">
      <section className={`mx-auto max-w-[1480px] px-3 py-5 sm:px-4 lg:px-6 ${controller.mode === "exam" ? "pb-24 md:pb-6" : ""}`}>
        {controller.error ? <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{controller.error}</div> : null}
        {controller.notice ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{controller.notice}</div> : null}

        {controller.mode === "browser" ? (
          <PracticeBrowserView
            grades={controller.grades}
            selectedGrade={controller.selectedGrade}
            onSelectGrade={controller.setSelectedGrade}
            exams={controller.exams}
            selectedExam={controller.selectedExam}
            onSelectExam={controller.selectExam}
            onOpenExam={() => void controller.openExam()}
            activeTab={controller.activeTab}
            onChangeTab={controller.setActiveTab}
            inProgressHistory={controller.inProgressHistory}
            submittedHistory={controller.submittedHistory}
            onOpenAttempt={(attemptId) => void controller.openAttempt(attemptId)}
            isLoading={controller.isSidebarLoading}
          />
        ) : (
          <div className="rounded-[28px] border border-[#DCD6C8] bg-[#F8F5EE] p-4 shadow-[0_20px_55px_rgba(79,92,67,0.08)] sm:p-6">
            <WorkspaceHeader controller={controller} />
            {controller.mode === "exam" && controller.currentExam && controller.currentQuestion ? (
              <PracticeExamView
                exam={controller.currentExam}
                currentQuestion={controller.currentQuestion}
                currentQuestionIndex={controller.currentQuestionIndex}
                answers={controller.answers}
                answeredCount={controller.answeredCount}
                saveState={controller.saveState}
                isSubmitting={controller.isSubmitting}
                onExit={controller.resetWorkspace}
                onSelectQuestion={controller.selectQuestion}
                onMoveQuestion={controller.moveQuestion}
                onChooseAnswer={controller.chooseAnswer}
                onSave={() => void controller.saveDraft()}
                onSubmit={() => void controller.requestSubmit()}
              />
            ) : null}
            {controller.mode === "result" && controller.currentResult ? <PracticeResultView result={controller.currentResult} onBack={controller.resetWorkspace} /> : null}
          </div>
        )}

        {controller.isOverlayVisible ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/55 backdrop-blur-[2px]">
            <div className="rounded-xl bg-[#203049] px-5 py-3 text-sm font-semibold text-white shadow-lg">
              <span className="inline-flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" />{t("loading")}</span>
            </div>
          </div>
        ) : null}

        <AnimatePresence>
          <PracticeDialogs
            resumeChoice={controller.resumeChoice}
            missingAnswerCount={controller.missingAnswerCount}
            onCloseResume={controller.closeResume}
            onContinue={() => controller.resumeChoice && void controller.continueAttempt(controller.resumeChoice.exam, controller.resumeChoice.attempt)}
            onRestart={() => void controller.restartAttempt()}
            onCloseSubmit={controller.closeSubmitConfirm}
            onConfirmSubmit={() => void controller.submitAnswers()}
          />
        </AnimatePresence>
      </section>
    </MotionConfig>
  );
}
