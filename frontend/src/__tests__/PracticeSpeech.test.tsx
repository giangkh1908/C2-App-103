import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PracticeExamView from "@/components/practice/PracticeExamView";
import PracticeResultView from "@/components/practice/PracticeResultView";

const mocks = vi.hoisted(() => ({
  useSpeechToText: vi.fn(),
  useTextToSpeech: vi.fn(),
  useAuth: vi.fn(),
}));

vi.mock("next-intl", () => {
  const translate = (key: string, values?: Record<string, string | number>) =>
    values ? `${key}:${Object.values(values).join("-")}` : key;
  return { useLocale: () => "vi", useTranslations: () => translate };
});

vi.mock("@/hooks/useSpeechToText", () => ({
  useSpeechToText: mocks.useSpeechToText,
}));

vi.mock("@/hooks/useTextToSpeech", () => ({
  useTextToSpeech: mocks.useTextToSpeech,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: mocks.useAuth,
}));

const exam = {
  exam_id: "exam-1",
  title: "Đề số 1",
  grade: 1,
  question_count: 1,
  preview_text: "1 + 1 = ?",
  attempt_status: "not_started" as const,
  source: "dataset",
  source_row_id: "1",
  source_split: "train",
  tags: [],
  is_active: true,
  curation_status: "approved",
  questions: [
    {
      question_id: "q1",
      question_text: "1 + 1 = ?",
      choices: ["1", "2", "3", "4"],
      correct_choice_index: 1,
      explanation: "Vì 1 cộng 1 bằng 2.",
    },
  ],
};

const result = {
  attempt_id: "attempt-1",
  exam_id: "exam-1",
  exam_title: "Đề số 1",
  grade: 1,
  status: "submitted",
  started_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  submitted_at: "2026-01-01T00:00:00Z",
  result_summary: {
    score: 10,
    correct_count: 1,
    total_count: 1,
    badge_label: "Tốt lắm",
  },
  answers: [{ question_id: "q1", selected_choice_index: 1 }],
  questions: [
    {
      question_id: "q1",
      question_text: "1 + 1 = ?",
      choices: ["1", "2", "3", "4"],
      selected_choice_index: 1,
      correct_choice_index: 1,
      is_correct: true,
      explanation: "Vì 1 cộng 1 bằng 2.",
    },
  ],
};

describe("practice speech flows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useAuth.mockReturnValue({ apiFetch: vi.fn() });
    mocks.useSpeechToText.mockReturnValue({
      mode: "browser",
      isSupported: true,
      isRecording: false,
      error: null,
      transcribe: vi.fn().mockResolvedValue({ transcript: "đáp án B" }),
      stop: vi.fn(),
      clearError: vi.fn(),
    });
    mocks.useTextToSpeech.mockReturnValue({
      mode: "server",
      isSupported: true,
      isSpeaking: false,
      error: null,
      speak: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      clearError: vi.fn(),
    });
  });

  it("fills a spoken answer and waits for confirmation before choosing", async () => {
    const onChooseAnswer = vi.fn();

    render(
      <PracticeExamView
        exam={exam}
        currentQuestion={exam.questions[0]}
        currentQuestionIndex={0}
        answers={{}}
        answeredCount={0}
        saveState="idle"
        isSubmitting={false}
        onExit={vi.fn()}
        onSelectQuestion={vi.fn()}
        onMoveQuestion={vi.fn()}
        onChooseAnswer={onChooseAnswer}
        onSave={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Nói đáp án/i }));

    await waitFor(() => expect(screen.getByText(/Con vừa nói:/i)).not.toBeNull());
    expect(screen.getByText("đáp án B")).not.toBeNull();
    expect(onChooseAnswer).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Xác nhận đáp án/i }));
    expect(onChooseAnswer).toHaveBeenCalledWith("q1", 1);
  });

  it("does not auto-select when the spoken answer cannot be mapped", async () => {
    mocks.useSpeechToText.mockReturnValue({
      mode: "browser",
      isSupported: true,
      isRecording: false,
      error: null,
      transcribe: vi.fn().mockResolvedValue({ transcript: "mình không chắc" }),
      stop: vi.fn(),
      clearError: vi.fn(),
    });

    const onChooseAnswer = vi.fn();

    render(
      <PracticeExamView
        exam={exam}
        currentQuestion={exam.questions[0]}
        currentQuestionIndex={0}
        answers={{}}
        answeredCount={0}
        saveState="idle"
        isSubmitting={false}
        onExit={vi.fn()}
        onSelectQuestion={vi.fn()}
        onMoveQuestion={vi.fn()}
        onChooseAnswer={onChooseAnswer}
        onSave={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Nói đáp án/i }));

    await waitFor(() => expect(screen.getByText("mình không chắc")).not.toBeNull());
    expect(screen.queryByRole("button", { name: /Xác nhận đáp án/i })).toBeNull();
    expect(screen.getByText(/Nói lại hoặc chọn tay/i)).not.toBeNull();
    expect(onChooseAnswer).not.toHaveBeenCalled();
  });

  it("reads the explanation aloud from the result view", async () => {
    const speak = vi.fn().mockResolvedValue(undefined);
    mocks.useTextToSpeech.mockReturnValue({
      mode: "browser",
      isSupported: true,
      isSpeaking: false,
      error: null,
      speak,
      stop: vi.fn(),
      clearError: vi.fn(),
    });

    render(<PracticeResultView result={result} onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Nghe giải thích/i }));

    await waitFor(() =>
      expect(speak).toHaveBeenCalledWith("1 + 1 = ?. Vì 1 cộng 1 bằng 2.", { slow: false, maxChars: 320 }),
    );
  });
});
