import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseSpeechSynthesisReturn {
  speak: (text: string, voiceId?: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

function cleanTextForSpeech(text: string): string {
  return text
    .replace(/\[WRITE_CURSIVE:[^\]]+\]/g, '')
    .replace(/\[WRITE:[^\]]+\]/g, '')
    .replace(/\[MATH:[^\]]+\]/g, '')
    .replace(/\[ESCALATE:[^\]]+\]/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[-•]\s/g, '')
    // Replace math symbols with Russian words for natural speech
    .replace(/=/g, ' равно ')
    .replace(/\+/g, ' плюс ')
    .replace(/−/g, ' минус ')
    .replace(/-(?=\s*\d)/g, ' минус ')
    .replace(/×/g, ' умножить на ')
    .replace(/÷/g, ' разделить на ')
    .replace(/>/g, ' больше ')
    .replace(/</g, ' меньше ')
    .replace(/≥/g, ' больше или равно ')
    .replace(/≤/g, ' меньше или равно ')
    .replace(/≠/g, ' не равно ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text: string, voiceId?: string): Promise<void> => {
    // Stop any current speech
    stop();

    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return Promise.resolve();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsSpeaking(true);

    return new Promise<void>(async (resolve) => {
      try {
        // Get user's auth token for authenticated request
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.error('No auth session for TTS');
          setIsSpeaking(false);
          resolve();
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ text: cleanText, voiceId: voiceId || 'female' }),
            signal: abortController.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`TTS request failed: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          audioRef.current = null;
          resolve();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setIsSpeaking(false);
          audioRef.current = null;
          resolve();
        };

        audioRef.current = audio;
        await audio.play();
      } catch (err: any) {
        if (err.name === 'AbortError') {
          resolve();
          return;
        }
        console.error('ElevenLabs TTS error:', err);
        setIsSpeaking(false);
        resolve();
      }
    });
  }, [stop]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported: true, // Always supported since we use API
  };
}
