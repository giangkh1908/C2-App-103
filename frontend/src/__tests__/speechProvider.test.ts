import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createSpeechToTextProvider, createTextToSpeechProvider } from "@/lib/speechProvider";

describe("speech providers", () => {
  const originalSttMode = process.env.NEXT_PUBLIC_STT_MODE;
  const originalTtsMode = process.env.NEXT_PUBLIC_TTS_MODE;
  const OriginalAudio = globalThis.Audio;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_STT_MODE = originalSttMode;
    process.env.NEXT_PUBLIC_TTS_MODE = originalTtsMode;
    globalThis.Audio = OriginalAudio;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("uses browser mode for STT when configured separately from TTS", () => {
    process.env.NEXT_PUBLIC_STT_MODE = "browser";
    process.env.NEXT_PUBLIC_TTS_MODE = "server";

    const provider = createSpeechToTextProvider();
    expect(provider.mode).toBe("browser");
  });

  it("calls the backend tts endpoint and plays the returned audio", async () => {
    process.env.NEXT_PUBLIC_STT_MODE = "browser";
    process.env.NEXT_PUBLIC_TTS_MODE = "server";

    const apiFetch = vi.fn().mockResolvedValue(
      new Response(new Blob(["audio"], { type: "audio/wav" }), { status: 200 }),
    );

    URL.createObjectURL = vi.fn(() => "blob:tts");
    URL.revokeObjectURL = vi.fn();

    class MockAudio {
      currentTime = 0;
      onended: (() => void) | null = null;
      onerror: (() => void) | null = null;
      pause = vi.fn();
      play = vi.fn().mockImplementation(async () => {
        this.onended?.();
      });
    }

    // @ts-expect-error test double
    globalThis.Audio = MockAudio;

    const provider = createTextToSpeechProvider(apiFetch);
    await provider.speakText("Xin chao", { slow: true });

    expect(provider.mode).toBe("server");
    expect(apiFetch).toHaveBeenCalledWith(
      "/speech/tts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ text: "Xin chao", slow: true }),
      }),
    );
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });

  it("surfaces the safer server tts fallback message when the backend returns an unknown error", async () => {
    process.env.NEXT_PUBLIC_STT_MODE = "browser";
    process.env.NEXT_PUBLIC_TTS_MODE = "server";

    const apiFetch = vi.fn().mockResolvedValue(
      new Response("nope", { status: 502, headers: { "Content-Type": "text/plain" } }),
    );

    const provider = createTextToSpeechProvider(apiFetch);

    await expect(provider.speakText("Xin chao")).rejects.toThrow(
      "Hien chua nghe duoc loi giai. Con thu lai sau nhe.",
    );
  });
});
