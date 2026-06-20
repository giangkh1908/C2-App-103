import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PracticeBrowserView from "@/components/practice/PracticeBrowserView";

vi.mock("next-intl", () => {
  const translate = (key: string, values?: Record<string, string | number>) => values ? `${key}:${Object.values(values).join("-")}` : key;
  return { useLocale: () => "vi", useTranslations: () => translate };
});

const exam = {
  exam_id: "exam-1",
  title: "Đề số 1",
  grade: 1,
  question_count: 5,
  preview_text: "1 + 1 = ?",
  attempt_status: "not_started" as const,
};

describe("PracticeBrowserView", () => {
  it("keeps exam selection separate from the open action", () => {
    const onSelectExam = vi.fn();
    const onOpenExam = vi.fn();
    render(
      <PracticeBrowserView
        grades={[{ grade: 1, exam_count: 1 }]}
        selectedGrade={1}
        onSelectGrade={vi.fn()}
        exams={[exam]}
        selectedExam={exam}
        onSelectExam={onSelectExam}
        onOpenExam={onOpenExam}
        activeTab="exams"
        onChangeTab={vi.fn()}
        inProgressHistory={[]}
        submittedHistory={[]}
        onOpenAttempt={vi.fn()}
        isLoading={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Đề số 1/ }));
    expect(onSelectExam).toHaveBeenCalledWith("exam-1");
    expect(onOpenExam).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "sidebar.openExam" }));
    expect(onOpenExam).toHaveBeenCalledOnce();
  });

  it("exposes the exam and history controls as accessible tabs", () => {
    const onChangeTab = vi.fn();
    render(
      <PracticeBrowserView
        grades={[]}
        selectedGrade={null}
        onSelectGrade={vi.fn()}
        exams={[]}
        selectedExam={null}
        onSelectExam={vi.fn()}
        onOpenExam={vi.fn()}
        activeTab="exams"
        onChangeTab={onChangeTab}
        inProgressHistory={[]}
        submittedHistory={[]}
        onOpenAttempt={vi.fn()}
        isLoading={false}
      />,
    );

    expect(screen.getByRole("tab", { name: "sidebar.tabs.exams" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("tab", { name: "sidebar.tabs.history" }));
    expect(onChangeTab).toHaveBeenCalledWith("history");
  });
});
