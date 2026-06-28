'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { DEFAULT_TTS_LOCALE, type SpeechSpeakOptions } from '@/lib/speech';
import { createTextToSpeechProvider } from '@/lib/speechProvider';

export function useTextToSpeech(
  locale = DEFAULT_TTS_LOCALE,
  apiFetch?: (path: string, options?: RequestInit) => Promise<Response>,
) {
  const provider = useMemo(() => createTextToSpeechProvider(apiFetch), [apiFetch]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      provider.stopSpeaking();
    };
  }, [provider]);

  const speak = useCallback(async (text: string, options?: Omit<SpeechSpeakOptions, 'locale'>) => {
    if (!provider.isSupported) {
      setError('speech_not_supported');
      return;
    }

    setError(null);
    setIsSpeaking(true);
    try {
      await provider.speakText(text, {
        ...options,
        locale,
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'speech_synthesis_failed');
    } finally {
      setIsSpeaking(false);
    }
  }, [locale, provider]);

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
