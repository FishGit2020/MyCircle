import { useTranslation } from '@mycircle/shared';
import { formatFileSize } from '../utils/fileHelpers';

interface StorageQuotaBarProps {
  usedBytes: number;
  totalBytes: number;
}

export default function StorageQuotaBar({ usedBytes, totalBytes }: StorageQuotaBarProps) {
  const { t } = useTranslation();
  const pct = totalBytes > 0 ? Math.min(usedBytes / totalBytes, 1) : 0;
  const pctRounded = Math.round(pct * 100);
  const isNearFull = pct >= 0.9;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">{t('cloudFiles.storageUsed')}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(usedBytes)} {t('cloudFiles.storageOf')} {formatFileSize(totalBytes)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={usedBytes}
        aria-valuemin={0}
        aria-valuemax={totalBytes}
        aria-label={`${t('cloudFiles.storageUsed')}: ${pctRounded}%`}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-all ${isNearFull ? 'bg-red-500 dark:bg-red-400' : 'bg-cyan-500 dark:bg-cyan-400'}`}
          style={{ width: `${pctRounded}%` }}
        />
      </div>
      {isNearFull && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{t('cloudFiles.storageNearFull')}</p>
      )}
    </div>
  );
}
