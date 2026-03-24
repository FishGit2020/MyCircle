import { useTranslation } from '@mycircle/shared';
import type { FileTypeCategory } from '../utils/fileHelpers';

interface SearchFilterBarProps {
  query: string;
  typeFilter: FileTypeCategory | null;
  onQueryChange: (q: string) => void;
  onTypeFilterChange: (f: FileTypeCategory | null) => void;
}

type FilterButton = { value: FileTypeCategory | null; labelKey: string };

const FILTERS: FilterButton[] = [
  { value: null, labelKey: 'cloudFiles.filterAll' },
  { value: 'image', labelKey: 'cloudFiles.filterImages' },
  { value: 'pdf', labelKey: 'cloudFiles.filterPdfs' },
  { value: 'doc', labelKey: 'cloudFiles.filterDocs' },
];

export default function SearchFilterBar({ query, typeFilter, onQueryChange, onTypeFilterChange }: SearchFilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-4 space-y-2">
      {/* Search input */}
      <input
        type="search"
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        placeholder={t('cloudFiles.searchPlaceholder')}
        aria-label={t('cloudFiles.searchPlaceholder')}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
      />

      {/* Type filter pills */}
      <div className="flex gap-2 flex-wrap" role="group" aria-label={t('cloudFiles.filterAll')}>
        {FILTERS.map(f => (
          <button
            key={f.labelKey}
            type="button"
            onClick={() => onTypeFilterChange(f.value)}
            aria-pressed={typeFilter === f.value}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors min-h-[44px] min-w-[44px] ${
              typeFilter === f.value
                ? 'bg-cyan-500 dark:bg-cyan-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
