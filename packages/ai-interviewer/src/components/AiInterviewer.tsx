import { useState, useCallback } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import { useInterviewChat } from '../hooks/useInterviewChat';
import QuestionPanel from './QuestionPanel';
import InterviewChat from './InterviewChat';

export default function AiInterviewer() {
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  const [interviewActive, setInterviewActive] = useState(false);
  const [endpointId, setEndpointId] = useState('');
  const [model, setModel] = useState('');

  const {
    messages,
    loading,
    error,
    sendMessage,
    startInterview,
    repeatQuestion,
    requestHint,
    endInterview,
    clearChat,
  } = useInterviewChat();

  const handleStart = useCallback(() => {
    if (!question.trim()) return;
    setInterviewActive(true);
    startInterview(question, endpointId || undefined, model || undefined);
  }, [question, endpointId, model, startInterview]);

  const handleRepeat = useCallback(() => {
    repeatQuestion(endpointId || undefined, model || undefined);
  }, [endpointId, model, repeatQuestion]);

  const handleHint = useCallback(() => {
    requestHint(endpointId || undefined, model || undefined);
  }, [endpointId, model, requestHint]);

  const handleEnd = useCallback(() => {
    endInterview(endpointId || undefined, model || undefined);
    setInterviewActive(false);
  }, [endpointId, model, endInterview]);

  const handleSendMessage = useCallback((text: string) => {
    sendMessage(text, endpointId || undefined, model || undefined);
  }, [endpointId, model, sendMessage]);

  const handleNewInterview = useCallback(() => {
    clearChat();
    setInterviewActive(false);
    setQuestion('');
  }, [clearChat]);

  return (
    <PageContent fill>
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('aiInterviewer.title')}
          </h1>
          {interviewActive && (
            <button
              type="button"
              onClick={handleNewInterview}
              className="rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {t('aiInterviewer.newInterview')}
            </button>
          )}
        </div>

        {/* Split panel: vertical stack on mobile, side-by-side on desktop */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* Question panel — 40% on desktop */}
          <div className="md:w-[40%] border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 min-h-[200px] md:min-h-0 flex flex-col">
            <QuestionPanel
              question={question}
              onQuestionChange={setQuestion}
              interviewActive={interviewActive}
              endpointId={endpointId}
              model={model}
              onEndpointChange={setEndpointId}
              onModelChange={setModel}
              onStart={handleStart}
              onRepeat={handleRepeat}
              onHint={handleHint}
              onEnd={handleEnd}
              loading={loading}
            />
          </div>

          {/* Chat panel — 60% on desktop */}
          <div className="flex-1 min-h-0 flex flex-col">
            <InterviewChat
              messages={messages}
              loading={loading}
              error={error}
              interviewActive={interviewActive}
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </PageContent>
  );
}
