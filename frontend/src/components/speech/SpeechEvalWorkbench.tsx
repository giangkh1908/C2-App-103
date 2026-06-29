'use client';

import { useMemo, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import {
  STT_EVAL_CASES,
  TTS_EVAL_CASES,
  type SpeechEvalSnapshot,
  type SttEvalCase,
  type TtsEvalCase,
  clearSpeechEvalSnapshot,
  evaluateSttCase,
  getSpeechEvalSnapshot,
  saveSttEvalResult,
  saveTtsEvalResult,
} from '@/lib/speechEval';
import { getSpeechTelemetryEvents, clearSpeechTelemetryEvents, type SpeechTelemetryEvent } from '@/lib/speechTelemetry';
import { DEFAULT_TTS_LOCALE } from '@/lib/speech';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

type TtsRatingDraft = {
  intelligibility: number;
  pronunciation: number;
  kidFriendly: number;
  notes: string;
};

type NumericRatingKey = 'intelligibility' | 'pronunciation' | 'kidFriendly';

const DEFAULT_RATING: TtsRatingDraft = {
  intelligibility: 3,
  pronunciation: 3,
  kidFriendly: 3,
  notes: '',
};

function buildExportPayload(snapshot: SpeechEvalSnapshot) {
  return {
    exportedAt: new Date().toISOString(),
    baseline: {
      sttMode: process.env.NEXT_PUBLIC_STT_MODE ?? 'browser',
      ttsMode: process.env.NEXT_PUBLIC_TTS_MODE ?? 'browser',
      ttsLocale: DEFAULT_TTS_LOCALE,
    },
    dataset: {
      sttCases: STT_EVAL_CASES,
      ttsCases: TTS_EVAL_CASES,
    },
    results: snapshot,
    telemetry: getSpeechTelemetryEvents(),
  };
}

export default function SpeechEvalWorkbench() {
  const { apiFetch } = useAuth();
  const speechLocale = 'vi-VN';
  const [snapshot, setSnapshot] = useState<SpeechEvalSnapshot>(() => getSpeechEvalSnapshot());
  const [activeSttCaseId, setActiveSttCaseId] = useState<string | null>(null);
  const [activeTtsCaseKey, setActiveTtsCaseKey] = useState<string | null>(null);
  const [ratingDrafts, setRatingDrafts] = useState<Record<string, TtsRatingDraft>>({});
  const {
    isSupported: isSpeechToTextSupported,
    isRecording,
    transcribe,
    error: speechToTextError,
  } = useSpeechToText(speechLocale, { source: 'speech_eval' });
  const {
    isSupported: isTextToSpeechSupported,
    isSpeaking,
    speak,
    error: textToSpeechError,
  } = useTextToSpeech(DEFAULT_TTS_LOCALE, apiFetch, { source: 'speech_eval' });

  const sttSummary = useMemo(() => {
    const usableCount = snapshot.sttResults.filter((result) => result.usable).length;
    const choiceResults = snapshot.sttResults.filter((result) => result.expectedChoiceIndex !== null);
    const correctChoices = choiceResults.filter(
      (result) => result.mappedChoiceIndex === result.expectedChoiceIndex,
    ).length;

    return {
      tested: snapshot.sttResults.length,
      usableRate:
        snapshot.sttResults.length === 0 ? 0 : Math.round((usableCount / snapshot.sttResults.length) * 100),
      choiceAccuracy:
        choiceResults.length === 0 ? 0 : Math.round((correctChoices / choiceResults.length) * 100),
    };
  }, [snapshot.sttResults]);

  const ttsSummary = useMemo(() => {
    const allRatings = snapshot.ttsResults;
    const average = (key: NumericRatingKey) =>
      allRatings.length === 0
        ? 0
        : Number(
            (
              allRatings.reduce((sum, item) => sum + item.rating[key], 0) / allRatings.length
            ).toFixed(2),
          );

    return {
      tested: allRatings.length,
      intelligibility: average('intelligibility'),
      pronunciation: average('pronunciation'),
      kidFriendly: average('kidFriendly'),
    };
  }, [snapshot.ttsResults]);

  const handleRunSttCase = async (testCase: SttEvalCase) => {
    setActiveSttCaseId(testCase.id);
    const transcriptResult = await transcribe({ source: 'speech_eval', caseId: testCase.id });
    setActiveSttCaseId(null);

    if (!transcriptResult?.transcript) {
      return;
    }

    const telemetryEvents = getSpeechTelemetryEvents();
    const matchingEvent = [...telemetryEvents]
      .reverse()
      .find(
        (event: SpeechTelemetryEvent) =>
          event.event === 'stt_success' && event.caseId === testCase.id,
      );
    const result = evaluateSttCase(
      testCase,
      transcriptResult.transcript,
      matchingEvent?.durationMs ?? 0,
    );
    setSnapshot(saveSttEvalResult(result));
  };

  const handlePlayTtsCase = async (testCase: TtsEvalCase, slow: boolean) => {
    const key = `${testCase.id}:${slow ? 'slow' : 'normal'}`;
    setActiveTtsCaseKey(key);
    await speak(testCase.prompt, {
      slow,
      maxChars: 360,
      source: 'speech_eval',
      caseId: key,
    });
    setActiveTtsCaseKey(null);
  };

  const handleRatingChange = (key: string, next: Partial<TtsRatingDraft>) => {
    setRatingDrafts((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? DEFAULT_RATING),
        ...next,
      },
    }));
  };

  const handleSaveTtsRating = (testCase: TtsEvalCase, slow: boolean) => {
    const key = `${testCase.id}:${slow ? 'slow' : 'normal'}`;
    const rating = ratingDrafts[key] ?? DEFAULT_RATING;
    setSnapshot(
      saveTtsEvalResult({
        caseId: testCase.id,
        prompt: testCase.prompt,
        slow,
        rating,
        timestamp: new Date().toISOString(),
      }),
    );
  };

  const handleExport = () => {
    const payload = buildExportPayload(snapshot);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `speech-eval-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  };

  const handleClearAll = () => {
    clearSpeechEvalSnapshot();
    clearSpeechTelemetryEvents();
    setSnapshot({ sttResults: [], ttsResults: [] });
    setRatingDrafts({});
  };

  return (
    <main className="min-h-screen bg-[#F6F2EA] px-4 py-6 text-[#203049] sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[28px] border border-[#DED7C8] bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#5A7A4B]">Speech Eval</p>
          <h1 className="mt-3 text-3xl font-black">TTS/STT Evaluation Workbench</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5E675F]">
            Trang nay dung dung luong hien tai cua app de do STT browser va TTS server-side Hoai My.
            Ket qua duoc luu cuc bo trong trinh duyet de nhom co the export evidence JSON sau moi buoi test.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-[#F8F4EC] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#5A7A4B]">STT mode</p>
              <p className="mt-2 text-lg font-black">{isSpeechToTextSupported ? 'browser' : 'unsupported'}</p>
            </div>
            <div className="rounded-2xl bg-[#F8F4EC] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#5A7A4B]">TTS mode</p>
              <p className="mt-2 text-lg font-black">{isTextToSpeechSupported ? 'server' : 'unsupported'}</p>
            </div>
            <div className="rounded-2xl bg-[#F8F4EC] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#5A7A4B]">STT usable rate</p>
              <p className="mt-2 text-lg font-black">{sttSummary.usableRate}%</p>
            </div>
            <div className="rounded-2xl bg-[#F8F4EC] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#5A7A4B]">Choice accuracy</p>
              <p className="mt-2 text-lg font-black">{sttSummary.choiceAccuracy}%</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExport}
              className="rounded-xl bg-[#587849] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#4B693E]"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="rounded-xl border border-[#D9D4C7] bg-white px-4 py-2 text-sm font-bold text-[#59635C] transition hover:bg-[#FBF8F0]"
            >
              Clear local results
            </button>
          </div>

          {(speechToTextError || textToSpeechError) ? (
            <p className="mt-4 text-sm text-amber-700">
              STT error: {speechToTextError ?? 'none'} | TTS error: {textToSpeechError ?? 'none'}
            </p>
          ) : null}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[28px] border border-[#DED7C8] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#5A7A4B]">STT Benchmark</p>
                <h2 className="mt-2 text-2xl font-black">Math speech recognition</h2>
              </div>
              <div className="text-right text-xs text-[#67726A]">
                <div>Tested: {sttSummary.tested}</div>
                <div>Recording: {isRecording ? 'yes' : 'no'}</div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {STT_EVAL_CASES.map((testCase) => {
                const result = snapshot.sttResults.find((item) => item.caseId === testCase.id);
                return (
                  <article key={testCase.id} className="rounded-2xl border border-[#E3DDCF] bg-[#FCFAF5] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#5A7A4B]">
                          Grade {testCase.grade} - {testCase.flow}
                        </p>
                        <h3 className="mt-2 text-base font-black">{testCase.prompt}</h3>
                        <p className="mt-2 text-xs text-[#66716A]">Concept: {testCase.concept}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRunSttCase(testCase)}
                        disabled={!isSpeechToTextSupported || activeSttCaseId === testCase.id}
                        className="rounded-xl bg-[#203049] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#162337] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {activeSttCaseId === testCase.id ? 'Dang nghe...' : 'Run STT'}
                      </button>
                    </div>

                    {result ? (
                      <div className="mt-4 grid gap-3 rounded-2xl bg-white p-4 text-sm text-[#4F5B53]">
                        <p><span className="font-bold text-[#203049]">Transcript:</span> {result.transcript}</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <p>Latency: <span className="font-bold">{result.latencyMs} ms</span></p>
                          <p>Usable: <span className="font-bold">{result.usable ? 'Yes' : 'No'}</span></p>
                          <p>Variant match: <span className="font-bold">{result.variantMatch ? 'Yes' : 'No'}</span></p>
                          <p>Concept preserved: <span className="font-bold">{result.conceptPreserved ? 'Yes' : 'No'}</span></p>
                        </div>
                        {result.expectedChoiceIndex !== null ? (
                          <p>
                            Choice mapped: <span className="font-bold">{result.mappedChoiceIndex ?? 'null'}</span> / expected{' '}
                            <span className="font-bold">{result.expectedChoiceIndex}</span>
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#DED7C8] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#5A7A4B]">TTS Benchmark</p>
                <h2 className="mt-2 text-2xl font-black">Hoai My listening rubric</h2>
              </div>
              <div className="text-right text-xs text-[#67726A]">
                <div>Rated: {ttsSummary.tested}</div>
                <div>Speaking: {isSpeaking ? 'yes' : 'no'}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-[#F8F4EC] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#5A7A4B]">Intelligibility</p>
                <p className="mt-2 text-lg font-black">{ttsSummary.intelligibility}</p>
              </div>
              <div className="rounded-2xl bg-[#F8F4EC] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#5A7A4B]">Pronunciation</p>
                <p className="mt-2 text-lg font-black">{ttsSummary.pronunciation}</p>
              </div>
              <div className="rounded-2xl bg-[#F8F4EC] p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-[#5A7A4B]">Kid-friendly</p>
                <p className="mt-2 text-lg font-black">{ttsSummary.kidFriendly}</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {TTS_EVAL_CASES.map((testCase) => {
                const normalKey = `${testCase.id}:normal`;
                const slowKey = `${testCase.id}:slow`;
                const normalDraft = ratingDrafts[normalKey] ?? DEFAULT_RATING;
                const slowDraft = ratingDrafts[slowKey] ?? DEFAULT_RATING;
                const savedNormal = snapshot.ttsResults.find((item) => item.caseId === testCase.id && !item.slow);
                const savedSlow = snapshot.ttsResults.find((item) => item.caseId === testCase.id && item.slow);

                const renderRatingForm = (key: string, draft: TtsRatingDraft, slow: boolean) => (
                  <div className="rounded-2xl bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#5A7A4B]">
                        {slow ? 'Slow read' : 'Normal read'}
                      </p>
                      <button
                        type="button"
                        onClick={() => void handlePlayTtsCase(testCase, slow)}
                        disabled={!isTextToSpeechSupported || activeTtsCaseKey === `${testCase.id}:${slow ? 'slow' : 'normal'}`}
                        className="rounded-xl border border-[#D9D4C7] bg-white px-3 py-2 text-xs font-bold text-[#203049] transition hover:bg-[#FBF8F0] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {activeTtsCaseKey === `${testCase.id}:${slow ? 'slow' : 'normal'}` ? 'Dang doc...' : 'Play'}
                      </button>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      {([
                        ['intelligibility', 'Do ro loi'],
                        ['pronunciation', 'Do dung phat am'],
                        ['kidFriendly', 'Do de nghe'],
                      ] as const).map(([field, label]) => (
                        <label key={field} className="text-xs font-semibold text-[#556159]">
                          {label}
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={draft[field]}
                            onChange={(event) =>
                              handleRatingChange(key, { [field]: Number(event.target.value) } as Partial<TtsRatingDraft>)
                            }
                            className="mt-1 w-full rounded-lg border border-[#D8D2C4] px-3 py-2 text-sm"
                          />
                        </label>
                      ))}
                    </div>

                    <label className="mt-3 block text-xs font-semibold text-[#556159]">
                      Notes
                      <textarea
                        value={draft.notes}
                        onChange={(event) => handleRatingChange(key, { notes: event.target.value })}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-[#D8D2C4] px-3 py-2 text-sm"
                        placeholder="Vi du: doc ro so 12 cm, nhung can cham hon o cum gio phut."
                      />
                    </label>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleSaveTtsRating(testCase, slow)}
                        className="rounded-xl bg-[#587849] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#4B693E]"
                      >
                        Save rating
                      </button>
                      {(slow ? savedSlow : savedNormal) ? (
                        <span className="text-xs text-[#66716A]">Saved</span>
                      ) : null}
                    </div>
                  </div>
                );

                return (
                  <article key={testCase.id} className="rounded-2xl border border-[#E3DDCF] bg-[#FCFAF5] p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#5A7A4B]">
                      Grade {testCase.grade} - {testCase.concept}
                    </p>
                    <h3 className="mt-2 text-base font-black">{testCase.prompt}</h3>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      {renderRatingForm(normalKey, normalDraft, false)}
                      {renderRatingForm(slowKey, slowDraft, true)}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
