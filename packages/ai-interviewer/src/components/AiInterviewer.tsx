import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation, PageContent, useQuery, useLazyQuery, GET_BENCHMARK_ENDPOINTS, GET_BENCHMARK_ENDPOINT_MODELS } from '@mycircle/shared';
import type { GetBenchmarkEndpointsQuery, GetBenchmarkEndpointModelsQuery } from '@mycircle/shared';
import { useInterviewChat } from '../hooks/useInterviewChat';
import type { InterviewSession } from '../hooks/useInterviewChat';
import { useSessionHistory } from '../hooks/useSessionHistory';
import { useQuestionBank } from '../hooks/useQuestionBank';
import type { InterviewConfig } from '../hooks/useInterviewStateMachine';
import InterviewSetup from './InterviewSetup';
import QuestionPanel from './QuestionPanel';
import InterviewChat from './InterviewChat';
import QuestionManager from './QuestionManager';
import SessionHistoryPanel from './SessionHistoryPanel';
import ProgressDashboard from './ProgressDashboard';

const ENDPOINT_KEY = 'interview-endpoint';
const MODEL_KEY = 'interview-model';

function loadPref(key: string): string {
  try { return localStorage.getItem(key) || ''; } catch { return ''; }
}
function savePref(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* */ }
}

function getSessionIdFromHash(): string {
  const hash = window.location.hash.slice(1);
  return hash || '';
}

function setSessionHash(sessionId: string) {
  if (sessionId) {
    window.history.replaceState(null, '', `#${sessionId}`);
  } else {
    window.history.replaceState(null, '', window.location.pathname);
  }
}

export default function AiInterviewer() {
  const { t } = useTranslation();
  const [question, setQuestionLocal] = useState('');
  const [document, setDocumentLocal] = useState('');
  const [interviewActive, setInterviewActive] = useState(false);
  const [endpointId, setEndpointIdLocal] = useState(() => loadPref(ENDPOINT_KEY));
  const [model, setModelLocal] = useState(() => loadPref(MODEL_KEY));
  const [showSessions, setShowSessions] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const mountedRef = useRef(false);

  const [showQuestionManager, setShowQuestionManager] = useState(false);

  // Question bank
  const {
    data: questionBankData,
    loading: questionBankLoading,
    error: questionBankError,
    createQuestion,
    updateQuestion,
    deleteQuestion: deleteQuestionFromBank,
    exportQuestions,
    importQuestions,
  } = useQuestionBank();

  // Session history (for the panel and progress dashboard)
  const { sessions: historySessions } = useSessionHistory();

  // Endpoint / model queries
  const { data: endpointsData } = useQuery<GetBenchmarkEndpointsQuery>(GET_BENCHMARK_ENDPOINTS, {
    fetchPolicy: 'cache-and-network',
  });
  const [fetchModels, { data: modelsData }] = useLazyQuery<GetBenchmarkEndpointModelsQuery>(
    GET_BENCHMARK_ENDPOINT_MODELS,
  );
  const endpoints = endpointsData?.benchmarkEndpoints ?? [];
  const models = modelsData?.benchmarkEndpointModels ?? [];

  // Fetch models for persisted endpoint on mount
  useEffect(() => {
    if (endpointId) {
      fetchModels({ variables: { endpointId } });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    messages,
    loading,
    error,
    question: persistedQuestion,
    document: persistedDocument,
    hasPersistedSession,
    saveStatus,
    sessions,
    sessionId: currentSessionId,
    // V2 structured mode
    interviewState: _interviewState,
    evaluating,
    progress,
    currentBankQuestion,
    isStructuredMode,
    scores,
    isLastQuestion,
    // Timer
    timerConfig,
    timerElapsedMs,
    setTimerConfig,
    startTimer,
    // Actions
    setQuestion,
    setDocument,
    sendMessage,
    startInterview,
    startStructuredInterview,
    repeatQuestion,
    requestHint,
    endInterview,
    nextQuestion,
    retry,
    clearChat,
    loadSessions,
    loadSession,
    deleteSession,
  } = useInterviewChat();

  // On mount: load session from URL hash, or fall back to localStorage
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const hashSessionId = getSessionIdFromHash();
    if (hashSessionId) {
      loadSession(hashSessionId).then((loaded) => {
        if (loaded) {
          setQuestionLocal(loaded.question);
          setDocumentLocal(loaded.document);
          setInterviewActive(loaded.messages.length > 0);
        } else {
          setSessionHash('');
        }
      });
    } else if (hasPersistedSession) {
      setQuestionLocal(persistedQuestion);
      setDocumentLocal(persistedDocument);
      setInterviewActive(true);
      setSessionHash(currentSessionId);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mountedRef.current && currentSessionId && messages.length > 0) {
      setSessionHash(currentSessionId);
    }
  }, [currentSessionId, messages.length]);

  const setEndpointId = useCallback((id: string) => {
    setEndpointIdLocal(id);
    savePref(ENDPOINT_KEY, id);
    setModelLocal('');
    savePref(MODEL_KEY, '');
    if (id) {
      fetchModels({ variables: { endpointId: id } });
    }
  }, [fetchModels]);

  const setModel = useCallback((m: string) => {
    setModelLocal(m);
    savePref(MODEL_KEY, m);
  }, []);

  const modelSelected = !!(endpointId && model);

  const handleQuestionChange = useCallback((text: string) => {
    setQuestionLocal(text);
    setQuestion(text);
  }, [setQuestion]);

  const handleDocumentChange = useCallback((text: string) => {
    setDocumentLocal(text);
    setDocument(text);
  }, [setDocument]);

  const handleStartStructured = useCallback((config: InterviewConfig) => {
    if (!modelSelected || !questionBankData) return;
    setInterviewActive(true);
    startTimer();
    startStructuredInterview(
      config,
      questionBankData.questions,
      endpointId || undefined,
      model || undefined,
    );
  }, [modelSelected, questionBankData, endpointId, model, startStructuredInterview, startTimer]);

  const handleStartCustom = useCallback((customQuestion: string) => {
    if (!customQuestion.trim() || !modelSelected) return;
    setQuestionLocal(customQuestion);
    setInterviewActive(true);
    startTimer();
    startInterview(customQuestion, endpointId || undefined, model || undefined);
  }, [endpointId, model, modelSelected, startInterview, startTimer]);

  const handleStart = useCallback(() => {
    if (!question.trim() || !modelSelected) return;
    setInterviewActive(true);
    startTimer();
    startInterview(question, endpointId || undefined, model || undefined);
  }, [question, endpointId, model, modelSelected, startInterview, startTimer]);

  const handleRepeat = useCallback(() => {
    repeatQuestion(endpointId || undefined, model || undefined);
  }, [endpointId, model, repeatQuestion]);

  const handleHint = useCallback(() => {
    requestHint(endpointId || undefined, model || undefined);
  }, [endpointId, model, requestHint]);

  const handleEnd = useCallback(() => {
    endInterview(endpointId || undefined, model || undefined);
    if (!isStructuredMode) {
      setInterviewActive(false);
    }
  }, [endpointId, model, endInterview, isStructuredMode]);

  const handleNextQuestion = useCallback(() => {
    nextQuestion(endpointId || undefined, model || undefined);
  }, [endpointId, model, nextQuestion]);

  const handleSendMessage = useCallback((text: string) => {
    sendMessage(text, endpointId || undefined, model || undefined);
  }, [endpointId, model, sendMessage]);

  const handleNewInterview = useCallback(() => {
    clearChat();
    setInterviewActive(false);
    setQuestionLocal('');
    setDocumentLocal('');
    setSessionHash('');
  }, [clearChat]);

  const handleToggleSessions = useCallback(() => {
    setShowSessions((prev) => !prev);
    setShowProgress(false);
  }, []);

  const handleToggleProgress = useCallback(() => {
    setShowProgress((prev) => !prev);
    setShowSessions(false);
  }, []);

  const handleLoadSession = useCallback(async (session: InterviewSession) => {
    const loaded = await loadSession(session.id);
    if (loaded) {
      setQuestionLocal(loaded.question);
      setDocumentLocal(loaded.document);
      setInterviewActive(loaded.messages.length > 0);
      setShowSessions(false);
      setSessionHash(session.id);
    }
  }, [loadSession]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await deleteSession(sessionId);
    if (sessionId === currentSessionId) {
      setQuestionLocal('');
      setDocumentLocal('');
      setInterviewActive(false);
      setSessionHash('');
    }
  }, [deleteSession, currentSessionId]);

  const handleRerun = useCallback((config: { chapter: string; difficulty: string }) => {
    setShowSessions(false);
    clearChat();
    setInterviewActive(false);
    setQuestionLocal('');
    setDocumentLocal('');
    setSessionHash('');
    try {
      sessionStorage.setItem('interview-rerun-chapter', config.chapter);
      sessionStorage.setItem('interview-rerun-difficulty', config.difficulty);
    } catch { /* */ }
  }, [clearChat]);

  // Legacy: kept for backward compat with useInterviewChat sessions state
  void sessions;
  void loadSessions;
  void timerElapsedMs;

  return (
    <PageContent fill className="overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('aiInterviewer.title')}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            {saveStatus === 'saving' && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{t('aiInterviewer.saving')}</span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-green-500 dark:text-green-400">{t('aiInterviewer.saved')}</span>
            )}
            <button
              type="button"
              onClick={handleToggleSessions}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                showSessions
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('aiInterviewer.sessions')}
            </button>
            <button
              type="button"
              onClick={handleToggleProgress}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                showProgress
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('aiInterviewer.progressDashboard')}
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

        {/* Session history panel */}
        {showSessions && (
          <SessionHistoryPanel
            onOpen={(sessionId) => {
              handleLoadSession({ id: sessionId } as InterviewSession);
            }}
            onDelete={handleDeleteSession}
            onRerun={handleRerun}
          />
        )}

        {/* Progress dashboard */}
        {showProgress && (
          <div className="border-b border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
            <ProgressDashboard sessions={historySessions} />
          </div>
        )}

        {/* Split panel */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Working document panel — 65% */}
          <div className="md:w-[65%] border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 min-h-[200px] md:min-h-0 flex flex-col">
            {!interviewActive && showQuestionManager && questionBankData ? (
              <QuestionManager
                questions={questionBankData.questions}
                onBack={() => setShowQuestionManager(false)}
                onCreateQuestion={createQuestion}
                onUpdateQuestion={updateQuestion}
                onDeleteQuestion={deleteQuestionFromBank}
                onExportQuestions={exportQuestions}
                onImportQuestions={importQuestions}
              />
            ) : !interviewActive ? (
              <InterviewSetup
                onStartStructured={handleStartStructured}
                onStartCustom={handleStartCustom}
                onManageQuestions={() => setShowQuestionManager(true)}
                loading={loading}
                modelSelected={modelSelected}
                questionBankLoading={questionBankLoading}
                questionBankError={questionBankError}
                questionBankAvailable={!!(questionBankData && questionBankData.questions.length > 0)}
                timerConfig={timerConfig}
                onTimerConfigChange={setTimerConfig}
              />
            ) : (
              <QuestionPanel
                question={question}
                document={document}
                onQuestionChange={handleQuestionChange}
                onDocumentChange={handleDocumentChange}
                interviewActive={interviewActive}
                onStart={handleStart}
                onRepeat={handleRepeat}
                onHint={handleHint}
                onEnd={handleEnd}
                loading={loading}
                modelSelected={modelSelected}
                onNextQuestion={handleNextQuestion}
                isStructuredMode={isStructuredMode}
                currentBankQuestion={currentBankQuestion}
                progress={progress}
                scores={scores}
                evaluating={evaluating}
                isLastQuestion={isLastQuestion}
              />
            )}
          </div>

          {/* Chat panel — 35% */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Model selectors — right above chat */}
            <div className="shrink-0 flex flex-wrap gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <select
                value={endpointId}
                onChange={(e) => setEndpointId(e.target.value)}
                className="flex-1 min-w-[120px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={t('aiInterviewer.endpoint')}
              >
                <option value="">{t('aiInterviewer.selectEndpoint')}</option>
                {endpoints.map((ep) => (
                  <option key={ep.id} value={ep.id}>{ep.name}</option>
                ))}
              </select>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={!endpointId}
                className="flex-1 min-w-[120px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                aria-label={t('aiInterviewer.model')}
              >
                <option value="">{t('aiInterviewer.selectModel')}</option>
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <InterviewChat
              messages={messages}
              loading={loading}
              error={error}
              interviewActive={interviewActive}
              modelSelected={modelSelected}
              onSendMessage={handleSendMessage}
              onRetry={retry}
              scores={scores}
              evaluating={evaluating}
            />
          </div>
        </div>
      </div>
    </PageContent>
  );
}
