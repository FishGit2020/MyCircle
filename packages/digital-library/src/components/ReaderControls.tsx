import { useTranslation } from '@mycircle/shared';

interface ReaderControlsProps {
  onPrev: () => void;
  onNext: () => void;
  onFontIncrease: () => void;
  onFontDecrease: () => void;
  fontSize: number;
  currentChapter: number;
  totalChapters: number;
  pageInfo?: { page: number; total: number };
  visible: boolean;
}

export default function ReaderControls({
  onPrev,
  onNext,
  onFontIncrease,
  onFontDecrease,
  fontSize,
  currentChapter,
  totalChapters,
  pageInfo,
  visible,
}: ReaderControlsProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div className="mx-2 mb-2 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-lg px-4 py-2">
        {/* Page info */}
        {pageInfo && pageInfo.total > 0 && (
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 mb-1">
            {t('library.pageInfo' as any, { page: pageInfo.page, total: pageInfo.total })} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrev}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={t('library.prevChapter')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[60px] text-center">
              {currentChapter + 1} / {totalChapters}
            </span>
            <button
              type="button"
              onClick={onNext}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={t('library.nextChapter')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onFontDecrease}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={`${t('library.fontSize')} -`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-center">{fontSize}px</span>
            <button
              type="button"
              onClick={onFontIncrease}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={`${t('library.fontSize')} +`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
