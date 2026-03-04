import { useState, useEffect, useRef } from 'react';

interface UseTypewriterOptions {
  /** The full text to reveal */
  text: string;
  /** Milliseconds per word (default: 30) */
  speed?: number;
  /** Whether typewriter is enabled (default: true) */
  enabled?: boolean;
}

/**
 * Word-by-word typewriter reveal for non-streamed (GraphQL fallback) responses.
 * Only the latest assistant message should use this — previous messages render instantly.
 */
export function useTypewriter({ text, speed = 30, enabled = true }: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState(enabled ? '' : text);
  const [isTyping, setIsTyping] = useState(false);
  const wordIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevTextRef = useRef(text);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    // Reset when text changes (new message)
    if (text !== prevTextRef.current) {
      prevTextRef.current = text;
      wordIndexRef.current = 0;
      setDisplayedText('');
    }

    if (!text) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    const words = text.split(' ');

    if (wordIndexRef.current >= words.length) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    function tick() {
      const w = text.split(' ');
      if (wordIndexRef.current >= w.length) {
        setDisplayedText(text);
        setIsTyping(false);
        return;
      }
      setIsTyping(true);
      wordIndexRef.current++;
      setDisplayedText(w.slice(0, wordIndexRef.current).join(' '));
      if (wordIndexRef.current < w.length) {
        timerRef.current = setTimeout(tick, speed);
      } else {
        setIsTyping(false);
      }
    }

    timerRef.current = setTimeout(tick, speed);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, speed, enabled]);

  return { displayedText, isTyping };
}
