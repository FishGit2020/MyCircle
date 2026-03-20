import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { Setlist, WorshipSong } from '../types';
import SongViewer from './SongViewer';

interface SetlistPresenterProps {
  setlist: Setlist;
  songs: Record<string, WorshipSong | null>;
  onExit: () => void;
}

export default function SetlistPresenter({ setlist, songs, onExit }: SetlistPresenterProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const entries = setlist.entries;
  const total = entries.length;
  const current = entries[currentIndex];
  const currentSong = current ? (songs[current.songId] ?? null) : null;

  const handlePrev = () => setCurrentIndex(i => Math.max(0, i - 1));
  const handleNext = () => { if (currentIndex < total - 1) setCurrentIndex(i => i + 1); };

  const songOfTotal = t('worship.songOfTotal')
    .replace('{current}', String(currentIndex + 1))
    .replace('{total}', String(total));

  return (
    <div>
      {/* Presenter header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 flex-wrap">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label="Previous song"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 text-center">
          {songOfTotal}
        </span>

        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex >= total - 1}
          aria-label="Next song"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onExit}
          aria-label="Exit service mode"
          className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition min-h-[36px]"
        >
          {t('worship.cancel')}
        </button>
      </div>

      {/* Song content */}
      {!current ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>{t('worship.emptySetlist')}</p>
        </div>
      ) : currentSong === null ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p className="font-medium text-gray-600 dark:text-gray-400">{t('worship.songNotFound')}</p>
          <p className="text-sm mt-1">{current.snapshotTitle} — {current.snapshotKey}</p>
        </div>
      ) : (
        /* key={songId} forces SongViewer to remount when song changes, resetting transposition per FR-008 */
        <SongViewer
          key={current.songId + '-' + currentIndex}
          song={currentSong}
          isAuthenticated={false}
          onEdit={() => {}}
        />
      )}

      {/* End of setlist notice */}
      {currentIndex === total - 1 && total > 0 && (
        <div className="mt-4 text-center text-sm text-gray-400 dark:text-gray-500 italic">
          {t('worship.endOfSetlist')}
        </div>
      )}
    </div>
  );
}
