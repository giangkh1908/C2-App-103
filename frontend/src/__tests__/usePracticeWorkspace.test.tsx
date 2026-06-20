import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import usePracticeWorkspace from "@/components/practice/usePracticeWorkspace";

const mocks = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock("@/hooks/useAuth", () => ({ useAuth: mocks.useAuth }));
vi.mock("next-intl", () => {
  const translate = (key: string) => key;
  return { useTranslations: () => translate };
});

function response(payload: unknown, ok = true) {
  return { ok, json: vi.fn().mockResolvedValue(payload) } as unknown as Response;
}

const examSummary = {
  exam_id: "exam-1",
  title: "Đề số 1",
  grade: 1,
  question_count: 1,
  preview_text: "1 + 1 = ?",
  attempt_status: "not_started" as const,
};

const examDetail = {
  ...examSummary,
  source: "dataset",
  source_row_id: "1",
  source_split: "train",
  tags: [],
  is_active: true,
  curation_status: "approved",
  questions: [{ question_id: "q1", question_text: "1 + 1 = ?", choices: ["1", "2"], correct_choice_index: 1, explanation: "" }],
};

describe("usePracticeWorkspace", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it("loads the catalog and does not create an attempt until the open action", async () => {
    const apiFetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/practice/grades") return response({ grades: [{ grade: 1, exam_count: 1 }] });
      if (url === "/practice/attempts" && init?.method === "POST") return response({ attempt_id: "attempt-1", started_at: "2026-01-01", exam: examDetail });
      if (url === "/practice/attempts") return response({ attempts: [] });
      if (url === "/practice/exams?grade=1") return response({ exams: [examSummary] });
      if (url === "/practice/exams/exam-1") return response(examDetail);
      if (url.startsWith("/practice/attempts/in-progress")) return response({ attempt: null });
      throw new Error(`Unexpected request: ${url}`);
    });
    mocks.useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true, isLoading: false, apiFetch });

    const { result } = renderHook(() => usePracticeWorkspace());
    await waitFor(() => expect(result.current.exams).toHaveLength(1));
    expect(apiFetch.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);

    await act(async () => void (await result.current.openExam()));
    expect(result.current.mode).toBe("exam");
    expect(result.current.currentExam?.exam_id).toBe("exam-1");
    expect(apiFetch.mock.calls.some(([, init]) => init?.method === "POST")).toBe(true);
  });

  it("restarts with an empty answer set instead of restoring the stale local draft", async () => {
    const inProgressAttempt = {
      attempt_id: "old-attempt",
      exam_id: "exam-1",
      exam_title: "Đề số 1",
      grade: 1,
      status: "in_progress",
      started_at: "2026-01-01",
      updated_at: "2026-01-01",
      submitted_at: null,
      result_summary: null,
      answers: [{ question_id: "q1", selected_choice_index: 1 }],
      questions: examDetail.questions.map((question) => ({ ...question, selected_choice_index: 1, is_correct: true })),
    };
    const apiFetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === "/practice/grades") return response({ grades: [{ grade: 1, exam_count: 1 }] });
      if (url === "/practice/attempts" && init?.method === "POST") return response({ attempt_id: "new-attempt", started_at: "2026-01-02", exam: examDetail });
      if (url === "/practice/attempts") return response({ attempts: [] });
      if (url === "/practice/exams?grade=1") return response({ exams: [examSummary] });
      if (url === "/practice/exams/exam-1") return response(examDetail);
      if (url.startsWith("/practice/attempts/in-progress")) return response({ attempt: inProgressAttempt });
      throw new Error(`Unexpected request: ${url}`);
    });
    mocks.useAuth.mockReturnValue({ user: { id: "user-1" }, isAuthenticated: true, isLoading: false, apiFetch });
    window.localStorage.setItem("practice_draft_user-1_exam-1", JSON.stringify({ q1: 1 }));

    const { result } = renderHook(() => usePracticeWorkspace());
    await waitFor(() => expect(result.current.exams).toHaveLength(1));
    await act(async () => void (await result.current.openExam()));
    expect(result.current.resumeChoice).not.toBeNull();
    await act(async () => void (await result.current.restartAttempt()));

    expect(result.current.mode).toBe("exam");
    expect(result.current.answers).toEqual({});
    expect(window.localStorage.getItem("practice_draft_user-1_exam-1")).toBeNull();
  });
});
