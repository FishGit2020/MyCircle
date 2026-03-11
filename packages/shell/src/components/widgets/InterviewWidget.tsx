import React from 'react';
import { useTranslation } from '@mycircle/shared';

const InterviewWidget = React.memo(function InterviewWidget() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.interview' as any)}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.interviewDesc' as any)}</p>
        </div>
      </div>
    </div>
  );
});

export default InterviewWidget;
