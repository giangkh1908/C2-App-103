'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { SpeechTranscriptResult } from '@/lib/speech';
import { createSpeechToTextProvider } from '@/lib/speechProvider';
import { recordSpeechTelemetry } from '@/lib/speechTelemetry';

type SpeechToTextHookOptions = {
  source?: string;
};

export function useSpeechToText(locale = 'vi-VN', options?: SpeechToTextHookOptions) {
  const provider = useMemo(() => createSpeechToTextProvider(), []);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      provider.stop();
    };
  }, [provider]);

  const transcribe = useCallback(
    async (
      requestOptions?: { source?: string; caseId?: string },
    ): Promise<SpeechTranscriptResult | null> => {
      const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const source = requestOptions?.source ?? options?.source;
      const caseId = requestOptions?.caseId;

      if (!provider.isSupported) {
        setError('speech_not_supported');
        recordSpeechTelemetry({
          event: 'stt_error',
          mode: provider.mode,
          source,
          caseId,
          locale,
          errorCode: 'speech_not_supported',
        });
        return null;
      }

      setError(null);
      setIsRecording(true);
      recordSpeechTelemetry({
        event: 'stt_start',
        mode: provider.mode,
        source,
        caseId,
        locale,
      });
      try {
        const result = await provider.transcribeAudio(undefined, { locale, source, caseId });
        const durationMs = Math.round(
          (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt,
        );
        recordSpeechTelemetry({
          event: 'stt_success',
          mode: provider.mode,
          source,
          caseId,
          locale,
          durationMs,
          transcriptLength: result.transcript.length,
        });
        return result;
      } catch (nextError) {
        const message = nextError instanceof Error ? nextError.message : 'speech_recognition_failed';
        if (message !== 'speech_recognition_stopped') {
          setError(message);
        }
        recordSpeechTelemetry({
          event: 'stt_error',
          mode: provider.mode,
          source,
          caseId,
          locale,
          durationMs: Math.round(
            (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAt,
          ),
          errorCode: message,
          errorMessage: message,
        });
        return null;
      } finally {
        setIsRecording(false);
      }
    },
    [locale, options?.source, provider],
  );

  const stop = useCallback(() => {
    provider.stop();
    setIsRecording(false);
  }, [provider]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    mode: provider.mode,
    isSupported: provider.isSupported,
    isRecording,
    error,
    transcribe,
    stop,
    clearError,
  };
}
