import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { ChatMessage } from '../hooks/useInterviewChat';

const CHAR_DELAY = 12; // ms per character

function TypewriterText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const rafRef = useRef(0);
  const lastRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');
    lastRef.current = 0;

    const tick = (now: number) => {
      if (!lastRef.current) lastRef.current = now;
      const elapsed = now - lastRef.current;
      const chars = Math.floor(elapsed / CHAR_DELAY);
      if (chars > indexRef.current) {
        const next = Math.min(chars, text.length);
        indexRef.current = next;
        setDisplayed(text.slice(0, next));
        if (next >= text.length) {
          onDone?.();
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [text, onDone]);

  return <>{displayed}<span className="animate-pulse">|</span></>;
}

interface InterviewChatProps {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  interviewActive: boolean;
  modelSelected: boolean;
  onSendMessage: (text: string) => void;
  onRetry: () => void;
}

export default function InterviewChat({
  messages,
  loading,
  error,
  interviewActive,
  modelSelected,
  onSendMessage,
  onRetry,
}: InterviewChatProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [typingDone, setTypingDone] = useState(true);

  // Track which message IDs have finished typing (so they render as plain text)
  // Pre-populate with all messages present at mount — only new messages animate
  const finishedRef = useRef<Set<string>>(new Set(messages.map(m => m.id)));

  const scrollToBottom = useCallback(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, typingDone, scrollToBottom]);

  const handleTypingDone = useCallback((id: string) => {
    finishedRef.current.add(id);
    setTypingDone(true);
  }, []);

  // Find the latest assistant message that hasn't finished typing
  const lastAssistantId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i].id;
    }
    return null;
  })();

  const isAnimating = lastAssistantId && !finishedRef.current.has(lastAssistantId);
  if (isAnimating) {
    // Reset typingDone so we re-scroll during animation
    if (typingDone) setTypingDone(false);
  }

  const canSend = interviewActive && modelSelected;

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading || !canSend) return;
    onSendMessage(trimmed);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const inputPlaceholder = !modelSelected
    ? t('aiInterviewer.selectModelFirst')
    : interviewActive
      ? t('aiInterviewer.inputPlaceholder')
      : t('aiInterviewer.startFirst');

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Messages area — scrollable, won't grow parent */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
            {interviewActive
              ? t('aiInterviewer.waitingForResponse')
              : t('aiInterviewer.startPrompt')}
          </div>
        )}

        {messages.map((msg) => {
          const isLatestAssistant = msg.id === lastAssistantId;
          const shouldAnimate = msg.role === 'assistant' && isLatestAssistant && !finishedRef.current.has(msg.id);

          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                }`}
              >
                {shouldAnimate ? (
                  <TypewriterText text={msg.content} onDone={() => handleTypingDone(msg.id)} />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400 animate-pulse">
              {t('aiInterviewer.thinking')}
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <span className="text-red-500 dark:text-red-400 text-sm">{error}</span>
            <button
              type="button"
              onClick={onRetry}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t('aiInterviewer.retry')}
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={inputPlaceholder}
            disabled={!canSend || loading}
            rows={2}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('aiInterviewer.inputLabel')}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || loading || !canSend}
            className="self-end rounded-lg bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label={t('aiInterviewer.send')}
          >
            {t('aiInterviewer.send')}
          </button>
        </div>
      </div>
    </div>
  );
}
