import React from 'react';
import { useTranslation } from '@mycircle/shared';

const AiAssistantWidget = React.memo(function AiAssistantWidget() {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.aiAssistant')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.aiAssistantDesc')}</p>
        </div>
      </div>
    </div>
  );
});

export default AiAssistantWidget;
