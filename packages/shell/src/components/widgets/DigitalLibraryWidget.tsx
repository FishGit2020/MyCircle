import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation, StorageKeys, WindowEvents, subscribeToMFEvent, MFEvents } from '@mycircle/shared';

const DigitalLibraryWidget = React.memo(function DigitalLibraryWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bookmarkCount, setBookmarkCount] = React.useState(0);
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [lastPlayed, setLastPlayed] = React.useState<{
    bookId: string;
    bookTitle: string;
    chapterTitle?: string;
    artwork?: string;
  } | null>(null);
  const [audioProgress, setAudioProgress] = React.useState<{
    position: number;
    duration: number;
  } | null>(null);

  useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(StorageKeys.BOOK_BOOKMARKS);
        if (raw) {
          const all = JSON.parse(raw);
          setBookmarkCount(Array.isArray(all) ? all.length : 0);
        }
      } catch { /* ignore */ }
      try {
        const raw = localStorage.getItem(StorageKeys.BOOK_LAST_PLAYED);
        if (raw) {
          const data = JSON.parse(raw);
          if (data.bookId) setLastPlayed(data);
          else setLastPlayed(null);
        } else {
          setLastPlayed(null);
        }
      } catch { /* ignore */ }
      try {
        const raw = localStorage.getItem(StorageKeys.BOOK_AUDIO_PROGRESS);
        if (raw) setAudioProgress(JSON.parse(raw));
        else setAudioProgress(null);
      } catch { /* ignore */ }
    }
    load();
    window.addEventListener(WindowEvents.BOOK_BOOKMARKS_CHANGED, load);
    window.addEventListener(WindowEvents.BOOK_LAST_PLAYED_CHANGED, load);
    window.addEventListener('book-audio-progress-changed', load);
    const unsubAudioPlay = subscribeToMFEvent<import('@mycircle/shared').AudioSource>(
      MFEvents.AUDIO_PLAY,
      (audioSource) => {
        if (audioSource.type === 'book') {
          setLastPlayed({
            bookId: audioSource.collection.id || '',
            bookTitle: audioSource.collection.title,
            chapterTitle: audioSource.track.title,
            artwork: audioSource.collection.artwork,
          });
        }
      }
    );
    return () => {
      window.removeEventListener(WindowEvents.BOOK_BOOKMARKS_CHANGED, load);
      window.removeEventListener(WindowEvents.BOOK_LAST_PLAYED_CHANGED, load);
      window.removeEventListener('book-audio-progress-changed', load);
      unsubAudioPlay();
    };
  }, []);

  const progressPct = audioProgress && audioProgress.duration > 0
    ? Math.round((audioProgress.position / audioProgress.duration) * 100)
    : 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.digitalLibrary')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.digitalLibraryDesc')}</p>
        </div>
      </div>
      {lastPlayed ? (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg p-2.5">
          <div className="flex items-center gap-2">
            {lastPlayed.artwork && (
              <img
                src={lastPlayed.artwork}
                alt=""
                className="w-10 h-10 rounded object-cover flex-shrink-0 ring-2 ring-indigo-300 dark:ring-indigo-600"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{lastPlayed.bookTitle}</p>
              {lastPlayed.chapterTitle && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 truncate">{lastPlayed.chapterTitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsNavigating(true);
                navigate(`/library/${lastPlayed!.bookId}?tab=listen&autoPlay=1`);
              }}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-indigo-500 dark:bg-indigo-600 rounded-full hover:bg-indigo-600 dark:hover:bg-indigo-500 transition active:scale-95 flex items-center gap-1.5"
              aria-label={t('widgets.continueListening')}
              disabled={isNavigating}
            >
              {isNavigating ? (
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              {t('widgets.continueListening')}
            </button>
          </div>
          {progressPct > 0 && (
            <div className="mt-2 h-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noAudiobook')}</p>
      )}
      {bookmarkCount > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t('widgets.bookBookmarks' as any).replace('{count}', String(bookmarkCount))}
        </p>
      )}
    </div>
  );
});

export default DigitalLibraryWidget;
