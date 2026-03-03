import { useState, useEffect, useCallback, useRef } from 'react';
import { createLogger } from '@mycircle/shared';

const logger = createLogger('BrowserTTS');

export interface UseBrowserTTSReturn {
  speaking: boolean;
  paused: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  speed: number;
  play: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVoice: (voice: SpeechSynthesisVoice) => void;
  setSpeed: (speed: number) => void;
  supported: boolean;
}

export function useBrowserTTS(text: string): UseBrowserTTSReturn {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speed, setSpeed] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load voices
  useEffect(() => {
    if (!supported) return;

    function loadVoices() {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
        // Prefer English voices
        const englishVoice = available.find(v => v.lang.startsWith('en') && v.localService);
        setSelectedVoice(prev => prev || englishVoice || available[0]);
      }
    }

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    utteranceRef.current = null;
  }, [supported]);

  const play = useCallback(() => {
    if (!supported || !text) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    // Split long text into chunks (browsers have ~5000 char limit)
    const MAX_CHUNK = 4000;
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= MAX_CHUNK) {
        chunks.push(remaining);
        break;
      }
      // Split at sentence boundary
      let splitIndex = remaining.lastIndexOf('. ', MAX_CHUNK);
      if (splitIndex === -1) splitIndex = remaining.lastIndexOf(' ', MAX_CHUNK);
      if (splitIndex === -1) splitIndex = MAX_CHUNK;
      chunks.push(remaining.slice(0, splitIndex + 1));
      remaining = remaining.slice(splitIndex + 1).trimStart();
    }

    let currentChunk = 0;

    function speakChunk() {
      if (currentChunk >= chunks.length) {
        setSpeaking(false);
        setPaused(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[currentChunk]);
      utteranceRef.current = utterance;

      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate = speed;
      utterance.pitch = 1;

      utterance.onend = () => {
        currentChunk++;
        speakChunk();
      };

      utterance.onerror = (event) => {
        if (event.error !== 'canceled') {
          logger.error('TTS error', { error: event.error });
        }
        setSpeaking(false);
        setPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    }

    setSpeaking(true);
    setPaused(false);
    speakChunk();
  }, [supported, text, selectedVoice, speed]);

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setPaused(true);
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setPaused(false);
  }, [supported]);

  const handleSetVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
  }, []);

  const handleSetSpeed = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  return {
    speaking,
    paused,
    voices,
    selectedVoice,
    speed,
    play,
    pause,
    resume,
    stop,
    setVoice: handleSetVoice,
    setSpeed: handleSetSpeed,
    supported,
  };
}
