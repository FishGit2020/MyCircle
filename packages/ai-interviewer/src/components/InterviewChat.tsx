import { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { ChatMessage } from '../hooks/useInterviewChat';

interface InterviewChatProps {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  interviewActive: boolean;
  onSendMessage: (text: string) => void;
}

export default function InterviewChat({
  messages,
  loading,
  error,
  interviewActive,
  onSendMessage,
}: InterviewChatProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading || !interviewActive) return;
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

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">
            {interviewActive
              ? t('aiInterviewer.waitingForResponse')
              : t('aiInterviewer.startPrompt')}
          </div>
        )}

        {messages.map((msg) => (
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
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400 animate-pulse">
              {t('aiInterviewer.thinking')}
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-red-500 dark:text-red-400 text-sm py-1">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              interviewActive
                ? t('aiInterviewer.inputPlaceholder')
                : t('aiInterviewer.startFirst')
            }
            disabled={!interviewActive || loading}
            rows={2}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('aiInterviewer.inputLabel')}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || loading || !interviewActive}
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
