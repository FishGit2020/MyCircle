import React from 'react';
import { useTranslation } from '@mycircle/shared';

const RadioWidget = React.memo(function RadioWidget() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5l16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A48.329 48.329 0 0012 6.75zm-1.683 6.443a.75.75 0 10-.866 1.225 3.75 3.75 0 005.098 0 .75.75 0 10-.866-1.225 2.25 2.25 0 01-3.366 0zM12 12.75a.75.75 0 100-1.5.75.75 0 000 1.5z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.radio')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.radioDesc')}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('radio.title')}</p>
    </div>
  );
});

export default RadioWidget;
