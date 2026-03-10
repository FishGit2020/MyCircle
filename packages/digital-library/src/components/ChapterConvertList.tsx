import { useState, useCallback } from 'react';
import { useTranslation, createLogger } from '@mycircle/shared';

const logger = createLogger('ChapterConvertList');

interface Chapter {
  index: number;
  title: string;
  characterCount: number;
  audioUrl?: string;
}

interface Props {
  bookId: string;
  chapters: Chapter[];
  voiceName: string;
  onChapterConverted: () => void;
  onPlay: (chapterIndex: number) => void;
}

export default function ChapterConvertList({ bookId, chapters, voiceName, onChapterConverted, onPlay }: Props) {
  const { t } = useTranslation();
  const [converting, setConverting] = useState<number | null>(null);

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
      if (res.ok) {
        // Poll for completion — chapter conversion is fast (single chapter)
        let attempts = 0;
        const poll = async () => {
          attempts++;
          // Wait for chapter to appear with audioUrl via parent refetch
          await new Promise(r => setTimeout(r, 3000));
          onChapterConverted();
          if (attempts < 40) { // max ~2 min polling
            // Check if chapter now has audio by re-fetching
            setTimeout(poll, 3000);
          }
        };
        poll();
      } else if (res.status === 429) {
        const data = await res.json();
        logger.warn('TTS quota reached', data);
      }
    } catch (err) {
      logger.error('Chapter conversion failed', err);
    } finally {
      // Clear converting state after a delay to let poll catch up
      setTimeout(() => setConverting(null), 5000);
    }
  }, [bookId, voiceName, onChapterConverted]);

  const convertedCount = chapters.filter(ch => ch.audioUrl).length;

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

              {/* Action button */}
              {hasAudio ? (
                <button
                  type="button"
                  onClick={() => onPlay(ch.index)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-md transition min-h-[44px]"
                  aria-label={`${t('library.play')} ${ch.title}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                  {t('library.play')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConvert(ch.index)}
                  disabled={isConverting || converting !== null}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md transition min-h-[44px] disabled:opacity-50"
                  aria-label={`${t('library.convertChapter')} ${ch.title}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                  {isConverting ? t('library.converting') : t('library.convertChapter')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
