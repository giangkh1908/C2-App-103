"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  History,
  LoaderCircle,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type {
  PracticeAttemptCreateResponse,
  PracticeAttemptHistoryItem,
  PracticeAttemptLookupResponse,
  PracticeAttemptResult,
  PracticeAttemptSubmitAnswer,
  PracticeExamDetail,
  PracticeExamSummary,
  PracticeGradeSummary,
} from "@/types";

type WorkspaceMode = "browser" | "exam" | "result";
type SaveState = "idle" | "saving" | "saved" | "error";

interface ResumeChoiceState {
  exam: PracticeExamDetail;
  attempt: PracticeAttemptResult;
}

interface SubmitConfirmState {
  missingCount: number;
}

function formatDateTime(value: string | null): string {
  if (!value) return "Chưa nộp";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function draftKey(userId: string, examId: string): string {
  return `practice_draft_${userId}_${examId}`;
}

function progressPercent(answeredCount: number, totalCount: number): number {
  if (!totalCount) return 0;
  return Math.round((answeredCount / totalCount) * 100);
}

function answersRecordToList(answers: Record<string, number | null>): PracticeAttemptSubmitAnswer[] {
  return Object.entries(answers).map(([question_id, selected_choice_index]) => ({
    question_id,
    selected_choice_index,
  }));
}

function answersListToRecord(answers: PracticeAttemptSubmitAnswer[]): Record<string, number> {
  const record: Record<string, number> = {};
  for (const answer of answers) {
    if (answer.selected_choice_index !== null && answer.selected_choice_index !== undefined) {
      record[answer.question_id] = answer.selected_choice_index;
    }
  }
  return record;
}

function stableAnswersKey(answers: Record<string, number>): string {
  return JSON.stringify(
    Object.entries(answers)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([questionId, choiceIndex]) => [questionId, choiceIndex]),
  );
}

function attemptStatusLabel(status: PracticeExamSummary["attempt_status"]): string {
  if (status === "in_progress") return "Đang làm dở";
  if (status === "submitted_recently") return "Đã nộp gần đây";
  return "Chưa làm";
}

function ModalShell({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#203049]/35 px-4 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        className="w-full max-w-lg rounded-[28px] border border-[#D9D4C7] bg-white p-6 shadow-[0_24px_60px_rgba(32,48,73,0.18)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-sans text-2xl font-bold text-[#203049]">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-[#616A63]">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#D9D4C7] px-3 py-1.5 text-sm font-semibold text-[#5A645D] transition hover:bg-[#FBF8F0]"
          >
            Đóng
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </motion.div>
    </div>
  );
}

export default function PracticeExperience() {
  const locale = useLocale();
  const loginPath = `/${locale}/login`;
  const { user, isAuthenticated, isLoading, apiFetch } = useAuth();

  const [grades, setGrades] = useState<PracticeGradeSummary[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [exams, setExams] = useState<PracticeExamSummary[]>([]);
  const [history, setHistory] = useState<PracticeAttemptHistoryItem[]>([]);
  const [currentExam, setCurrentExam] = useState<PracticeExamDetail | null>(null);
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentResult, setCurrentResult] = useState<PracticeAttemptResult | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [isOpeningExam, setIsOpeningExam] = useState(false);
  const [isLoadingAttempt, setIsLoadingAttempt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [resumeChoice, setResumeChoice] = useState<ResumeChoiceState | null>(null);
  const [submitConfirm, setSubmitConfirm] = useState<SubmitConfirmState | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedKeyRef = useRef<string>("");

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const currentQuestion = currentExam?.questions[currentQuestionIndex] ?? null;
  const workspaceMode: WorkspaceMode = currentResult ? "result" : currentExam ? "exam" : "browser";
  const inProgressHistory = history.filter((attempt) => attempt.status === "in_progress");
  const submittedHistory = history.filter((attempt) => attempt.status === "submitted");
  const isSidebarLoading = isBootstrapping || isLoadingExams;
  const isOverlayVisible = isOpeningExam || isLoadingAttempt;

  const refreshHistory = async () => {
    const res = await apiFetch("/practice/attempts");
    if (!res.ok) return;
    const payload: { attempts: PracticeAttemptHistoryItem[] } = await res.json();
    setHistory(payload.attempts);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    const load = async () => {
      setIsBootstrapping(true);
      setError(null);
      try {
        const [gradesRes, attemptsRes] = await Promise.all([
          apiFetch("/practice/grades"),
          apiFetch("/practice/attempts"),
        ]);
        if (!gradesRes.ok) throw new Error("Không tải được danh sách lớp.");
        if (!attemptsRes.ok) throw new Error("Không tải được lịch sử làm bài.");

        const gradesPayload: { grades: PracticeGradeSummary[] } = await gradesRes.json();
        const attemptsPayload: { attempts: PracticeAttemptHistoryItem[] } = await attemptsRes.json();
        if (!active) return;
        setGrades(gradesPayload.grades);
        setHistory(attemptsPayload.attempts);
        setSelectedGrade((prev) => prev ?? gradesPayload.grades[0]?.grade ?? null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
      } finally {
        if (active) setIsBootstrapping(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [apiFetch, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || selectedGrade === null) return;
    let active = true;
    const loadExams = async () => {
      setIsLoadingExams(true);
      setError(null);
      try {
        const res = await apiFetch(`/practice/exams?grade=${selectedGrade}`);
        if (!res.ok) throw new Error("Không tải được danh sách đề.");
        const payload: { exams: PracticeExamSummary[] } = await res.json();
        if (!active) return;
        setExams(payload.exams);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không tải được đề luyện tập.");
      } finally {
        if (active) setIsLoadingExams(false);
      }
    };
    void loadExams();
    return () => {
      active = false;
    };
  }, [apiFetch, isAuthenticated, selectedGrade]);

  useEffect(() => {
    if (!currentExam || !currentAttemptId || currentResult || !user) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      return;
    }

    const currentKey = stableAnswersKey(answers);
    if (currentKey === lastSavedKeyRef.current) return;

    setSaveState("saving");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch(`/practice/attempts/${currentAttemptId}/draft`, {
          method: "PATCH",
          body: JSON.stringify({ answers: answersRecordToList(answers) }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.detail ?? "Không lưu được bài làm dở.");
        }
        lastSavedKeyRef.current = currentKey;
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 600);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [answers, apiFetch, currentAttemptId, currentExam, currentResult, user]);

  const resetWorkspace = () => {
    setCurrentExam(null);
    setCurrentAttemptId(null);
    setCurrentResult(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setNotice(null);
    setSaveState("idle");
    lastSavedKeyRef.current = "";
  };

  const hydrateWorkspace = (exam: PracticeExamDetail, attemptId: string, nextAnswers: Record<string, number>) => {
    setCurrentExam(exam);
    setCurrentAttemptId(attemptId);
    setAnswers(nextAnswers);
    setCurrentQuestionIndex(0);
    setCurrentResult(null);
    setSubmitConfirm(null);
    setSaveState("idle");
    lastSavedKeyRef.current = stableAnswersKey(nextAnswers);
  };

  const handleStartNewAttempt = async (exam: PracticeExamDetail, startMode: "create_new" | "restart") => {
    if (!user) return;
    const attemptRes = await apiFetch("/practice/attempts", {
      method: "POST",
      body: JSON.stringify({ exam_id: exam.exam_id, start_mode: startMode }),
    });
    if (!attemptRes.ok) {
      const payload = await attemptRes.json().catch(() => null);
      throw new Error(payload?.detail ?? "Không tạo được lượt làm bài.");
    }
    const attempt = (await attemptRes.json()) as PracticeAttemptCreateResponse;
    const localDraftRaw = window.localStorage.getItem(draftKey(user.id, exam.exam_id));
    const localDraft = localDraftRaw ? (JSON.parse(localDraftRaw) as Record<string, number>) : {};
    hydrateWorkspace(exam, attempt.attempt_id, localDraft);
    await refreshHistory();
  };

  const handleContinueAttempt = async (exam: PracticeExamDetail, attempt: PracticeAttemptResult) => {
    if (!user) return;
    const serverAnswers = answersListToRecord(attempt.answers);
    const localDraftRaw = window.localStorage.getItem(draftKey(user.id, exam.exam_id));
    const localDraft = localDraftRaw ? (JSON.parse(localDraftRaw) as Record<string, number>) : {};
    const nextAnswers = Object.keys(serverAnswers).length > 0 ? serverAnswers : localDraft;
    hydrateWorkspace(exam, attempt.attempt_id, nextAnswers);
    setResumeChoice(null);
  };

  const handleOpenExam = async (examId: string) => {
    setIsOpeningExam(true);
    setError(null);
    setNotice(null);
    try {
      const examRes = await apiFetch(`/practice/exams/${examId}`);
      if (!examRes.ok) throw new Error("Không mở được đề này.");
      const exam = (await examRes.json()) as PracticeExamDetail;

      const inProgressRes = await apiFetch(`/practice/attempts/in-progress?exam_id=${encodeURIComponent(examId)}`);
      if (!inProgressRes.ok) throw new Error("Không kiểm tra được bài làm dở.");
      const inProgressPayload = (await inProgressRes.json()) as PracticeAttemptLookupResponse;

      if (inProgressPayload.attempt) {
        setResumeChoice({ exam, attempt: inProgressPayload.attempt });
        return;
      }

      await handleStartNewAttempt(exam, "create_new");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không mở được đề.");
    } finally {
      setIsOpeningExam(false);
    }
  };

  const handleOpenAttempt = async (attemptId: string) => {
    setIsLoadingAttempt(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch(`/practice/attempts/${attemptId}`);
      if (!res.ok) throw new Error("Không mở được kết quả bài làm.");
      const payload = (await res.json()) as PracticeAttemptResult;
      if (payload.status === "in_progress") {
        const examRes = await apiFetch(`/practice/exams/${payload.exam_id}`);
        if (examRes.ok) {
          const exam = (await examRes.json()) as PracticeExamDetail;
          hydrateWorkspace(exam, payload.attempt_id, answersListToRecord(payload.answers));
        } else {
          setCurrentResult(payload);
          setCurrentExam(null);
          setCurrentAttemptId(payload.attempt_id);
          setAnswers({});
          setCurrentQuestionIndex(0);
        }
      } else {
        setCurrentResult(payload);
        setCurrentExam(null);
        setCurrentAttemptId(payload.attempt_id);
        setAnswers({});
        setCurrentQuestionIndex(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không mở được lịch sử bài làm.");
    } finally {
      setIsLoadingAttempt(false);
    }
  };

  const handleChooseAnswer = (questionId: string, choiceIndex: number) => {
    if (!currentExam || !user) return;
    const nextAnswers = { ...answers, [questionId]: choiceIndex };
    setAnswers(nextAnswers);
    window.localStorage.setItem(draftKey(user.id, currentExam.exam_id), JSON.stringify(nextAnswers));
  };

  const handleSaveDraft = async () => {
    if (!currentExam || !currentAttemptId || !user) return;
    setSaveState("saving");
    try {
      const res = await apiFetch(`/practice/attempts/${currentAttemptId}/draft`, {
        method: "PATCH",
        body: JSON.stringify({ answers: answersRecordToList(answers) }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.detail ?? "Không lưu được bài làm dở.");
      }
      lastSavedKeyRef.current = stableAnswersKey(answers);
      window.localStorage.setItem(draftKey(user.id, currentExam.exam_id), JSON.stringify(answers));
      setSaveState("saved");
      setNotice("Đã lưu nháp trên thiết bị và máy chủ.");
      await refreshHistory();
    } catch (err) {
      setSaveState("error");
      setError(err instanceof Error ? err.message : "Không lưu được bài làm dở.");
    }
  };

  const doSubmit = async () => {
    if (!currentExam || !currentAttemptId || !user) return;
    setIsSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiFetch(`/practice/attempts/${currentAttemptId}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: answersRecordToList(answers) }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.detail ?? "Không nộp được bài.");
      }
      const payload = (await res.json()) as PracticeAttemptResult;
      window.localStorage.removeItem(draftKey(user.id, currentExam.exam_id));
      setCurrentResult(payload);
      setCurrentExam(null);
      setAnswers({});
      setSubmitConfirm(null);
      setSaveState("idle");
      await refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không nộp được bài.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentExam) return;
    const missingCount = currentExam.questions.length - answeredCount;
    if (missingCount > 0) {
      setSubmitConfirm({ missingCount });
      return;
    }
    await doSubmit();
  };

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-[#6B736E]">Đang tải khu luyện tập...</div>;
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="relative overflow-hidden rounded-[34px] border border-[#D9D4C7] bg-[linear-gradient(135deg,#fdfaf2_0%,#f7f1e4_55%,#eef3ea_100%)] p-8 shadow-[0_30px_80px_rgba(74,88,60,0.08)]">
          <div className="absolute inset-y-0 right-0 w-64 bg-[radial-gradient(circle_at_top,_rgba(87,120,73,0.14),_transparent_70%)]" />
          <div className="relative max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D5DFC9] bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#5A7A4B]">
              <Sparkles className="h-4 w-4" />
              Luyện tập có lưu lịch sử
            </div>
            <h1 className="mt-5 font-sans text-3xl font-bold leading-tight text-[#203049] sm:text-4xl">
              Đăng nhập để mở bộ đề theo lớp, làm bài trọn bộ và xem chữa chi tiết
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5F685F] sm:text-base">
              Trang luyện tập sẽ gợi ý đúng nhóm đề của từng lớp, tự chấm điểm sau khi nộp bài và lưu lại kết quả để học sinh xem lại bất cứ lúc nào.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={loginPath} className="rounded-full bg-[#587849] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#48653B]">
                Đăng nhập
              </Link>
              <Link
                href={`/${locale}/learn`}
                className="rounded-full border border-[#D9D4C7] bg-white/80 px-6 py-3 text-sm font-semibold text-[#56605B] transition hover:bg-white"
              >
                Học cùng gia sư AI
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1480px] px-3 py-6 sm:px-4 lg:px-6">
      <div className="overflow-hidden rounded-[34px] border border-[#D6D0C1] bg-[#F6F1E7] shadow-[0_24px_60px_rgba(79,92,67,0.08)]">
        <div className="grid min-h-[calc(100vh-9rem)] lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="border-b border-[#DED7C8] bg-[#FBF8F0] p-4 lg:border-b-0 lg:border-r lg:p-5">
            <div className="rounded-[28px] border border-[#D6DCCA] bg-white px-5 py-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EFF3E7] text-[#587849]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#5A7A4B]">Khu luyện tập</p>
                  <h2 className="mt-1 font-sans text-2xl font-bold text-[#203049]">Chọn lớp và đề</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[#616A63]">
                Mỗi lớp có đúng 10 đề đã chọn lọc. Em có thể tiếp tục bài đang làm dở hoặc làm lại từ đầu nếu muốn.
              </p>
            </div>

            <div className="mt-4 rounded-[28px] border border-[#D6DCCA] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#5A7A4B]">
                <Sparkles className="h-4 w-4" />
                Chọn lớp
              </div>
              <div className="grid grid-cols-5 gap-2">
                {grades.map((gradeItem) => {
                  const isActive = selectedGrade === gradeItem.grade;
                  return (
                    <motion.button
                      key={gradeItem.grade}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => setSelectedGrade(gradeItem.grade)}
                      className={`rounded-2xl border px-2 py-3 text-center transition ${
                        isActive
                          ? "border-[#587849] bg-[#587849] text-white shadow-[0_10px_24px_rgba(88,120,73,0.24)]"
                          : "border-[#E4DED0] bg-[#FBF8F0] text-[#5D665F] hover:border-[#CBD6C0] hover:bg-[#F4F7EF]"
                      }`}
                    >
                      <div className="text-sm font-black">L{gradeItem.grade}</div>
                      <div className={`mt-1 text-[10px] font-semibold ${isActive ? "text-white/80" : "text-[#80907B]"}`}>
                        {gradeItem.exam_count} đề
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-[28px] border border-[#D6DCCA] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#5A7A4B]">
                <ClipboardCheck className="h-4 w-4" />
                Bộ đề lớp {selectedGrade ?? "--"}
              </div>
              <div className="space-y-3">
                {isSidebarLoading && exams.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#D9D2C3] bg-[#FBF8F0] px-4 py-5 text-sm text-[#69716C]">
                    Đang tải danh sách đề...
                  </div>
                ) : (
                  exams.map((exam, index) => (
                    <motion.button
                      key={exam.exam_id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, delay: index * 0.03 }}
                      type="button"
                      onClick={() => void handleOpenExam(exam.exam_id)}
                      className="group w-full rounded-[24px] border border-[#E4DED0] bg-[linear-gradient(180deg,#fffefb_0%,#f8f3e8_100%)] p-4 text-left transition hover:border-[#C9D4BE] hover:shadow-[0_14px_30px_rgba(90,122,75,0.12)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#6D8A5B]">
                            Đề {String(index + 1).padStart(2, "0")}
                          </p>
                          <h3 className="mt-2 line-clamp-2 font-sans text-xl font-bold leading-snug text-[#203049]">
                            {exam.title}
                          </h3>
                        </div>
                        <div className="rounded-2xl bg-white px-3 py-2 text-center text-xs font-bold text-[#58645C] shadow-sm">
                          {exam.question_count} câu
                        </div>
                      </div>
                      <div className="mt-3 inline-flex rounded-full border border-[#D7E1CD] bg-[#F3F7ED] px-3 py-1 text-[11px] font-bold text-[#587849]">
                        {attemptStatusLabel(exam.attempt_status)}
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#5E665F]">{exam.preview_text}</p>
                      <div className="mt-4 flex items-center justify-between text-sm font-semibold text-[#587849]">
                        <span>Mở đề</span>
                        <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </div>
                    </motion.button>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 rounded-[28px] border border-[#D6DCCA] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#5A7A4B]">
                <History className="h-4 w-4" />
                Lịch sử gần đây
              </div>

              {inProgressHistory.length > 0 ? (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-[#7A867D]">Đang làm dở</p>
                  <div className="space-y-3">
                    {inProgressHistory.slice(0, 2).map((attempt) => (
                      <button
                        key={attempt.attempt_id}
                        type="button"
                        onClick={() => void handleOpenAttempt(attempt.attempt_id)}
                        className="w-full rounded-2xl border border-[#CBD6C0] bg-[#F3F7ED] p-4 text-left transition hover:bg-[#EEF4E7]"
                      >
                        <p className="text-sm font-bold text-[#203049]">{attempt.exam_title}</p>
                        <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#587849]">
                          Lớp {attempt.grade} • Lưu lúc {formatDateTime(attempt.updated_at)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                {submittedHistory.length === 0 ? (
                  <div className="rounded-2xl bg-[#FBF8F0] px-4 py-5 text-sm leading-7 text-[#69716C]">
                    Chưa có bài nào được nộp. Em hãy chọn một đề để bắt đầu nhé.
                  </div>
                ) : (
                  submittedHistory.slice(0, 6).map((attempt) => (
                    <button
                      key={attempt.attempt_id}
                      type="button"
                      onClick={() => void handleOpenAttempt(attempt.attempt_id)}
                      className="w-full rounded-2xl border border-[#E4DED0] bg-[#FCFAF5] p-4 text-left transition hover:border-[#CBD6C0] hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="line-clamp-2 text-sm font-bold text-[#203049]">{attempt.exam_title}</p>
                          <p className="mt-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#6D8A5B]">
                            Lớp {attempt.grade} • Đã nộp
                          </p>
                        </div>
                        <div className="rounded-full bg-[#EFF3E7] px-2.5 py-1 text-xs font-bold text-[#587849]">
                          {attempt.score ?? "--"}
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-6 text-[#6A726D]">{formatDateTime(attempt.submitted_at)}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>

          <div className="relative flex min-h-full flex-col bg-[radial-gradient(circle_at_top_left,_rgba(88,120,73,0.10),_transparent_35%),linear-gradient(180deg,#fffdf7_0%,#faf6ee_100%)]">
            <div className="border-b border-[#DED7C8] px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={resetWorkspace}
                    className="mt-1 rounded-2xl border border-[#D9D3C5] bg-white px-3 py-3 text-[#5B665E] transition hover:bg-[#FBF8F0]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#5A7A4B]">
                      {workspaceMode === "browser" ? "Practice workspace" : workspaceMode === "exam" ? "Đang làm bài" : "Kết quả bài làm"}
                    </p>
                    <h1 className="mt-2 font-sans text-2xl font-bold text-[#203049] sm:text-3xl">
                      {currentExam?.title ?? currentResult?.exam_title ?? "Bộ đề luyện tập theo lớp"}
                    </h1>
                    <p className="mt-2 text-sm text-[#637068]">
                      {workspaceMode === "browser"
                        ? "Chọn một đề bên trái để bắt đầu. Nếu có bài đang làm dở, hệ thống sẽ cho em chọn tiếp tục hoặc làm lại."
                        : workspaceMode === "exam"
                          ? `Lớp ${currentExam?.grade} • ${answeredCount}/${currentExam?.questions.length ?? 0} câu đã chọn`
                          : `Lớp ${currentResult?.grade} • Nộp lúc ${formatDateTime(currentResult?.submitted_at ?? null)}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-full border border-[#D7E1CD] bg-white/90 px-4 py-2 text-sm font-semibold text-[#587849]">
                    {selectedGrade ? `L${selectedGrade} • ${exams.length} đề` : "Chọn lớp"}
                  </div>
                  {currentExam ? (
                    <>
                      <div className="rounded-full border border-[#D9D4C7] bg-white/90 px-4 py-2 text-sm font-semibold text-[#5E665F]">
                        Tiến độ {progressPercent(answeredCount, currentExam.questions.length)}%
                      </div>
                      <div className="rounded-full border border-[#D9D4C7] bg-white/90 px-4 py-2 text-sm font-semibold text-[#5E665F]">
                        {saveState === "saving" && "Đang lưu nháp..."}
                        {saveState === "saved" && "Đã lưu nháp"}
                        {saveState === "error" && "Lưu nháp lỗi"}
                        {saveState === "idle" && "Nháp cục bộ sẵn sàng"}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            {error ? (
              <div className="px-4 pt-4 sm:px-6">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
              </div>
            ) : null}

            {notice ? (
              <div className="px-4 pt-4 sm:px-6">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
              </div>
            ) : null}

            <div className="flex-1 px-4 py-4 sm:px-6 sm:py-6">
              <AnimatePresence mode="wait">
                {workspaceMode === "browser" ? (
                  <motion.div
                    key="browser"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]"
                  >
                    <div className="rounded-[30px] border border-[#DED7C8] bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF3E7] text-[#587849]">
                          <ClipboardCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#5A7A4B]">Sẵn sàng làm bài</p>
                          <h2 className="mt-1 font-sans text-2xl font-bold text-[#203049]">Chọn đề ở cột bên trái để bắt đầu</h2>
                        </div>
                      </div>
                      <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {[
                          ["10 đề mỗi lớp", "Bộ đề đã được chọn lọc và sắp sẵn theo thứ tự dễ theo dõi."],
                          ["Tiếp tục bài dở", "Nếu em chưa làm xong một đề, hệ thống sẽ mời em tiếp tục đúng lượt cũ."],
                          ["Tự chấm ngay", "Sau khi nộp bài, trang sẽ trả lại điểm và lời giải chi tiết từng câu."],
                        ].map(([title, description], index) => (
                          <motion.div
                            key={title}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.24, delay: index * 0.06 }}
                            className="rounded-[24px] border border-[#E7E0D1] bg-[#FCFAF5] p-4"
                          >
                            <p className="text-sm font-black text-[#203049]">{title}</p>
                            <p className="mt-2 text-sm leading-7 text-[#626B63]">{description}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[30px] border border-[#D7E1CD] bg-[linear-gradient(180deg,#f5f8f0_0%,#ffffff_100%)] p-6 shadow-sm">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#5A7A4B]">Gợi ý nhanh</p>
                      <h2 className="mt-2 font-sans text-2xl font-bold text-[#203049]">Lộ trình nhỏ để bắt nhịp</h2>
                      <ol className="mt-5 space-y-4">
                        {[
                          "Chọn lớp của em ở khối bên trái.",
                          "Mở một trong 10 đề đã được chuẩn bị cho lớp đó.",
                          "Nếu đề đang làm dở, chọn tiếp tục hoặc làm lại từ đầu.",
                          "Trả lời từng câu, bài sẽ tự lưu nháp theo thời gian ngắn.",
                          "Khi còn câu trống, em vẫn có thể xác nhận nộp nếu muốn.",
                        ].map((step, index) => (
                          <li key={step} className="flex gap-3 rounded-2xl border border-[#E5ECDD] bg-white/80 p-4">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#587849] text-sm font-black text-white">
                              {index + 1}
                            </div>
                            <p className="text-sm leading-7 text-[#5E675F]">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </motion.div>
                ) : null}

                {workspaceMode === "exam" && currentExam && currentQuestion ? (
                  <motion.div
                    key={`exam_${currentExam.exam_id}_${currentAttemptId}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]"
                  >
                    <div className="space-y-5">
                      <div className="rounded-[28px] border border-[#DED7C8] bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#5A7A4B]">Tiến độ làm bài</p>
                        <div className="mt-4 rounded-full bg-[#EEF2E8] p-1">
                          <motion.div
                            animate={{ width: `${progressPercent(answeredCount, currentExam.questions.length)}%` }}
                            transition={{ duration: 0.28 }}
                            className="h-3 rounded-full bg-[#587849]"
                          />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="font-semibold text-[#59635C]">Đã chọn</span>
                          <span className="font-black text-[#203049]">
                            {answeredCount}/{currentExam.questions.length}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-[28px] border border-[#DED7C8] bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#5A7A4B]">Điều hướng câu hỏi</p>
                        <div className="mt-4 grid grid-cols-4 gap-2 overflow-x-auto sm:grid-cols-5 xl:grid-cols-4">
                          {currentExam.questions.map((question, index) => {
                            const isActive = index === currentQuestionIndex;
                            const isAnswered = answers[question.question_id] !== undefined;
                            return (
                              <motion.button
                                key={question.question_id}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                onClick={() => setCurrentQuestionIndex(index)}
                                className={`rounded-2xl border px-3 py-3 text-sm font-black transition ${
                                  isActive
                                    ? "border-[#587849] bg-[#587849] text-white"
                                    : isAnswered
                                      ? "border-[#CBD6C0] bg-[#F1F6EA] text-[#587849]"
                                      : "border-[#E4DED0] bg-[#FCFAF5] text-[#66716A] hover:bg-white"
                                }`}
                              >
                                {index + 1}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[30px] border border-[#DED7C8] bg-white p-5 shadow-sm sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#5A7A4B]">
                            Câu {currentQuestionIndex + 1} / {currentExam.questions.length}
                          </p>
                          <h2 className="mt-2 font-sans text-2xl font-bold text-[#203049]">{currentExam.title}</h2>
                        </div>
                        <button
                          type="button"
                          onClick={resetWorkspace}
                          className="rounded-full border border-[#D9D4C7] px-4 py-2 text-sm font-semibold text-[#59635C] transition hover:bg-[#FBF8F0]"
                        >
                          Thoát đề
                        </button>
                      </div>

                      <div className="mt-6 rounded-[28px] border border-[#E7E0D1] bg-[linear-gradient(180deg,#fefcf7_0%,#f8f2e7_100%)] p-5">
                        <p className="text-base leading-8 text-[#2F3A34]">{currentQuestion.question_text}</p>
                      </div>

                      <div className="mt-5 grid gap-3">
                        {currentQuestion.choices.map((choice, index) => {
                          const isSelected = answers[currentQuestion.question_id] === index;
                          return (
                            <motion.button
                              key={`${currentQuestion.question_id}_${index}`}
                              whileTap={{ scale: 0.99 }}
                              type="button"
                              onClick={() => handleChooseAnswer(currentQuestion.question_id, index)}
                              className={`flex items-start gap-3 rounded-[24px] border px-4 py-4 text-left transition ${
                                isSelected
                                  ? "border-[#587849] bg-[#F0F5E9] shadow-[0_12px_28px_rgba(88,120,73,0.12)]"
                                  : "border-[#E4DED0] bg-white hover:border-[#CBD6C0] hover:bg-[#FCFAF5]"
                              }`}
                            >
                              <div className="mt-0.5 text-[#587849]">
                                {isSelected ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                              </div>
                              <span className="text-sm leading-7 text-[#334038]">{choice}</span>
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className="mt-6 hidden flex-col gap-3 border-t border-[#ECE5D7] pt-5 xl:flex xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
                            className="inline-flex items-center gap-2 rounded-full border border-[#D9D4C7] px-4 py-2 text-sm font-semibold text-[#59635C] transition hover:bg-[#FBF8F0] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <ArrowLeft className="h-4 w-4" />
                            Câu trước
                          </button>
                          <button
                            type="button"
                            disabled={currentQuestionIndex === currentExam.questions.length - 1}
                            onClick={() => setCurrentQuestionIndex((prev) => Math.min(prev + 1, currentExam.questions.length - 1))}
                            className="inline-flex items-center gap-2 rounded-full border border-[#D9D4C7] px-4 py-2 text-sm font-semibold text-[#59635C] transition hover:bg-[#FBF8F0] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Câu tiếp
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => void handleSaveDraft()}
                            className="inline-flex items-center gap-2 rounded-full border border-[#D9D4C7] px-5 py-3 text-sm font-semibold text-[#59635C] transition hover:bg-[#FBF8F0]"
                          >
                            <Save className="h-4 w-4" />
                            Lưu nháp
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => void handleSubmit()}
                            className="inline-flex items-center gap-2 rounded-full bg-[#587849] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#48653B] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                            Nộp bài
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : null}

                {workspaceMode === "result" && currentResult ? (
                  <motion.div
                    key={`result_${currentResult.attempt_id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-5"
                  >
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                      <div className="rounded-[30px] border border-[#DED7C8] bg-white p-6 shadow-sm">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#5A7A4B]">Kết quả bài làm</p>
                        <h2 className="mt-2 font-sans text-3xl font-bold text-[#203049]">{currentResult.exam_title}</h2>
                        <p className="mt-3 text-sm leading-7 text-[#647068]">
                          Em đã hoàn thành bài luyện tập lớp {currentResult.grade}. Dưới đây là điểm số và phần chữa chi tiết cho từng câu.
                        </p>
                      </div>

                      <div className="rounded-[30px] border border-[#D7E1CD] bg-[linear-gradient(180deg,#f4f8ee_0%,#ffffff_100%)] p-6 text-center shadow-sm">
                        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-[#E2ECD8] bg-white">
                          <span className="text-4xl font-black text-[#203049]">{currentResult.result_summary?.score ?? 0}</span>
                        </div>
                        <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-[#587849]">
                          {currentResult.result_summary?.correct_count ?? 0}/{currentResult.result_summary?.total_count ?? 0} câu đúng
                        </p>
                        <div className="mt-3 inline-flex rounded-full bg-[#EFF3E7] px-4 py-2 text-sm font-bold text-[#587849]">
                          {currentResult.result_summary?.badge_label}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {currentResult.questions.map((question, index) => (
                        <motion.article
                          key={question.question_id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22, delay: index * 0.03 }}
                          className="rounded-[28px] border border-[#DED7C8] bg-white p-5 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-[#203049]">Câu {index + 1}</p>
                              <p className="mt-1 text-sm leading-7 text-[#2F3A34]">{question.question_text}</p>
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                question.is_correct ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {question.is_correct ? "Đúng" : "Cần xem lại"}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-2">
                            {question.choices.map((choice, choiceIndex) => {
                              const isSelected = question.selected_choice_index === choiceIndex;
                              const isCorrect = question.correct_choice_index === choiceIndex;
                              const className = isCorrect
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                : isSelected
                                  ? "border-rose-300 bg-rose-50 text-rose-700"
                                  : "border-[#E4DED0] bg-[#FCFAF5] text-[#4D5850]";
                              return (
                                <div key={`${question.question_id}_${choiceIndex}`} className={`rounded-2xl border px-4 py-3 text-sm ${className}`}>
                                  {choice}
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-4 rounded-2xl bg-[#F8F4EC] px-4 py-4 text-sm leading-7 text-[#58625A]">
                            <span className="font-bold text-[#203049]">Giải thích:</span> {question.explanation}
                          </div>
                        </motion.article>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={resetWorkspace}
                        className="rounded-full border border-[#D9D4C7] px-5 py-3 text-sm font-semibold text-[#59635C] transition hover:bg-[#FBF8F0]"
                      >
                        Quay lại danh sách đề
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {currentExam ? (
              <div className="sticky bottom-0 border-t border-[#DED7C8] bg-white/95 px-4 py-3 backdrop-blur xl:hidden">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
                    className="flex-1 rounded-full border border-[#D9D4C7] px-4 py-3 text-sm font-semibold text-[#59635C] disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveDraft()}
                    className="rounded-full border border-[#D9D4C7] px-4 py-3 text-sm font-semibold text-[#59635C]"
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => void handleSubmit()}
                    className="flex-1 rounded-full bg-[#587849] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
                  >
                    Nộp bài
                  </button>
                  <button
                    type="button"
                    disabled={currentQuestionIndex === currentExam.questions.length - 1}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(prev + 1, currentExam.questions.length - 1))}
                    className="flex-1 rounded-full border border-[#D9D4C7] px-4 py-3 text-sm font-semibold text-[#59635C] disabled:opacity-50"
                  >
                    Tiếp
                  </button>
                </div>
              </div>
            ) : null}

            {isOverlayVisible ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/55 backdrop-blur-[2px]">
                <div className="rounded-full bg-[#203049] px-5 py-3 text-sm font-semibold text-white shadow-lg">
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    {isLoadingAttempt ? "Đang mở bài làm..." : "Đang mở đề..."}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {resumeChoice ? (
          <ModalShell
            title="Tiếp tục hay làm lại?"
            description="Đề này đang có một bài làm dở. Em muốn tiếp tục phần đang làm hay bắt đầu lại từ đầu?"
            onClose={() => setResumeChoice(null)}
          >
            <div className="space-y-3">
              <div className="rounded-2xl bg-[#FBF8F0] px-4 py-4 text-sm leading-7 text-[#5F685F]">
                Lần lưu gần nhất: {formatDateTime(resumeChoice.attempt.updated_at)}. Đã chọn {resumeChoice.attempt.answers.length}/
                {resumeChoice.attempt.questions.length} câu.
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleContinueAttempt(resumeChoice.exam, resumeChoice.attempt)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#587849] px-5 py-3 text-sm font-bold text-white"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Tiếp tục bài cũ
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await handleStartNewAttempt(resumeChoice.exam, "restart");
                      if (user) {
                        window.localStorage.removeItem(draftKey(user.id, resumeChoice.exam.exam_id));
                      }
                      setResumeChoice(null);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Không thể làm lại bài.");
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-[#D9D4C7] px-5 py-3 text-sm font-semibold text-[#59635C]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Làm lại từ đầu
                </button>
              </div>
            </div>
          </ModalShell>
        ) : null}

        {submitConfirm ? (
          <ModalShell
            title="Bài vẫn còn câu trống"
            description={`Em còn ${submitConfirm.missingCount} câu chưa chọn đáp án. Em có thể quay lại làm tiếp hoặc vẫn nộp bài ngay.`}
            onClose={() => setSubmitConfirm(null)}
          >
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setSubmitConfirm(null)}
                className="rounded-full border border-[#D9D4C7] px-5 py-3 text-sm font-semibold text-[#59635C]"
              >
                Quay lại làm tiếp
              </button>
              <button type="button" onClick={() => void doSubmit()} className="rounded-full bg-[#587849] px-5 py-3 text-sm font-bold text-white">
                Vẫn nộp bài
              </button>
            </div>
          </ModalShell>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
