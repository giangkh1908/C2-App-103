import { describe, expect, it } from "vitest";

import { STT_EVAL_CASES, evaluateSttCase, normalizeEvalText } from "@/lib/speechEval";

describe("speech eval helpers", () => {
  it("normalizes Vietnamese text for eval matching", () => {
    expect(normalizeEvalText("So sánh 34 và 7")).toBe("so sanh 34 va 7");
  });

  it("marks a matching transcript as usable", () => {
    const testCase = STT_EVAL_CASES[0];
    const result = evaluateSttCase(testCase, "So sánh 34 và 7", 1200);

    expect(result.variantMatch).toBe(true);
    expect(result.usable).toBe(true);
  });

  it("scores practice choice mapping correctly", () => {
    const testCase = STT_EVAL_CASES.find((item) => item.expectedChoiceIndex === 1);
    expect(testCase).toBeDefined();

    const result = evaluateSttCase(testCase!, "Đáp án B", 900);
    expect(result.mappedChoiceIndex).toBe(1);
    expect(result.usable).toBe(true);
  });
});
