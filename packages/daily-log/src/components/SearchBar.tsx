import { useTranslation } from '@mycircle/shared';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const { t } = useTranslation();

  return (
    <div role="search" className="relative">
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={t('dailyLog.searchPlaceholder')}
        aria-label={t('dailyLog.searchPlaceholder')}
        className="w-full pl-9 pr-9 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
      />
      {/* Search icon */}
      <svg
        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('dailyLog.clearSearch')}
          className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
