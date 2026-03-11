import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation, WindowEvents } from '@mycircle/shared';

const InterviewWidget = React.memo(function InterviewWidget() {
  const { t } = useTranslation();
  const [sessionCount, setSessionCount] = useState(0);
  const [latestSession, setLatestSession] = useState<{ id: string; questionPreview: string } | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!window.__interviewApi) {
      setSessionCount(0);
      setLatestSession(null);
      return;
    }
    try {
      const result = await window.__interviewApi.list();
      setSessionCount(result.sessions.length);
      setLatestSession(result.sessions[0] ?? null);
    } catch {
      setSessionCount(0);
      setLatestSession(null);
    }
  }, []);

  useEffect(() => {
    // Fetch on mount (covers initial login state)
    fetchSessions();

    // Re-fetch or reset on auth state change (login/logout)
    const onAuthChange = () => {
      if (window.__currentUid) {
        fetchSessions();
      } else {
        setSessionCount(0);
        setLatestSession(null);
      }
    };

    window.addEventListener(WindowEvents.AUTH_STATE_CHANGED, onAuthChange);
    return () => {
      window.removeEventListener(WindowEvents.AUTH_STATE_CHANGED, onAuthChange);
    };
  }, [fetchSessions]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.interview')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.interviewDesc')}</p>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
        {sessionCount > 0 ? (
          <>
            <p>{t('aiInterviewer.sessionCount', { count: sessionCount })}</p>
            {latestSession && (
              <a
                href={`/interview#${latestSession.id}`}
                className="text-indigo-600 dark:text-indigo-400 hover:underline mt-1 inline-block"
              >
                {t('aiInterviewer.continueLastSession')}
              </a>
            )}
          </>
        ) : (
          <a
            href="/interview"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {t('aiInterviewer.startFirstInterview')}
          </a>
        )}
      </div>
    </div>
  );
});

export default InterviewWidget;
