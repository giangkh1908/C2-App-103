'use client';

export type SpeechMode = 'browser' | 'server';
export const DEFAULT_TTS_LOCALE = 'vi-VN';

export function getSpeechModeByKind(kind: 'stt' | 'tts'): SpeechMode {
  const envValue =
    kind === 'stt'
      ? process.env.NEXT_PUBLIC_STT_MODE
      : process.env.NEXT_PUBLIC_TTS_MODE;
  return envValue === 'server' ? 'server' : 'browser';
}

export interface SpeechTranscriptResult {
  transcript: string;
  confidence?: number;
}

export interface SpeechSpeakOptions {
  locale?: string;
  slow?: boolean;
  maxChars?: number;
}

export interface SpeechTranscribeOptions {
  locale?: string;
}

export function sanitizeSpeechText(text: string, maxChars = 320): string {
  const flattened = text
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/[`*_>#-]/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (flattened.length <= maxChars) {
    return flattened;
  }

  const shortened = flattened.slice(0, maxChars);
  const lastPunctuation = Math.max(
    shortened.lastIndexOf('.'),
    shortened.lastIndexOf('!'),
    shortened.lastIndexOf('?'),
    shortened.lastIndexOf(','),
  );

  if (lastPunctuation > Math.floor(maxChars * 0.55)) {
    return shortened.slice(0, lastPunctuation + 1).trim();
  }

  return `${shortened.trim()}...`;
}

function normalizeVietnamese(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeSpeechChoiceTranscript(transcript: string): number | null {
  const normalized = normalizeVietnamese(transcript);
  if (!normalized) return null;

  const exactMap = new Map<string, number>([
    ['a', 0],
    ['1', 0],
    ['b', 1],
    ['be', 1],
    ['bi', 1],
    ['2', 1],
    ['c', 2],
    ['xi', 2],
    ['si', 2],
    ['3', 2],
    ['d', 3],
    ['de', 3],
    ['di', 3],
    ['4', 3],
  ]);

  if (exactMap.has(normalized)) {
    return exactMap.get(normalized) ?? null;
  }

  const patterns: Array<[RegExp, number]> = [
    [/\b(dap an|chon|lua chon|phuong an)\s+a\b/, 0],
    [/\b(dap an|chon|lua chon|phuong an)\s+(b|be|bi)\b/, 1],
    [/\b(dap an|chon|lua chon|phuong an)\s+(c|xi|si)\b/, 2],
    [/\b(dap an|chon|lua chon|phuong an)\s+(d|de|di)\b/, 3],
    [/\b(dap an|chon|lua chon|phuong an)\s+1\b/, 0],
    [/\b(dap an|chon|lua chon|phuong an)\s+2\b/, 1],
    [/\b(dap an|chon|lua chon|phuong an)\s+3\b/, 2],
    [/\b(dap an|chon|lua chon|phuong an)\s+4\b/, 3],
  ];

  const matches = patterns
    .filter(([pattern]) => pattern.test(normalized))
    .map(([, index]) => index);

  if (matches.length === 1) {
    return matches[0];
  }

  return null;
}
