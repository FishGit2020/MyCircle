import React from 'react';
import { useTranslation } from '@mycircle/shared';

const DealFinderWidget = React.memo(function DealFinderWidget() {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.dealFinder' as any)}</h4> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.dealFinderDesc' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.dealFinderBrowse' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
    </div>
  );
});

export default DealFinderWidget;
