import { useTranslation } from '@mycircle/shared';
import type { RadioTag } from '../types';

interface FilterBarProps {
  tags: RadioTag[];
  countries: string[];
  activeTag: string | undefined;
  activeCountry: string | undefined;
  onTagChange: (tag: string | undefined) => void;
  onCountryChange: (country: string | undefined) => void;
}

export function FilterBar({ tags, countries, activeTag, activeCountry, onTagChange, onCountryChange }: FilterBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      <div className="flex items-center gap-2">
        <select
          aria-label={t('radio.filter.genre')}
          value={activeTag ?? ''}
          onChange={(e) => onTagChange(e.target.value || undefined)}
          className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">{t('radio.filter.genre')}: {t('radio.filter.all')}</option>
          {tags.map((tag) => (
            <option key={tag.name} value={tag.name}>
              {tag.name} ({tag.stationCount})
            </option>
          ))}
        </select>

        <select
          aria-label={t('radio.filter.country')}
          value={activeCountry ?? ''}
          onChange={(e) => onCountryChange(e.target.value || undefined)}
          className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">{t('radio.filter.country')}: {t('radio.filter.all')}</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {activeTag && (
          <span className="inline-flex min-h-[44px] items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {activeTag}
            <button
              type="button"
              aria-label={`${t('radio.filter.clearAll')} ${activeTag}`}
              onClick={() => onTagChange(undefined)}
              className="ml-1 rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              ×
            </button>
          </span>
        )}
        {activeCountry && (
          <span className="inline-flex min-h-[44px] items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900 dark:text-green-200">
            {activeCountry}
            <button
              type="button"
              aria-label={`${t('radio.filter.clearAll')} ${activeCountry}`}
              onClick={() => onCountryChange(undefined)}
              className="ml-1 rounded-full p-0.5 hover:bg-green-200 dark:hover:bg-green-800"
            >
              ×
            </button>
          </span>
        )}
        {(activeTag || activeCountry) && (
          <button
            type="button"
            aria-label={t('radio.filter.clearAll')}
            onClick={() => { onTagChange(undefined); onCountryChange(undefined); }}
            className="min-h-[44px] rounded-lg px-3 py-1 text-sm text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {t('radio.filter.clearAll')}
          </button>
        )}
      </div>
    </div>
  );
}
