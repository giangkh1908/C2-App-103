import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createSpeechToTextProvider, createTextToSpeechProvider } from "@/lib/speechProvider";

describe("speech providers", () => {
  const originalSttMode = process.env.NEXT_PUBLIC_STT_MODE;
  const originalTtsMode = process.env.NEXT_PUBLIC_TTS_MODE;
  const originalNodeEnv = process.env.NODE_ENV;
  const OriginalAudio = globalThis.Audio;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setEnv(name: string, value: string | undefined): void {
    (process.env as Record<string, string | undefined>)[name] = value;
  }

  function createResponseLike<T extends Blob | Record<string, unknown>>({
    ok,
    status,
    blob,
    json,
  }: {
    ok: boolean;
    status: number;
    blob?: T extends Blob ? () => Promise<Blob> : () => Promise<Blob>;
    json?: () => Promise<Record<string, unknown> | null>;
  }): Response {
    return {
      ok,
      status,
      blob: blob ?? (async () => new Blob([], { type: "audio/wav" })),
      json: json ?? (async () => null),
    } as Response;
  }

  afterAll(() => {
    setEnv("NEXT_PUBLIC_STT_MODE", originalSttMode);
    setEnv("NEXT_PUBLIC_TTS_MODE", originalTtsMode);
    setEnv("NODE_ENV", originalNodeEnv);
    globalThis.Audio = OriginalAudio;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("uses browser mode for STT when configured separately from TTS", () => {
    setEnv("NEXT_PUBLIC_STT_MODE", "browser");
    setEnv("NEXT_PUBLIC_TTS_MODE", "server");

    const provider = createSpeechToTextProvider();
    expect(provider.mode).toBe("browser");
  });

  it("calls the backend tts endpoint and plays the returned audio", async () => {
    setEnv("NEXT_PUBLIC_STT_MODE", "browser");
    setEnv("NEXT_PUBLIC_TTS_MODE", "server");

    const audioBlob = new Blob(["audio"], { type: "audio/wav" });
    const apiFetch = vi.fn().mockResolvedValue(
      createResponseLike({
        ok: true,
        status: 200,
        blob: async () => audioBlob,
      }),
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

  it("forces server tts in production even when the public mode is set to browser", async () => {
    setEnv("NODE_ENV", "production");
    setEnv("NEXT_PUBLIC_STT_MODE", "browser");
    setEnv("NEXT_PUBLIC_TTS_MODE", "browser");

    const audioBlob = new Blob(["audio"], { type: "audio/wav" });
    const apiFetch = vi.fn().mockResolvedValue(
      createResponseLike({
        ok: true,
        status: 200,
        blob: async () => audioBlob,
      }),
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
    await provider.speakText("Xin chao");

    expect(provider.mode).toBe("server");
    expect(apiFetch).toHaveBeenCalledWith(
      "/speech/tts",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("surfaces the safer server tts fallback message when the backend returns an unknown error", async () => {
    setEnv("NEXT_PUBLIC_STT_MODE", "browser");
    setEnv("NEXT_PUBLIC_TTS_MODE", "server");

    const apiFetch = vi.fn().mockResolvedValue(
      createResponseLike({
        ok: false,
        status: 502,
        json: async () => null,
      }),
    );

    const provider = createTextToSpeechProvider(apiFetch);

    await expect(provider.speakText("Xin chao")).rejects.toThrow(
      "Hien chua nghe duoc loi giai. Con thu lai sau nhe.",
    );
  });
});
