import React from 'react';
import { useTranslation } from '@mycircle/shared';

export type SortOption = 'recentlyAdded' | 'recentlyRead' | 'titleAZ';

interface LibrarySearchSortProps {
  search: string;
  sort: SortOption;
  onSearch: (value: string) => void;
  onSort: (value: SortOption) => void;
}

export default function LibrarySearchSort({ search, sort, onSearch, onSort }: LibrarySearchSortProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4">
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={t('library.searchPlaceholder' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
          aria-label={t('library.searchPlaceholder' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        />
      </div>
      <select
        value={sort}
        onChange={e => onSort(e.target.value as SortOption)}
        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
        aria-label={t('library.sortLabel' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
      >
        <option value="recentlyAdded">{t('library.sortRecentlyAdded' as any)}</option> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        <option value="recentlyRead">{t('library.sortRecentlyRead' as any)}</option> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        <option value="titleAZ">{t('library.sortTitleAZ' as any)}</option> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
      </select>
    </div>
  );
}
