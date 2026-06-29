'use client';

export type SpeechTelemetryEventName =
  | 'stt_start'
  | 'stt_success'
  | 'stt_error'
  | 'tts_click'
  | 'tts_play_start'
  | 'tts_play_end'
  | 'tts_error';

export interface SpeechTelemetryEvent {
  event: SpeechTelemetryEventName;
  timestamp: string;
  mode?: 'browser' | 'server';
  source?: string;
  caseId?: string;
  locale?: string;
  durationMs?: number;
  transcriptLength?: number;
  textLength?: number;
  audioBytes?: number;
  slow?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

const STORAGE_KEY = 'speech_eval_events_v1';

declare global {
  interface Window {
    __speechEvalEvents?: SpeechTelemetryEvent[];
  }
}

function readStoredEvents(): SpeechTelemetryEvent[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SpeechTelemetryEvent[]) : [];
  } catch {
    return [];
  }
}

function writeStoredEvents(events: SpeechTelemetryEvent[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Ignore storage failures in restricted browsers.
  }
}

export function recordSpeechTelemetry(event: Omit<SpeechTelemetryEvent, 'timestamp'>): SpeechTelemetryEvent {
  const nextEvent: SpeechTelemetryEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    const current = window.__speechEvalEvents ?? readStoredEvents();
    const nextEvents = [...current, nextEvent].slice(-500);
    window.__speechEvalEvents = nextEvents;
    writeStoredEvents(nextEvents);
  }

  console.info('[speech-eval]', nextEvent);
  return nextEvent;
}

export function getSpeechTelemetryEvents(): SpeechTelemetryEvent[] {
  if (typeof window === 'undefined') {
    return [];
  }

  if (window.__speechEvalEvents) {
    return window.__speechEvalEvents;
  }

  const stored = readStoredEvents();
  window.__speechEvalEvents = stored;
  return stored;
}

export function clearSpeechTelemetryEvents(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.__speechEvalEvents = [];
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures in restricted browsers.
  }
}
