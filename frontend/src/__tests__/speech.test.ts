import { describe, expect, it } from "vitest";

import { normalizeSpeechChoiceTranscript, sanitizeSpeechText } from "@/lib/speech";

describe("speech helpers", () => {
  it("sanitizes markdown and links before reading aloud", () => {
    expect(
      sanitizeSpeechText("**Xem** [ví dụ](https://example.com) tại đây: https://openai.com", 120),
    ).toBe("Xem ví dụ tại đây:");
  });

  it("maps Vietnamese spoken answer choices to indexes", () => {
    expect(normalizeSpeechChoiceTranscript("đáp án B")).toBe(1);
    expect(normalizeSpeechChoiceTranscript("chon 3")).toBe(2);
    expect(normalizeSpeechChoiceTranscript("phương án D")).toBe(3);
  });

  it("returns null when the transcript is ambiguous", () => {
    expect(normalizeSpeechChoiceTranscript("mình chưa chắc")).toBeNull();
  });
});
