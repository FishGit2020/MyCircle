import { useTranslation, useQuery, GET_STORAGE_USAGE } from '@mycircle/shared';
import { formatFileSize } from '../utils/fileHelpers';

const FIREBASE_CONSOLE_URL =
  'https://console.firebase.google.com/project/mycircle-dash/storage';

export default function StorageQuotaBar() {
  const { t } = useTranslation();
  const { data, loading } = useQuery(GET_STORAGE_USAGE);

  const usedBytes = data?.storageUsage?.usedBytes ?? 0;
  const totalBytes = data?.storageUsage?.totalBytes ?? 1_073_741_824;
  const pct = totalBytes > 0 ? Math.min(usedBytes / totalBytes, 1) : 0;
  const pctRounded = Math.round(pct * 100);
  const isWarning = pct >= 0.8;
  const isNearFull = pct >= 0.9;
  const isOver = usedBytes > totalBytes;

  return (
    <div className="mb-4">
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
          {t('cloudFiles.storageUsed')}
        </span>
        <a
          href={FIREBASE_CONSOLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
          aria-label={t('cloudFiles.storageViewConsole')}
        >
          {t('cloudFiles.storageViewConsole')}
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Usage line */}
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {t('cloudFiles.storageFreeLimit')}
        </span>
        <span className={`text-xs ${isOver ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
          {loading ? '…' : `${formatFileSize(usedBytes)} / ${formatFileSize(totalBytes)}`}
        </span>
      </div>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={usedBytes}
        aria-valuemin={0}
        aria-valuemax={totalBytes}
        aria-label={`${t('cloudFiles.storageUsed')}: ${pctRounded}%`}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-all ${
            isNearFull ? 'bg-red-500 dark:bg-red-400' : isWarning ? 'bg-amber-500 dark:bg-amber-400' : 'bg-cyan-500 dark:bg-cyan-400'
          }`}
          style={{ width: `${Math.min(pctRounded, 100)}%` }}
        />
      </div>

      {isOver && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          {t('cloudFiles.storageOverLimit')}
        </p>
      )}
      {!isOver && isNearFull && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
          {t('cloudFiles.storageNearFull')}
        </p>
      )}
    </div>
  );
}
