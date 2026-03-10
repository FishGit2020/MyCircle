import React, { useEffect } from 'react';
import { useTranslation, WindowEvents } from '@mycircle/shared';

const PollSystemWidget = React.memo(function PollSystemWidget() {
  const { t } = useTranslation();
  const [counts, setCounts] = React.useState<{ personal: number; public: number } | null>(null);

  useEffect(() => {
    function fetchCounts() {
      const api = window.__pollSystem;
      if (api?.getAll) {
        api.getAll().then((polls: any[]) => {
          const personal = polls.filter((p: any) => !p.isPublic).length;
          const pub = polls.filter((p: any) => p.isPublic).length;
          setCounts({ personal, public: pub });
        }).catch(() => { /* ignore */ });
      }
    }
    fetchCounts();
    window.addEventListener(WindowEvents.AUTH_STATE_CHANGED, fetchCounts);
    window.addEventListener(WindowEvents.POLL_SYSTEM_CHANGED, fetchCounts);
    return () => {
      window.removeEventListener(WindowEvents.AUTH_STATE_CHANGED, fetchCounts);
      window.removeEventListener(WindowEvents.POLL_SYSTEM_CHANGED, fetchCounts);
    };
  }, []);

  const total = counts ? counts.personal + counts.public : 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.pollSystem' as any)}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.pollSystemDesc' as any)}</p>
        </div>
      </div>
      {total > 0 ? (
        <div className="space-y-0.5">
          {counts!.personal > 0 && (
            <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">
              {t('widgets.pollPersonalCount' as any).replace('{count}', String(counts!.personal))}
            </p>
          )}
          {counts!.public > 0 && (
            <p className="text-xs text-violet-500 dark:text-violet-400/70">
              {t('widgets.pollPublicCount' as any).replace('{count}', String(counts!.public))}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noActivePolls' as any)}</p>
      )}
    </div>
  );
});

export default PollSystemWidget;
