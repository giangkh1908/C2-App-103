'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { SpeechTranscriptResult } from '@/lib/speech';
import { createSpeechToTextProvider } from '@/lib/speechProvider';

export function useSpeechToText(locale = 'vi-VN') {
  const provider = useMemo(() => createSpeechToTextProvider(), []);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      provider.stop();
    };
  }, [provider]);

  const transcribe = useCallback(async (): Promise<SpeechTranscriptResult | null> => {
    if (!provider.isSupported) {
      setError('speech_not_supported');
      return null;
    }

    setError(null);
    setIsRecording(true);
    try {
      return await provider.transcribeAudio(undefined, { locale });
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : 'speech_recognition_failed';
      if (message !== 'speech_recognition_stopped') {
        setError(message);
      }
      return null;
    } finally {
      setIsRecording(false);
    }
  }, [locale, provider]);

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
