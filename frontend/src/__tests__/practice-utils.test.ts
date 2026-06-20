import { beforeEach, describe, expect, it } from "vitest";
import {
  answersListToRecord,
  answersRecordToList,
  attemptStatusKey,
  draftKey,
  progressPercent,
  readLocalDraft,
  stableAnswersKey,
} from "@/components/practice/practice-utils";

describe("practice utilities", () => {
  beforeEach(() => window.localStorage.clear());

  it("converts answer records without retaining unanswered values", () => {
    const list = answersRecordToList({ q2: 1, q1: null });
    expect(list).toEqual([
      { question_id: "q2", selected_choice_index: 1 },
      { question_id: "q1", selected_choice_index: null },
    ]);
    expect(answersListToRecord(list)).toEqual({ q2: 1 });
  });

  it("creates stable keys independent of object insertion order", () => {
    expect(stableAnswersKey({ q2: 1, q1: 0 })).toBe(stableAnswersKey({ q1: 0, q2: 1 }));
  });

  it("reads valid drafts and ignores malformed local data", () => {
    window.localStorage.setItem(draftKey("u1", "e1"), JSON.stringify({ q1: 2 }));
    expect(readLocalDraft("u1", "e1")).toEqual({ q1: 2 });
    window.localStorage.setItem(draftKey("u1", "e1"), "not-json");
    expect(readLocalDraft("u1", "e1")).toEqual({});
  });

  it("maps progress and attempt status", () => {
    expect(progressPercent(2, 5)).toBe(40);
    expect(progressPercent(0, 0)).toBe(0);
    expect(attemptStatusKey("in_progress")).toBe("inProgress");
    expect(attemptStatusKey("submitted_recently")).toBe("submittedRecent");
    expect(attemptStatusKey("not_started")).toBe("notAttempted");
  });
});
