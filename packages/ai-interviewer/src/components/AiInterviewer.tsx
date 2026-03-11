import { useState, useCallback, useEffect } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import { useInterviewChat } from '../hooks/useInterviewChat';
import type { InterviewSession } from '../hooks/useInterviewChat';
import QuestionPanel from './QuestionPanel';
import InterviewChat from './InterviewChat';

export default function AiInterviewer() {
  const { t } = useTranslation();
  const [question, setQuestionLocal] = useState('');
  const [document, setDocumentLocal] = useState('');
  const [interviewActive, setInterviewActive] = useState(false);
  const [endpointId, setEndpointId] = useState('');
  const [model, setModel] = useState('');
  const [showSessions, setShowSessions] = useState(false);

  const {
    messages,
    loading,
    error,
    question: persistedQuestion,
    document: persistedDocument,
    hasPersistedSession,
    saveStatus,
    sessions,
    setQuestion,
    setDocument,
    sendMessage,
    startInterview,
    repeatQuestion,
    requestHint,
    endInterview,
    clearChat,
    loadSessions,
    loadSession,
    deleteSession,
  } = useInterviewChat();

  // Restore persisted state on mount
  useEffect(() => {
    if (hasPersistedSession) {
      setQuestionLocal(persistedQuestion);
      setDocumentLocal(persistedDocument);
      setInterviewActive(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuestionChange = useCallback((text: string) => {
    setQuestionLocal(text);
    setQuestion(text);
  }, [setQuestion]);

  const handleDocumentChange = useCallback((text: string) => {
    setDocumentLocal(text);
    setDocument(text);
  }, [setDocument]);

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
    setQuestionLocal('');
    setDocumentLocal('');
  }, [clearChat]);

  const handleToggleSessions = useCallback(() => {
    if (!showSessions) {
      loadSessions();
    }
    setShowSessions(!showSessions);
  }, [showSessions, loadSessions]);

  const handleLoadSession = useCallback(async (session: InterviewSession) => {
    const loaded = await loadSession(session.id);
    if (loaded) {
      setQuestionLocal(loaded.question);
      setDocumentLocal(loaded.document);
      setInterviewActive(loaded.messages.length > 0);
      setShowSessions(false);
    }
  }, [loadSession]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await deleteSession(sessionId);
  }, [deleteSession]);

  return (
    <PageContent fill>
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('aiInterviewer.title')}
          </h1>
          <div className="flex items-center gap-2">
            {/* Save status indicator */}
            {saveStatus === 'saving' && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{t('aiInterviewer.saving')}</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-green-500 dark:text-green-400">{t('aiInterviewer.saved')}</span>
            )}

            {/* Sessions button */}
            <button
              type="button"
              onClick={handleToggleSessions}
              className="rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {t('aiInterviewer.sessions')}
            </button>

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
        </div>

        {/* Sessions dropdown */}
        {showSessions && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 max-h-48 overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('aiInterviewer.noSessions')}</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => handleLoadSession(s)}
                      className="flex-1 text-left truncate text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {s.questionPreview || 'Untitled'} ({s.messageCount} msgs)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSession(s.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs transition-colors"
                    >
                      {t('aiInterviewer.deleteSession')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Split panel: vertical stack on mobile, side-by-side on desktop */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* Working document panel — 65% on desktop */}
          <div className="md:w-[65%] border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 min-h-[200px] md:min-h-0 flex flex-col">
            <QuestionPanel
              question={question}
              document={document}
              onQuestionChange={handleQuestionChange}
              onDocumentChange={handleDocumentChange}
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

          {/* Chat panel — 35% on desktop */}
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
