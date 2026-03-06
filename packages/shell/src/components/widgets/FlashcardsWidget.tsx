import React, { useEffect } from 'react';
import { useTranslation, StorageKeys, WindowEvents } from '@mycircle/shared';

const FlashcardsWidget = React.memo(function FlashcardsWidget() {
  const { t } = useTranslation();
  const [masteredCount, setMasteredCount] = React.useState(0);

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(StorageKeys.FLASHCARD_PROGRESS);
        if (raw) {
          const progress = JSON.parse(raw);
          setMasteredCount(Array.isArray(progress.masteredIds) ? progress.masteredIds.length : 0);
        } else {
          setMasteredCount(0);
        }
      } catch { /* ignore */ }
    }
    load();
    window.addEventListener(WindowEvents.FLASHCARD_PROGRESS_CHANGED, load);
    return () => window.removeEventListener(WindowEvents.FLASHCARD_PROGRESS_CHANGED, load);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.flashcards')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.flashcardsDesc')}</p>
        </div>
      </div>
      {masteredCount > 0 ? (
        <p className="text-xs text-teal-600 dark:text-teal-400/70">
          {t('widgets.flashcardsMastered').replace('{count}', String(masteredCount))}
        </p>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noFlashcardProgress')}</p>
      )}
    </div>
  );
});

export default FlashcardsWidget;
