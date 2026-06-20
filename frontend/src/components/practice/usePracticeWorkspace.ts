"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import type {
  PracticeAttemptCreateResponse,
  PracticeAttemptHistoryItem,
  PracticeAttemptLookupResponse,
  PracticeAttemptResult,
  PracticeExamDetail,
  PracticeExamSummary,
  PracticeGradeSummary,
} from "@/types";
import {
  answersListToRecord,
  answersRecordToList,
  draftKey,
  readLocalDraft,
  stableAnswersKey,
  type PracticeTab,
  type SaveState,
} from "./practice-utils";

type WorkspaceState =
  | { mode: "browser" }
  | {
      mode: "exam";
      exam: PracticeExamDetail;
      attemptId: string;
      answers: Record<string, number>;
      questionIndex: number;
    }
  | { mode: "result"; result: PracticeAttemptResult; attemptId: string };

const EMPTY_ANSWERS: Record<string, number> = {};

export interface ResumeChoiceState {
  exam: PracticeExamDetail;
  attempt: PracticeAttemptResult;
}

export default function usePracticeWorkspace() {
  const t = useTranslations("practice");
  const { user, isAuthenticated, isLoading, apiFetch } = useAuth();

  const [grades, setGrades] = useState<PracticeGradeSummary[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [exams, setExams] = useState<PracticeExamSummary[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [history, setHistory] = useState<PracticeAttemptHistoryItem[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceState>({ mode: "browser" });
  const [activeTab, setActiveTab] = useState<PracticeTab>("exams");
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [isOpeningExam, setIsOpeningExam] = useState(false);
  const [isLoadingAttempt, setIsLoadingAttempt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [resumeChoice, setResumeChoice] = useState<ResumeChoiceState | null>(null);
  const [missingAnswerCount, setMissingAnswerCount] = useState<number | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedKeyRef = useRef("");

  const currentExam = workspace.mode === "exam" ? workspace.exam : null;
  const currentAttemptId = workspace.mode === "exam" ? workspace.attemptId : workspace.mode === "result" ? workspace.attemptId : null;
  const currentResult = workspace.mode === "result" ? workspace.result : null;
  const answers = workspace.mode === "exam" ? workspace.answers : EMPTY_ANSWERS;
  const currentQuestionIndex = workspace.mode === "exam" ? workspace.questionIndex : 0;
  const currentQuestion = currentExam?.questions[currentQuestionIndex] ?? null;
  const answeredCount = workspace.mode === "exam" ? Object.keys(workspace.answers).length : 0;
  const selectedExam = useMemo(
    () => exams.find((exam) => exam.exam_id === selectedExamId) ?? exams[0] ?? null,
    [exams, selectedExamId],
  );
  const inProgressHistory = useMemo(() => history.filter((attempt) => attempt.status === "in_progress"), [history]);
  const submittedHistory = useMemo(() => history.filter((attempt) => attempt.status === "submitted"), [history]);

  const refreshHistory = useCallback(async () => {
    const response = await apiFetch("/practice/attempts");
    if (!response.ok) return;
    const payload: { attempts: PracticeAttemptHistoryItem[] } = await response.json();
    setHistory(payload.attempts);
  }, [apiFetch]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    const load = async () => {
      setIsBootstrapping(true);
      setError(null);
      try {
        const [gradesResponse, attemptsResponse] = await Promise.all([
          apiFetch("/practice/grades"),
          apiFetch("/practice/attempts"),
        ]);
        if (!gradesResponse.ok) throw new Error(t("errors.loadGrades"));
        if (!attemptsResponse.ok) throw new Error(t("errors.loadHistory"));

        const gradesPayload: { grades: PracticeGradeSummary[] } = await gradesResponse.json();
        const attemptsPayload: { attempts: PracticeAttemptHistoryItem[] } = await attemptsResponse.json();
        if (!active) return;
        setGrades(gradesPayload.grades);
        setHistory(attemptsPayload.attempts);
        setSelectedGrade((previous) => previous ?? gradesPayload.grades[0]?.grade ?? null);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : t("errors.generic"));
      } finally {
        if (active) setIsBootstrapping(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [apiFetch, isAuthenticated, t]);

  useEffect(() => {
    if (!isAuthenticated || selectedGrade === null) return;
    let active = true;

    const loadExams = async () => {
      setIsLoadingExams(true);
      setError(null);
      try {
        const response = await apiFetch(`/practice/exams?grade=${selectedGrade}`);
        if (!response.ok) throw new Error(t("errors.loadExams"));
        const payload: { exams: PracticeExamSummary[] } = await response.json();
        if (!active) return;
        setExams(payload.exams);
        setSelectedExamId((previous) =>
          payload.exams.some((exam) => exam.exam_id === previous) ? previous : payload.exams[0]?.exam_id ?? null,
        );
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : t("errors.loadPracticeExams"));
      } finally {
        if (active) setIsLoadingExams(false);
      }
    };

    void loadExams();
    return () => {
      active = false;
    };
  }, [apiFetch, isAuthenticated, selectedGrade, t]);

  useEffect(() => {
    if (!currentExam || !currentAttemptId || currentResult || !user) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      return;
    }

    const currentKey = stableAnswersKey(answers);
    if (currentKey === lastSavedKeyRef.current) return;

    setSaveState("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await apiFetch(`/practice/attempts/${currentAttemptId}/draft`, {
          method: "PATCH",
          body: JSON.stringify({ answers: answersRecordToList(answers) }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.detail ?? t("errors.saveDraft"));
        }
        lastSavedKeyRef.current = currentKey;
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 600);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [answers, apiFetch, currentAttemptId, currentExam, currentResult, t, user]);

  const resetWorkspace = useCallback(() => {
    setWorkspace({ mode: "browser" });
    setNotice(null);
    setSaveState("idle");
    setMissingAnswerCount(null);
    lastSavedKeyRef.current = "";
  }, []);

  const hydrateWorkspace = useCallback((exam: PracticeExamDetail, attemptId: string, nextAnswers: Record<string, number>) => {
    setWorkspace({ mode: "exam", exam, attemptId, answers: nextAnswers, questionIndex: 0 });
    setMissingAnswerCount(null);
    setSaveState("idle");
    lastSavedKeyRef.current = stableAnswersKey(nextAnswers);
  }, []);

  const startNewAttempt = useCallback(async (exam: PracticeExamDetail, startMode: "create_new" | "restart") => {
    if (!user) return;
    const response = await apiFetch("/practice/attempts", {
      method: "POST",
      body: JSON.stringify({ exam_id: exam.exam_id, start_mode: startMode }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.detail ?? t("errors.createAttempt"));
    }

    const attempt = (await response.json()) as PracticeAttemptCreateResponse;
    const nextAnswers = startMode === "restart" ? {} : readLocalDraft(user.id, exam.exam_id);
    if (startMode === "restart") window.localStorage.removeItem(draftKey(user.id, exam.exam_id));
    hydrateWorkspace(exam, attempt.attempt_id, nextAnswers);
    await refreshHistory();
  }, [apiFetch, hydrateWorkspace, refreshHistory, t, user]);

  const continueAttempt = useCallback(async (exam: PracticeExamDetail, attempt: PracticeAttemptResult) => {
    if (!user) return;
    const serverAnswers = answersListToRecord(attempt.answers);
    const localDraft = readLocalDraft(user.id, exam.exam_id);
    hydrateWorkspace(exam, attempt.attempt_id, Object.keys(serverAnswers).length > 0 ? serverAnswers : localDraft);
    setResumeChoice(null);
  }, [hydrateWorkspace, user]);

  const openExam = useCallback(async (examId = selectedExam?.exam_id) => {
    if (!examId) return;
    setIsOpeningExam(true);
    setError(null);
    setNotice(null);
    try {
      const examResponse = await apiFetch(`/practice/exams/${examId}`);
      if (!examResponse.ok) throw new Error(t("errors.openExam"));
      const exam = (await examResponse.json()) as PracticeExamDetail;

      const attemptResponse = await apiFetch(`/practice/attempts/in-progress?exam_id=${encodeURIComponent(examId)}`);
      if (!attemptResponse.ok) throw new Error(t("errors.checkInProgress"));
      const payload = (await attemptResponse.json()) as PracticeAttemptLookupResponse;
      if (payload.attempt) {
        setResumeChoice({ exam, attempt: payload.attempt });
        return;
      }
      await startNewAttempt(exam, "create_new");
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : t("errors.openExam"));
    } finally {
      setIsOpeningExam(false);
    }
  }, [apiFetch, selectedExam, startNewAttempt, t]);

  const openAttempt = useCallback(async (attemptId: string) => {
    setIsLoadingAttempt(true);
    setError(null);
    setNotice(null);
    try {
      const response = await apiFetch(`/practice/attempts/${attemptId}`);
      if (!response.ok) throw new Error(t("errors.openResult"));
      const result = (await response.json()) as PracticeAttemptResult;
      if (result.status === "in_progress") {
        const examResponse = await apiFetch(`/practice/exams/${result.exam_id}`);
        if (!examResponse.ok) throw new Error(t("errors.openExam"));
        const exam = (await examResponse.json()) as PracticeExamDetail;
        hydrateWorkspace(exam, result.attempt_id, answersListToRecord(result.answers));
      } else {
        setWorkspace({ mode: "result", result, attemptId: result.attempt_id });
      }
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : t("errors.openHistory"));
    } finally {
      setIsLoadingAttempt(false);
    }
  }, [apiFetch, hydrateWorkspace, t]);

  const chooseAnswer = useCallback((questionId: string, choiceIndex: number) => {
    if (!user) return;
    setWorkspace((previous) => {
      if (previous.mode !== "exam") return previous;
      const nextAnswers = { ...previous.answers, [questionId]: choiceIndex };
      window.localStorage.setItem(draftKey(user.id, previous.exam.exam_id), JSON.stringify(nextAnswers));
      return { ...previous, answers: nextAnswers };
    });
  }, [user]);

  const selectQuestion = useCallback((questionIndex: number) => {
    setWorkspace((previous) => previous.mode === "exam" ? { ...previous, questionIndex } : previous);
  }, []);

  const moveQuestion = useCallback((direction: -1 | 1) => {
    setWorkspace((previous) => {
      if (previous.mode !== "exam") return previous;
      const questionIndex = Math.min(Math.max(previous.questionIndex + direction, 0), previous.exam.questions.length - 1);
      return { ...previous, questionIndex };
    });
  }, []);

  const saveDraft = useCallback(async () => {
    if (!currentExam || !currentAttemptId || !user) return;
    setSaveState("saving");
    try {
      const response = await apiFetch(`/practice/attempts/${currentAttemptId}/draft`, {
        method: "PATCH",
        body: JSON.stringify({ answers: answersRecordToList(answers) }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail ?? t("errors.saveDraft"));
      }
      lastSavedKeyRef.current = stableAnswersKey(answers);
      window.localStorage.setItem(draftKey(user.id, currentExam.exam_id), JSON.stringify(answers));
      setSaveState("saved");
      setNotice(t("errors.draftSaved"));
      await refreshHistory();
    } catch (saveError) {
      setSaveState("error");
      setError(saveError instanceof Error ? saveError.message : t("errors.saveDraft"));
    }
  }, [answers, apiFetch, currentAttemptId, currentExam, refreshHistory, t, user]);

  const submitAnswers = useCallback(async () => {
    if (!currentExam || !currentAttemptId || !user) return;
    setIsSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const response = await apiFetch(`/practice/attempts/${currentAttemptId}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: answersRecordToList(answers) }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.detail ?? t("errors.submitFailed"));
      }
      const result = (await response.json()) as PracticeAttemptResult;
      window.localStorage.removeItem(draftKey(user.id, currentExam.exam_id));
      setWorkspace({ mode: "result", result, attemptId: result.attempt_id });
      setMissingAnswerCount(null);
      setSaveState("idle");
      await refreshHistory();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("errors.submitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, apiFetch, currentAttemptId, currentExam, refreshHistory, t, user]);

  const requestSubmit = useCallback(async () => {
    if (!currentExam) return;
    const missingCount = currentExam.questions.length - answeredCount;
    if (missingCount > 0) {
      setMissingAnswerCount(missingCount);
      return;
    }
    await submitAnswers();
  }, [answeredCount, currentExam, submitAnswers]);

  const restartAttempt = useCallback(async () => {
    if (!resumeChoice) return;
    try {
      await startNewAttempt(resumeChoice.exam, "restart");
      setResumeChoice(null);
    } catch (restartError) {
      setError(restartError instanceof Error ? restartError.message : t("errors.restartFailed"));
    }
  }, [resumeChoice, startNewAttempt, t]);

  const closeResume = useCallback(() => setResumeChoice(null), []);
  const closeSubmitConfirm = useCallback(() => setMissingAnswerCount(null), []);

  return {
    user,
    isAuthenticated,
    isLoading,
    mode: workspace.mode,
    grades,
    selectedGrade,
    setSelectedGrade,
    exams,
    selectedExam,
    selectExam: setSelectedExamId,
    history,
    inProgressHistory,
    submittedHistory,
    activeTab,
    setActiveTab,
    currentExam,
    currentResult,
    answers,
    answeredCount,
    currentQuestion,
    currentQuestionIndex,
    saveState,
    error,
    notice,
    isSidebarLoading: isBootstrapping || isLoadingExams,
    isOverlayVisible: isOpeningExam || isLoadingAttempt,
    isSubmitting,
    resumeChoice,
    missingAnswerCount,
    resetWorkspace,
    openExam,
    openAttempt,
    continueAttempt,
    restartAttempt,
    closeResume,
    chooseAnswer,
    selectQuestion,
    moveQuestion,
    saveDraft,
    requestSubmit,
    submitAnswers,
    closeSubmitConfirm,
  };
}

export type PracticeWorkspaceController = ReturnType<typeof usePracticeWorkspace>;
