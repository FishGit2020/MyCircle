import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation, StorageKeys, WindowEvents } from '@mycircle/shared';

const VerseWidget = React.memo(function VerseWidget() {
  const { t } = useTranslation();
  const [bookmarks, setBookmarks] = React.useState<Array<{ book: string; chapter: number; label: string }>>([]);

  useEffect(() => {
    function loadBookmarks() {
      try {
        const stored = localStorage.getItem(StorageKeys.BIBLE_BOOKMARKS);
        if (stored) {
          const parsed = JSON.parse(stored);
          setBookmarks(Array.isArray(parsed) ? parsed : []);
        } else {
          setBookmarks([]);
        }
      } catch { setBookmarks([]); }
    }
    loadBookmarks();
    window.addEventListener(WindowEvents.BIBLE_BOOKMARKS_CHANGED, loadBookmarks);
    return () => window.removeEventListener(WindowEvents.BIBLE_BOOKMARKS_CHANGED, loadBookmarks);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.bible')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.bibleDesc')}</p>
        </div>
      </div>
      {bookmarks.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {bookmarks.slice(0, 6).map((b, i) => (
            <Link
              key={i}
              to={`/bible?book=${encodeURIComponent(b.book)}&chapter=${b.chapter}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium hover:bg-amber-100 dark:hover:bg-amber-800/40 active:bg-amber-200 dark:active:bg-amber-700/40 transition-colors"
            >
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {b.label || `${b.book} ${b.chapter}`}
            </Link>
          ))}
          {bookmarks.length > 6 && (
            <span className="text-[10px] text-amber-500 dark:text-amber-400 px-2 py-1">+{bookmarks.length - 6} {t('widgets.moreBookmarks')}</span>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noBookmarks')}</p>
      )}
    </div>
  );
});

export default VerseWidget;
