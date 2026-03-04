import { useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import ToolCallDisplay from './ToolCallDisplay';
import MarkdownText from './MarkdownText';
import { useTypewriter } from '../hooks/useTypewriter';
import type { ChatMessage as ChatMessageType } from '../hooks/useAiChat';

interface ChatMessageProps {
  message: ChatMessageType;
  debugMode?: boolean;
  /** When true, shows blinking cursor and disables copy */
  streaming?: boolean;
  /** When true, applies typewriter effect for non-streamed responses */
  isLatest?: boolean;
}

export default function ChatMessage({ message, debugMode, streaming, isLatest }: ChatMessageProps) {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const useTypewriterEffect = !isUser && !streaming && !!isLatest;
  const { displayedText, isTyping } = useTypewriter({
    text: message.content,
    enabled: useTypewriterEffect,
  });

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  }, [message.content]);

  const showCursor = streaming || isTyping;
  const renderedContent = useTypewriterEffect ? displayedText : message.content;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
      role="listitem"
    >
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-medium opacity-70">
            {isUser ? t('ai.you') : t('ai.assistant')}
          </div>
          {!isUser && !streaming && !isTyping && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label={t('ai.copyMessage')}
              title={copied ? t('ai.copied') : t('ai.copyMessage')}
            >
              {copied ? (
                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          )}
        </div>
        <div className="text-sm break-words">
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <>
              <MarkdownText content={renderedContent} streaming={streaming} />
              {showCursor && (
                <span className="inline-block w-0.5 h-4 ml-0.5 bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)] animate-pulse rounded-sm align-text-bottom" aria-hidden="true" />
              )}
            </>
          )}
        </div>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <ToolCallDisplay toolCalls={message.toolCalls} debugMode={debugMode} />
        )}
      </div>
    </div>
  );
}
