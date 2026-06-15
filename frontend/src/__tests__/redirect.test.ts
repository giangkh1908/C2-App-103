import { describe, it, expect } from "vitest";
import { getSafeRedirect } from "@/lib/redirect";

describe("getSafeRedirect", () => {
  it("returns locale home when null", () => {
    expect(getSafeRedirect(null, "vi")).toBe("/vi");
  });

  it("accepts same-locale internal path", () => {
    expect(getSafeRedirect("/vi/learn", "vi")).toBe("/vi/learn");
    expect(getSafeRedirect("/en/practice?x=1", "en")).toBe("/en/practice?x=1");
  });

  it("rejects external URL", () => {
    expect(getSafeRedirect("https://evil.com/phish", "vi")).toBe("/vi");
  });

  it("rejects cross-locale redirect", () => {
    expect(getSafeRedirect("/en/learn", "vi")).toBe("/vi");
  });
});
