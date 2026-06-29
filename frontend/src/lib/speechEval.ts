'use client';

import { normalizeSpeechChoiceTranscript } from './speech';

export type SpeechEvalFlow = 'chat' | 'practice_choice' | 'failure_edge' | 'tts';

export interface SttEvalCase {
  id: string;
  grade: 1 | 2;
  flow: Exclude<SpeechEvalFlow, 'tts'>;
  prompt: string;
  concept: string;
  acceptedVariants: string[];
  conceptKeywords?: string[];
  expectedChoiceIndex?: number;
}

export interface TtsEvalCase {
  id: string;
  grade: 1 | 2;
  flow: 'tts';
  prompt: string;
  concept: string;
}

export interface SttEvalResult {
  caseId: string;
  prompt: string;
  transcript: string;
  latencyMs: number;
  exactMatch: boolean;
  variantMatch: boolean;
  conceptPreserved: boolean;
  usable: boolean;
  mappedChoiceIndex: number | null;
  expectedChoiceIndex: number | null;
  timestamp: string;
}

export interface TtsEvalRating {
  intelligibility: number;
  pronunciation: number;
  kidFriendly: number;
  notes: string;
}

export interface TtsEvalResult {
  caseId: string;
  prompt: string;
  slow: boolean;
  rating: TtsEvalRating;
  timestamp: string;
}

export interface SpeechEvalSnapshot {
  sttResults: SttEvalResult[];
  ttsResults: TtsEvalResult[];
}

const STORAGE_KEY = 'speech_eval_snapshot_v1';

export const STT_EVAL_CASES: SttEvalCase[] = [
  {
    id: 'stt_chat_compare_g1',
    grade: 1,
    flow: 'chat',
    prompt: 'So sánh 34 và 7',
    concept: 'compare_numbers',
    acceptedVariants: ['so sanh 34 va 7', 'so sanh ba muoi bon va bay'],
    conceptKeywords: ['so sanh', '34', '7'],
  },
  {
    id: 'stt_chat_place_value_g1',
    grade: 1,
    flow: 'chat',
    prompt: '24 có mấy chục mấy đơn vị',
    concept: 'place_value',
    acceptedVariants: ['24 co may chuc may don vi'],
    conceptKeywords: ['24', 'chuc', 'don vi'],
  },
  {
    id: 'stt_chat_addition_g1',
    grade: 1,
    flow: 'chat',
    prompt: 'Tính 8 cộng 5',
    concept: 'mental_math',
    acceptedVariants: ['tinh 8 cong 5', '8 cong 5'],
    conceptKeywords: ['8', 'cong', '5'],
  },
  {
    id: 'stt_practice_b',
    grade: 1,
    flow: 'practice_choice',
    prompt: 'Đáp án B',
    concept: 'practice_choice',
    acceptedVariants: ['dap an b', 'chon b', 'phuong an b'],
    expectedChoiceIndex: 1,
  },
  {
    id: 'stt_practice_c',
    grade: 2,
    flow: 'practice_choice',
    prompt: 'Chọn phương án C',
    concept: 'practice_choice',
    acceptedVariants: ['chon phuong an c', 'dap an c', 'chon c'],
    expectedChoiceIndex: 2,
  },
  {
    id: 'stt_failure_fast',
    grade: 2,
    flow: 'failure_edge',
    prompt: 'Nói nhanh: số 234 gồm mấy trăm mấy chục mấy đơn vị',
    concept: 'place_value',
    acceptedVariants: ['so 234 gom may tram may chuc may don vi'],
    conceptKeywords: ['234', 'tram', 'chuc', 'don vi'],
  },
];

export const TTS_EVAL_CASES: TtsEvalCase[] = [
  {
    id: 'tts_compare_short',
    grade: 1,
    flow: 'tts',
    prompt: 'So sánh 37 và 42',
    concept: 'compare_numbers',
  },
  {
    id: 'tts_compare_explained',
    grade: 1,
    flow: 'tts',
    prompt: 'Ba mươi bảy bé hơn bốn mươi hai vì 37 nhỏ hơn 42.',
    concept: 'compare_numbers',
  },
  {
    id: 'tts_measurement_unit',
    grade: 1,
    flow: 'tts',
    prompt: 'Độ dài bút chì là 12 cm.',
    concept: 'measurement_length',
  },
  {
    id: 'tts_time_clock',
    grade: 2,
    flow: 'tts',
    prompt: 'Đồng hồ chỉ 8 giờ 30 phút.',
    concept: 'time_clock',
  },
  {
    id: 'tts_long_explanation',
    grade: 2,
    flow: 'tts',
    prompt:
      'Muốn cộng 8 với 5, con có thể tách 5 thành 2 và 3. Cộng 8 với 2 được 10, rồi cộng tiếp 3 được 13.',
    concept: 'mental_math',
  },
];

export function normalizeEvalText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function evaluateSttCase(testCase: SttEvalCase, transcript: string, latencyMs: number): SttEvalResult {
  const normalizedTranscript = normalizeEvalText(transcript);
  const normalizedVariants = testCase.acceptedVariants.map(normalizeEvalText);
  const variantMatch = normalizedVariants.includes(normalizedTranscript);
  const conceptPreserved =
    variantMatch ||
    (testCase.conceptKeywords?.every((keyword) => normalizedTranscript.includes(normalizeEvalText(keyword))) ??
      false);
  const mappedChoiceIndex =
    testCase.expectedChoiceIndex !== undefined ? normalizeSpeechChoiceTranscript(transcript) : null;
  const exactMatch = normalizedVariants[0] === normalizedTranscript;
  const usable =
    variantMatch ||
    conceptPreserved ||
    (testCase.expectedChoiceIndex !== undefined && mappedChoiceIndex === testCase.expectedChoiceIndex);

  return {
    caseId: testCase.id,
    prompt: testCase.prompt,
    transcript,
    latencyMs,
    exactMatch,
    variantMatch,
    conceptPreserved,
    usable,
    mappedChoiceIndex,
    expectedChoiceIndex: testCase.expectedChoiceIndex ?? null,
    timestamp: new Date().toISOString(),
  };
}

function readSnapshot(): SpeechEvalSnapshot {
  if (typeof window === 'undefined') {
    return { sttResults: [], ttsResults: [] };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { sttResults: [], ttsResults: [] };
    }

    const parsed = JSON.parse(raw) as Partial<SpeechEvalSnapshot>;
    return {
      sttResults: Array.isArray(parsed.sttResults) ? parsed.sttResults : [],
      ttsResults: Array.isArray(parsed.ttsResults) ? parsed.ttsResults : [],
    };
  } catch {
    return { sttResults: [], ttsResults: [] };
  }
}

function writeSnapshot(snapshot: SpeechEvalSnapshot): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage failures in restricted browsers.
  }
}

export function getSpeechEvalSnapshot(): SpeechEvalSnapshot {
  return readSnapshot();
}

export function saveSttEvalResult(result: SttEvalResult): SpeechEvalSnapshot {
  const current = readSnapshot();
  const next: SpeechEvalSnapshot = {
    ...current,
    sttResults: [...current.sttResults.filter((item) => item.caseId !== result.caseId), result],
  };
  writeSnapshot(next);
  return next;
}

export function saveTtsEvalResult(result: TtsEvalResult): SpeechEvalSnapshot {
  const current = readSnapshot();
  const next: SpeechEvalSnapshot = {
    ...current,
    ttsResults: [
      ...current.ttsResults.filter(
        (item) => !(item.caseId === result.caseId && item.slow === result.slow),
      ),
      result,
    ],
  };
  writeSnapshot(next);
  return next;
}

export function clearSpeechEvalSnapshot(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures in restricted browsers.
  }
}
