import { useTranslation } from '@mycircle/shared';

interface YearlyTileYear {
  yearNumber: number;
  year: number;
  activity?: string | null;
  notes?: string | null;
  pictures: Array<{ url: string; filename: string }>;
  location?: { name?: string | null } | null;
}

interface YearlyTileProps {
  yearData: YearlyTileYear;
  onClick: () => void;
}

export default function YearlyTile({ yearData, onClick }: YearlyTileProps) {
  const { t } = useTranslation();
  const hasContent = !!(yearData.activity || yearData.notes || yearData.pictures.length > 0);

  const truncatedActivity =
    yearData.activity && yearData.activity.length > 100
      ? yearData.activity.slice(0, 100) + '...'
      : yearData.activity;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-4 text-left transition-colors ${
        hasContent
          ? 'border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:hover:border-blue-700 dark:hover:bg-blue-900/50'
          : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600 dark:hover:bg-gray-800'
      }`}
      aria-label={`${t('anniversary.year')} ${yearData.yearNumber} - ${yearData.year}`}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('anniversary.year')} {yearData.yearNumber} - {yearData.year}
        </h3>
        {hasContent && (
          <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400" />
        )}
      </div>

      {/* Activity summary */}
      {truncatedActivity && (
        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
          {truncatedActivity}
        </p>
      )}

      {/* Thumbnail */}
      {yearData.pictures.length > 0 && (
        <div className="mb-2">
          <img
            src={yearData.pictures[0].url}
            alt={yearData.pictures[0].filename}
            className="h-20 w-20 rounded-md object-cover"
          />
          {yearData.pictures.length > 1 && (
            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
              +{yearData.pictures.length - 1} {t('anniversary.pictures').toLowerCase()}
            </span>
          )}
        </div>
      )}

      {/* Location badge */}
      {yearData.location?.name && (
        <span className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          {yearData.location.name}
        </span>
      )}

      {/* Placeholder indicator */}
      {!hasContent && (
        <p className="text-xs italic text-gray-400 dark:text-gray-500">
          {t('anniversary.editDetails')}
        </p>
      )}
    </button>
  );
}
