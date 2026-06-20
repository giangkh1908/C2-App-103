"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { BookOpen, ChevronRight, ClipboardCheck, History, RotateCcw, Sparkles } from "lucide-react";
import type { PracticeAttemptHistoryItem, PracticeExamSummary, PracticeGradeSummary } from "@/types";
import { attemptStatusKey, formatDateTime, type PracticeTab } from "./practice-utils";

interface PracticeBrowserViewProps {
  grades: PracticeGradeSummary[];
  selectedGrade: number | null;
  onSelectGrade: (grade: number) => void;
  exams: PracticeExamSummary[];
  selectedExam: PracticeExamSummary | null;
  onSelectExam: (examId: string) => void;
  onOpenExam: () => void;
  activeTab: PracticeTab;
  onChangeTab: (tab: PracticeTab) => void;
  inProgressHistory: PracticeAttemptHistoryItem[];
  submittedHistory: PracticeAttemptHistoryItem[];
  onOpenAttempt: (attemptId: string) => void;
  isLoading: boolean;
}

function PracticeRail({
  grades,
  selectedGrade,
  onSelectGrade,
  activeTab,
  onChangeTab,
}: Pick<PracticeBrowserViewProps, "grades" | "selectedGrade" | "onSelectGrade" | "activeTab" | "onChangeTab">) {
  const t = useTranslations("practice");

  return (
    <aside className="border-b border-[#E5DFD2] bg-[#FBF9F4] p-5 xl:border-b-0 xl:border-r xl:p-6">
      <div className="flex items-start gap-3 xl:block">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3E8] text-[#587849] xl:mb-5">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#587849]">{t("sidebar.badge")}</p>
          <h2 className="mt-2 text-2xl font-bold text-[#203049]">{t("sidebar.title")}</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-[#66716A] xl:max-w-none">{t("sidebar.description")}</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#587849]">
          <Sparkles className="h-4 w-4" />
          {t("sidebar.selectGrade")}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 xl:grid xl:grid-cols-5 xl:overflow-visible">
          {grades.map((gradeItem) => {
            const isActive = selectedGrade === gradeItem.grade;
            return (
              <button
                key={gradeItem.grade}
                type="button"
                aria-pressed={isActive}
                onClick={() => onSelectGrade(gradeItem.grade)}
                className={`min-w-14 rounded-xl border px-2 py-3 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#587849]/35 ${
                  isActive
                    ? "border-[#587849] bg-[#587849] text-white shadow-[0_8px_20px_rgba(88,120,73,0.2)]"
                    : "border-[#E4DED0] bg-white text-[#5D665F] hover:border-[#CBD6C0]"
                }`}
              >
                <span className="block text-sm font-black">{t("sidebar.gradeButton", { grade: gradeItem.grade })}</span>
                <span className={`mt-1 block text-[10px] font-semibold ${isActive ? "text-white/75" : "text-[#80907B]"}`}>
                  {t("sidebar.examCount", { count: gradeItem.exam_count })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div role="tablist" aria-label={t("sidebar.title")} className="mt-7 flex rounded-xl border border-[#DCE4D4] bg-[#F1F5EC] p-1">
        {(["exams", "history"] as const).map((tab) => {
          const active = activeTab === tab;
          const Icon = tab === "exams" ? ClipboardCheck : History;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChangeTab(tab)}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#587849]/35 ${
                active ? "bg-white text-[#587849] shadow-sm" : "text-[#6A726D] hover:text-[#587849]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(`sidebar.tabs.${tab}`)}
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function ExamCatalog({
  exams,
  selectedExam,
  onSelectExam,
  onOpenExam,
  isLoading,
  selectedGrade,
}: Pick<PracticeBrowserViewProps, "exams" | "selectedExam" | "onSelectExam" | "onOpenExam" | "isLoading" | "selectedGrade">) {
  const t = useTranslations("practice");

  return (
    <div className="grid min-h-0 gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 rounded-[24px] border border-[#E1DCCE] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ECE7DC] px-4 py-4 sm:px-5">
          <div>
            <p className="text-sm font-bold text-[#203049]">{t("sidebar.examListTitle", { grade: selectedGrade ?? "--" })}</p>
            <p className="mt-1 text-xs text-[#758078]">{t("workspace.browserDesc")}</p>
          </div>
          <span className="rounded-lg bg-[#F1F5EC] px-3 py-2 text-xs font-bold text-[#587849]">
            {t("sidebar.examCount", { count: exams.length })}
          </span>
        </div>

        <div className="max-h-[62dvh] space-y-2 overflow-y-auto p-3 sm:p-4 xl:max-h-[calc(100dvh-17rem)]">
          {isLoading && exams.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D9D2C3] bg-[#FBF9F4] px-4 py-8 text-center text-sm text-[#69716C]">
              {t("sidebar.loadingExams")}
            </div>
          ) : null}

          {!isLoading && exams.length === 0 ? (
            <div className="rounded-xl bg-[#FBF9F4] px-4 py-8 text-center text-sm text-[#69716C]">{t("browser.noExams")}</div>
          ) : null}

          {exams.map((exam, index) => {
            const selected = selectedExam?.exam_id === exam.exam_id;
            return (
              <motion.button
                key={exam.exam_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelectExam(exam.exam_id)}
                className={`group grid w-full grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#587849]/30 sm:grid-cols-[44px_minmax(0,1fr)_auto_auto] sm:px-4 ${
                  selected
                    ? "border-[#BFCDB4] bg-[#F2F6ED] shadow-[0_8px_24px_rgba(88,120,73,0.08)]"
                    : "border-[#E8E3D9] bg-white hover:border-[#CBD6C0] hover:bg-[#FDFCF9]"
                }`}
              >
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black ${selected ? "bg-[#587849] text-white" : "border border-[#E1DCCE] text-[#536159]"}`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-[#203049]">{exam.title}</span>
                  <span className="mt-1 block truncate text-xs text-[#717B74] sm:hidden">{exam.preview_text}</span>
                </span>
                <span className="hidden rounded-full border border-[#DCE5D5] bg-white px-2.5 py-1 text-[11px] font-bold text-[#587849] sm:inline-flex">
                  {t(`status.${attemptStatusKey(exam.attempt_status)}`)}
                </span>
                <span className="flex items-center gap-2 text-xs font-bold text-[#657068]">
                  {t("sidebar.questionCount", { count: exam.question_count })}
                  <ChevronRight className="h-4 w-4 text-[#8A948D] transition group-hover:translate-x-0.5" />
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <aside className="rounded-[24px] border border-[#E1DCCE] bg-[#FBF9F4] p-5 shadow-sm xl:sticky xl:top-4 xl:self-start">
        {selectedExam ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#587849]">
                {t("browser.selectedExam")}
              </p>
              <span className="rounded-full border border-[#DCE5D5] bg-white px-3 py-1 text-[11px] font-bold text-[#587849]">
                {t(`status.${attemptStatusKey(selectedExam.attempt_status)}`)}
              </span>
            </div>
            <h2 className="mt-5 text-2xl font-bold leading-tight text-[#203049]">{selectedExam.title}</h2>
            <div className="mt-5 rounded-2xl border border-[#E5DFD2] bg-white p-4">
              <p className="text-xs font-semibold text-[#7A847D]">{t("browser.preview")}</p>
              <p className="mt-2 text-sm leading-7 text-[#556159]">{selectedExam.preview_text}</p>
              <div className="mt-4 border-t border-[#EEE9DE] pt-4 text-sm font-bold text-[#203049]">
                {t("sidebar.questionCount", { count: selectedExam.question_count })}
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenExam}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#587849] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(88,120,73,0.2)] transition hover:bg-[#48653B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#587849]/40 focus-visible:ring-offset-2"
            >
              {selectedExam.attempt_status === "in_progress" ? t("browser.continueExam") : t("sidebar.openExam")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex min-h-56 items-center justify-center text-center text-sm leading-7 text-[#69716C]">{t("browser.noExams")}</div>
        )}
      </aside>
    </div>
  );
}

function HistoryCatalog({ inProgressHistory, submittedHistory, onOpenAttempt }: Pick<PracticeBrowserViewProps, "inProgressHistory" | "submittedHistory" | "onOpenAttempt">) {
  const locale = useLocale();
  const t = useTranslations("practice");
  const attempts = [...inProgressHistory, ...submittedHistory];

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-4xl rounded-[24px] border border-[#E1DCCE] bg-white shadow-sm">
        <div className="border-b border-[#ECE7DC] px-5 py-4">
          <p className="font-bold text-[#203049]">{t("sidebar.recentHistory")}</p>
        </div>
        <div className="max-h-[calc(100dvh-18rem)] space-y-2 overflow-y-auto p-4">
          {attempts.length === 0 ? (
            <div className="rounded-xl bg-[#FBF9F4] px-4 py-8 text-center text-sm leading-7 text-[#69716C]">{t("sidebar.noHistory")}</div>
          ) : null}
          {attempts.map((attempt) => (
            <button
              key={attempt.attempt_id}
              type="button"
              onClick={() => onOpenAttempt(attempt.attempt_id)}
              className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-[#E8E3D9] px-4 py-4 text-left transition hover:border-[#CBD6C0] hover:bg-[#FBFDF9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#587849]/30"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-[#203049]">{attempt.exam_title}</span>
                <span className="mt-1 block text-xs text-[#717B74]">
                  {attempt.status === "in_progress"
                    ? t("sidebar.inProgressItem", { grade: attempt.grade, time: formatDateTime(attempt.updated_at, locale) })
                    : `${t("sidebar.submittedItem", { grade: attempt.grade })} · ${formatDateTime(attempt.submitted_at, locale)}`}
                </span>
              </span>
              <span className="flex items-center gap-3">
                {attempt.status === "in_progress" ? <RotateCcw className="h-4 w-4 text-[#587849]" /> : <span className="rounded-full bg-[#EFF3E7] px-3 py-1 text-xs font-bold text-[#587849]">{attempt.score ?? "--"}</span>}
                <ChevronRight className="h-4 w-4 text-[#8A948D]" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PracticeBrowserView(props: PracticeBrowserViewProps) {
  const t = useTranslations("practice");

  return (
    <div className="grid min-h-[calc(100dvh-9rem)] overflow-hidden rounded-[28px] border border-[#DCD6C8] bg-[#F8F5EE] shadow-[0_20px_55px_rgba(79,92,67,0.08)] xl:grid-cols-[260px_minmax(0,1fr)]">
      <PracticeRail {...props} />
      <div className="min-w-0">
        <header className="border-b border-[#E5DFD2] bg-[#FCFBF8] px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#587849]">{t("workspace.headerBrowser")}</p>
              <h1 className="mt-2 text-2xl font-bold text-[#203049] sm:text-3xl">{t("workspace.defaultTitle")}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#69746D]">{t("workspace.browserDesc")}</p>
            </div>
            <span className="rounded-xl border border-[#D7E1CD] bg-white px-4 py-2 text-sm font-semibold text-[#587849]">
              {props.selectedGrade ? t("workspace.gradeInfo", { grade: props.selectedGrade, count: props.exams.length }) : t("workspace.selectGrade")}
            </span>
          </div>
        </header>
        {props.activeTab === "exams" ? <ExamCatalog {...props} /> : <HistoryCatalog {...props} />}
      </div>
    </div>
  );
}
