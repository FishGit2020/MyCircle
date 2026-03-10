import { useState, useCallback } from 'react';
import { useTranslation, createLogger, eventBus, MFEvents, StorageKeys, WindowEvents } from '@mycircle/shared';
import type { AudioSource } from '@mycircle/shared';

const logger = createLogger('ChapterConvertList');

interface Chapter {
  index: number;
  title: string;
  characterCount: number;
  audioUrl?: string;
  audioDuration?: number;
}

interface Props {
  bookId: string;
  bookTitle: string;
  coverUrl?: string;
  chapters: Chapter[];
  voiceName: string;
  onChapterConverted: () => void;
}

export default function ChapterConvertList({ bookId, bookTitle, coverUrl, chapters, voiceName, onChapterConverted }: Props) {
  const { t } = useTranslation();
  const [converting, setConverting] = useState<number | null>(null);

  const audioChapters = chapters.filter(ch => ch.audioUrl);

  const handlePlay = useCallback((chapterIndex: number) => {
    // Find the index within audio-only chapters
    const audioOnly = chapters.filter(ch => ch.audioUrl);
    const audioIdx = audioOnly.findIndex(ch => ch.index === chapterIndex);
    if (audioIdx === -1) return;

    const tracks = audioOnly.map(ch => ({
      id: `${bookId}-${ch.index}`,
      url: ch.audioUrl!,
      title: ch.title || `${t('library.chapter')} ${ch.index + 1}`,
    }));

    const source: AudioSource = {
      type: 'book',
      track: tracks[audioIdx],
      collection: { id: bookId, title: bookTitle, artwork: coverUrl, tracks },
      trackIndex: audioIdx,
      navigateTo: `/library/${bookId}?tab=listen&autoPlay=1`,
      progressKey: StorageKeys.BOOK_AUDIO_PROGRESS,
      nowPlayingKey: StorageKeys.BOOK_NOW_PLAYING,
      lastPlayedKey: StorageKeys.BOOK_LAST_PLAYED,
      lastPlayedEvent: WindowEvents.BOOK_LAST_PLAYED_CHANGED,
      canQueue: true,
      canShare: true,
      skipSeconds: 10,
    };

    eventBus.publish(MFEvents.AUDIO_PLAY, source);
  }, [chapters, bookId, bookTitle, coverUrl, t]);

  const handleConvert = useCallback(async (chapterIndex: number) => {
    setConverting(chapterIndex);
    try {
      const token = await window.__getFirebaseIdToken?.();
      if (!token) return;
      const apiBase = window.__digitalLibraryApiBase?.() || '';
      const res = await fetch(`${apiBase}/digital-library-api/convert-to-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookId, voiceName, chapterIndex }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        logger.warn('Chapter conversion failed', data);
      }
      // Poll for completion
      const poll = async (attempts: number) => {
        if (attempts > 40) { setConverting(null); return; }
        await new Promise(r => setTimeout(r, 3000));
        onChapterConverted();
        // Keep polling — parent will re-render with updated chapter data
        setTimeout(() => poll(attempts + 1), 3000);
      };
      poll(0);
    } catch (err) {
      logger.error('Chapter conversion failed', err);
      setConverting(null);
    }
  }, [bookId, voiceName, onChapterConverted]);

  const handleCancel = useCallback(() => {
    setConverting(null);
  }, []);

  const [deleting, setDeleting] = useState<number | null>(null);

  const handleDeleteAudio = useCallback(async (chapterIndex: number) => {
    if (!window.confirm(t('library.deleteAudioConfirm'))) return;
    setDeleting(chapterIndex);
    try {
      const token = await window.__getFirebaseIdToken?.();
      if (!token) return;
      const apiBase = window.__digitalLibraryApiBase?.() || '';
      const res = await fetch(`${apiBase}/digital-library-api/delete-chapter-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookId, chapterIndex }),
      });
      if (res.ok) await onChapterConverted();
    } catch (err) {
      logger.error('Failed to delete chapter audio', err);
    } finally {
      setDeleting(null);
    }
  }, [bookId, onChapterConverted, t]);

  const convertedCount = audioChapters.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('library.chapters')}
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {t('library.chaptersConverted').replace('{converted}', String(convertedCount)).replace('{total}', String(chapters.length))}
        </span>
      </div>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {chapters.map(ch => {
          const hasAudio = !!ch.audioUrl;
          const isConverting = converting === ch.index;
          return (
            <li key={ch.index} className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-gray-800">
              {/* Status icon */}
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {isConverting ? (
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                ) : hasAudio ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
              </div>

              {/* Chapter info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white truncate">
                  {ch.title || `${t('library.chapter')} ${ch.index + 1}`}
                </p>
                {ch.characterCount > 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {Math.round(ch.characterCount / 1000)}k {t('library.chars')}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              {isConverting ? (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition min-h-[44px]"
                  aria-label={t('library.cancelConversion')}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {t('library.cancelConversion')}
                </button>
              ) : hasAudio ? (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handlePlay(ch.index)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-md transition min-h-[44px]"
                    aria-label={`${t('library.play')} ${ch.title}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                    {t('library.play')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAudio(ch.index)}
                    disabled={deleting === ch.index}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
                    aria-label={`${t('library.deleteAudio')} ${ch.title}`}
                    title={t('library.deleteAudio')}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConvert(ch.index)}
                  disabled={converting !== null}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md transition min-h-[44px] disabled:opacity-50"
                  aria-label={`${t('library.convertChapter')} ${ch.title}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                  {t('library.convertChapter')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
