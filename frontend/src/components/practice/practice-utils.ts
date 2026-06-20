import type { PracticeAttemptSubmitAnswer, PracticeExamSummary } from "@/types";

export type SaveState = "idle" | "saving" | "saved" | "error";
export type PracticeTab = "exams" | "history";

export function formatDateTime(value: string | null, locale: string): string {
  if (!value) return "";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function draftKey(userId: string, examId: string): string {
  return `practice_draft_${userId}_${examId}`;
}

export function progressPercent(answeredCount: number, totalCount: number): number {
  if (!totalCount) return 0;
  return Math.round((answeredCount / totalCount) * 100);
}

export function answersRecordToList(answers: Record<string, number | null>): PracticeAttemptSubmitAnswer[] {
  return Object.entries(answers).map(([question_id, selected_choice_index]) => ({
    question_id,
    selected_choice_index,
  }));
}

export function answersListToRecord(answers: PracticeAttemptSubmitAnswer[]): Record<string, number> {
  const record: Record<string, number> = {};
  for (const answer of answers) {
    if (answer.selected_choice_index !== null && answer.selected_choice_index !== undefined) {
      record[answer.question_id] = answer.selected_choice_index;
    }
  }
  return record;
}

export function stableAnswersKey(answers: Record<string, number>): string {
  return JSON.stringify(
    Object.entries(answers)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([questionId, choiceIndex]) => [questionId, choiceIndex]),
  );
}

export function readLocalDraft(userId: string, examId: string): Record<string, number> {
  try {
    const value = window.localStorage.getItem(draftKey(userId, examId));
    return value ? (JSON.parse(value) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function attemptStatusKey(status: PracticeExamSummary["attempt_status"]): "inProgress" | "submittedRecent" | "notAttempted" {
  if (status === "in_progress") return "inProgress";
  if (status === "submitted_recently") return "submittedRecent";
  return "notAttempted";
}
