import React from 'react';
import { useTranslation } from '@mycircle/shared';

const WebCrawlerWidget = React.memo(function WebCrawlerWidget() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.webCrawler' as any)}</h4> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.webCrawlerDesc' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.webCrawlerStatus' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
    </div>
  );
});

export default WebCrawlerWidget;
