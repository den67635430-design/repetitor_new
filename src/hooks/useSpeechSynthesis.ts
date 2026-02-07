import { useCallback, useRef, useState, useEffect } from 'react';

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

function splitTextIntoChunks(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?。])\s+/);
  let current = '';

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > maxLength && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? ' ' : '') + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks.length > 0 ? chunks : [text];
}

export function useSpeechSynthesis(lang = 'ru-RU'): UseSpeechSynthesisReturn {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const chunkIndexRef = useRef(0);
  const chunksRef = useRef<string[]>([]);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load voices asynchronously — they may not be available immediately
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
      }
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported]);

  const speakChunk = useCallback(() => {
    if (chunkIndexRef.current >= chunksRef.current.length) {
      setIsSpeaking(false);
      return;
    }

    const text = chunksRef.current[chunkIndexRef.current];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    // Try to find a Russian voice
    const russianVoice = voices.find(v => v.lang.startsWith('ru'));
    if (russianVoice) {
      utterance.voice = russianVoice;
    }

    utterance.onend = () => {
      chunkIndexRef.current++;
      speakChunk();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [lang, voices]);

  const speak = useCallback((text: string) => {
    if (!isSupported) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    // Clean markdown-like formatting and visual tags from text
    const cleanText = text
      .replace(/\[WRITE:[^\]]+\]/g, '')
      .replace(/\[MATH:[^\]]+\]/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[-•]\s/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    // Split long text into chunks to avoid Chrome TTS bug
    // Chrome stops speaking after ~15 seconds, so we split by sentences
    chunksRef.current = splitTextIntoChunks(cleanText, 180);
    chunkIndexRef.current = 0;

    setIsSpeaking(true);
    speakChunk();
  }, [isSupported, speakChunk]);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      chunksRef.current = [];
      chunkIndexRef.current = 0;
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    isSpeaking,
    isSupported,
  };
}
