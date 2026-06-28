'use client';

import type {
  SpeechMode,
  SpeechSpeakOptions,
  SpeechTranscriptResult,
  SpeechTranscribeOptions,
} from './speech';
import {
  DEFAULT_TTS_LOCALE,
  getSpeechModeByKind,
  isProductionRuntime,
  sanitizeSpeechText,
} from './speech';

type BrowserSpeechRecognition = {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event?: { error?: string }) => void) | null;
  onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript: string; confidence?: number }>> }) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

type BrowserWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

let hasWarnedAboutBrowserTtsInProduction = false;

export interface SpeechToTextProvider {
  mode: SpeechMode;
  isSupported: boolean;
  transcribeAudio(audio?: Blob, options?: SpeechTranscribeOptions): Promise<SpeechTranscriptResult>;
  stop(): void;
}

export interface TextToSpeechProvider {
  mode: SpeechMode;
  isSupported: boolean;
  speakText(text: string, options?: SpeechSpeakOptions): Promise<void>;
  stopSpeaking(): void;
}

export function getSpeechMode(): SpeechMode {
  return getSpeechModeByKind('tts');
}

function createBrowserSpeechToTextProvider(): SpeechToTextProvider {
  let activeRecognition: BrowserSpeechRecognition | null = null;

  return {
    mode: 'browser',
    isSupported:
      typeof window !== 'undefined' &&
      Boolean((window as BrowserWindow).SpeechRecognition || (window as BrowserWindow).webkitSpeechRecognition),
    transcribeAudio: async (_audio?: Blob, options?: SpeechTranscribeOptions) => {
      const win = window as BrowserWindow;
      const Recognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (!Recognition) {
        throw new Error('speech_not_supported');
      }

      return await new Promise<SpeechTranscriptResult>((resolve, reject) => {
        let settled = false;
        const recognition = new Recognition();
        activeRecognition = recognition;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = options?.locale ?? 'vi-VN';

        recognition.onerror = (event) => {
          if (settled) return;
          settled = true;
          activeRecognition = null;
          reject(new Error(event?.error ?? 'speech_recognition_failed'));
        };

        recognition.onresult = (event) => {
          const result = event.results?.[0]?.[0];
          if (!result || settled) return;
          settled = true;
          activeRecognition = null;
          resolve({
            transcript: result.transcript.trim(),
            confidence: result.confidence,
          });
        };

        recognition.onend = () => {
          if (settled) return;
          settled = true;
          activeRecognition = null;
          reject(new Error('speech_recognition_stopped'));
        };

        recognition.start();
      });
    },
    stop: () => {
      activeRecognition?.stop();
      activeRecognition = null;
    },
  };
}

function createServerSpeechToTextProvider(): SpeechToTextProvider {
  return {
    mode: 'server',
    isSupported: false,
    transcribeAudio: async () => {
      throw new Error('speech_server_mode_not_implemented');
    },
    stop: () => {},
  };
}

function createBrowserTextToSpeechProvider(): TextToSpeechProvider {
  return {
    mode: 'browser',
    isSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,
    speakText: async (text: string, options?: SpeechSpeakOptions) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        throw new Error('speech_not_supported');
      }

      const plainText = sanitizeSpeechText(text, options?.maxChars ?? 320);
      if (!plainText) {
        return;
      }

      return await new Promise<void>((resolve, reject) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(plainText);
        utterance.lang = options?.locale ?? DEFAULT_TTS_LOCALE;
        utterance.rate = options?.slow ? 0.82 : 0.95;
        utterance.onend = () => resolve();
        utterance.onerror = () => reject(new Error('speech_synthesis_failed'));
        window.speechSynthesis.speak(utterance);
      });
    },
    stopSpeaking: () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    },
  };
}

function createServerTextToSpeechProvider(
  apiFetch?: (path: string, options?: RequestInit) => Promise<Response>,
): TextToSpeechProvider {
  let activeAudio: HTMLAudioElement | null = null;
  let activeObjectUrl: string | null = null;

  return {
    mode: 'server',
    isSupported: typeof window !== 'undefined' && typeof Audio !== 'undefined' && Boolean(apiFetch),
    speakText: async (text: string, options?: SpeechSpeakOptions) => {
      if (!apiFetch) {
        throw new Error('speech_not_supported');
      }

      const plainText = sanitizeSpeechText(text, options?.maxChars ?? 320);
      if (!plainText) {
        return;
      }

      const response = await apiFetch('/speech/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'audio/wav',
        },
        body: JSON.stringify({
          text: plainText,
          slow: Boolean(options?.slow),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message =
          typeof payload?.detail === 'string'
            ? payload.detail
            : 'Hien chua nghe duoc loi giai. Con thu lai sau nhe.';
        throw new Error(message);
      }

      const audioBlob = await response.blob();
      if (activeAudio) {
        activeAudio.pause();
        activeAudio = null;
      }
      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl);
        activeObjectUrl = null;
      }

      activeObjectUrl = URL.createObjectURL(audioBlob);
      activeAudio = new Audio(activeObjectUrl);

      await new Promise<void>((resolve, reject) => {
        if (!activeAudio) {
          resolve();
          return;
        }

        activeAudio.onended = () => {
          if (activeObjectUrl) {
            URL.revokeObjectURL(activeObjectUrl);
            activeObjectUrl = null;
          }
          activeAudio = null;
          resolve();
        };
        activeAudio.onerror = () => {
          if (activeObjectUrl) {
            URL.revokeObjectURL(activeObjectUrl);
            activeObjectUrl = null;
          }
          activeAudio = null;
          reject(new Error('speech_synthesis_failed'));
        };
        void activeAudio.play().catch(() => reject(new Error('speech_synthesis_failed')));
      });
    },
    stopSpeaking: () => {
      if (activeAudio) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
        activeAudio = null;
      }
      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl);
        activeObjectUrl = null;
      }
    },
  };
}

export function createSpeechToTextProvider(): SpeechToTextProvider {
  return getSpeechModeByKind('stt') === 'server'
    ? createServerSpeechToTextProvider()
    : createBrowserSpeechToTextProvider();
}

export function createTextToSpeechProvider(
  apiFetch?: (path: string, options?: RequestInit) => Promise<Response>,
): TextToSpeechProvider {
  const mode = getSpeechModeByKind('tts');
  if (
    mode !== 'server' &&
    isProductionRuntime() &&
    !hasWarnedAboutBrowserTtsInProduction
  ) {
    hasWarnedAboutBrowserTtsInProduction = true;
    console.warn(
      '[TTS] NEXT_PUBLIC_TTS_MODE is not "server" in production. The app may fall back to a browser voice instead of Hoai My.',
    );
  }

  const effectiveMode =
    mode !== 'server' && isProductionRuntime()
      ? 'server'
      : mode;

  return effectiveMode === 'server'
    ? createServerTextToSpeechProvider(apiFetch)
    : createBrowserTextToSpeechProvider();
}
