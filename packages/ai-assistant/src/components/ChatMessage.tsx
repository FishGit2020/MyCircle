import { useTranslation } from '@weather/shared';
import ToolCallDisplay from './ToolCallDisplay';
import type { ChatMessage as ChatMessageType } from '../hooks/useAiChat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const { t } = useTranslation();
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      role="listitem"
    >
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-500 text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
        }`}
      >
        <div className="text-xs font-medium mb-1 opacity-70">
          {isUser ? t('ai.you') : t('ai.assistant')}
        </div>
        <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <ToolCallDisplay toolCalls={message.toolCalls} />
        )}
      </div>
    </div>
  );
}
