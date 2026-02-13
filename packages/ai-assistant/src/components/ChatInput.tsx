import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

// Check for browser SpeechRecognition support (evaluated lazily so mocks work)
function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return ((window as unknown as Record<string, unknown>).SpeechRecognition ??
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as (new () => SpeechRecognition) | null;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [listening, setListening] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [disabled]);

  // Auto-resize textarea to fit content
  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    // Clamp between 1 row (~44px) and 6 rows (~160px)
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    // Reset height after clearing
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleVoice = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return;

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = document.documentElement.lang || 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        setValue(prev => (prev ? `${prev} ${transcript}` : transcript));
      }
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening]);

  const voiceSupported = !!getSpeechRecognition();

  return (
    <div className="flex gap-2 items-end">
      <textarea
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('ai.inputPlaceholder')}
        disabled={disabled}
        rows={1}
        aria-label={t('ai.inputPlaceholder')}
        className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 placeholder-gray-400 dark:placeholder-gray-500"
      />
      {voiceSupported && (
        <button
          onClick={toggleVoice}
          disabled={disabled}
          aria-label={listening ? t('ai.voiceListening') : t('ai.voiceInput')}
          title={listening ? t('ai.voiceListening') : t('ai.voiceInput')}
          className={`flex-shrink-0 p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
            listening
              ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
          </svg>
        </button>
      )}
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        aria-label={t('ai.send')}
        className="flex-shrink-0 p-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:hover:bg-blue-500 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
        </svg>
      </button>
    </div>
  );
}
