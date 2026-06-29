'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { DEFAULT_TTS_LOCALE, type SpeechSpeakOptions } from '@/lib/speech';
import { createTextToSpeechProvider } from '@/lib/speechProvider';
import { recordSpeechTelemetry } from '@/lib/speechTelemetry';

type TextToSpeechHookOptions = {
  source?: string;
};

export function useTextToSpeech(
  locale = DEFAULT_TTS_LOCALE,
  apiFetch?: (path: string, options?: RequestInit) => Promise<Response>,
  options?: TextToSpeechHookOptions,
) {
  const provider = useMemo(() => createTextToSpeechProvider(apiFetch), [apiFetch]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      provider.stopSpeaking();
    };
  }, [provider]);

  const speak = useCallback(async (text: string, speakOptions?: Omit<SpeechSpeakOptions, 'locale'>) => {
    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const source = speakOptions?.source ?? options?.source;
    const caseId = speakOptions?.caseId;

    if (!provider.isSupported) {
      setError('speech_not_supported');
      recordSpeechTelemetry({
        event: 'tts_error',
        mode: provider.mode,
        source,
        caseId,
        locale,
        errorCode: 'speech_not_supported',
      });
      return;
    }

    setError(null);
    setIsSpeaking(true);
    recordSpeechTelemetry({
      event: 'tts_click',
      mode: provider.mode,
      source,
      caseId,
      locale,
      textLength: text.length,
      slow: Boolean(speakOptions?.slow),
    });
    try {
      await provider.speakText(text, {
        ...speakOptions,
        locale,
      });
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'speech_synthesis_failed';
      setError(message);
      recordSpeechTelemetry({
        event: 'tts_error',
        mode: provider.mode,
        source,
        caseId,
        locale,
        durationMs: Math.round(
          (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt,
        ),
        textLength: text.length,
        slow: Boolean(speakOptions?.slow),
        errorCode: message,
        errorMessage: message,
      });
    } finally {
      setIsSpeaking(false);
    }
  }, [locale, options?.source, provider]);

  const stop = useCallback(() => {
    provider.stopSpeaking();
    setIsSpeaking(false);
  }, [provider]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    mode: provider.mode,
    isSupported: provider.isSupported,
    isSpeaking,
    error,
    speak,
    stop,
    clearError,
  };
}
