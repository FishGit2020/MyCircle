import React from 'react';
import { useTranslation } from '@mycircle/shared';

interface Chapter {
  index: number;
  title: string;
  href: string;
  characterCount: number;
}

interface TableOfContentsProps {
  chapters: Chapter[];
  currentChapter: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export default function TableOfContents({ chapters, currentChapter, onSelect, onClose }: TableOfContentsProps) {
  const { t } = useTranslation();

  return (
    <div className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col md:relative absolute left-0 top-0 bottom-0 z-20 shadow-lg md:shadow-none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{t('library.tableOfContents')}</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto" aria-label={t('library.tableOfContents')}>
        <ul className="py-1">
          {chapters.map((chapter) => (
            <li key={chapter.index}>
              <button
                type="button"
                onClick={() => onSelect(chapter.index)}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors min-h-[44px] ${
                  currentChapter === chapter.index
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                aria-current={currentChapter === chapter.index ? 'true' : undefined}
              >
                <span className="line-clamp-2">{chapter.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
