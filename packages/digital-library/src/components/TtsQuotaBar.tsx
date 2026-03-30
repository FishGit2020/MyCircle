import { useTranslation, useQuery, GET_TTS_QUOTA } from '@mycircle/shared';

function formatChars(chars: number): string {
  if (chars >= 1_000_000) return `${(chars / 1_000_000).toFixed(1)}M`;
  if (chars >= 1_000) return `${(chars / 1_000).toFixed(0)}K`;
  return String(chars);
}

export default function TtsQuotaBar() {
  const { t } = useTranslation();
  const { data } = useQuery(GET_TTS_QUOTA);

  const used = data?.ttsQuota?.used ?? 0;
  const limit = data?.ttsQuota?.limit ?? 3_500_000;
  const pct = limit > 0 ? Math.min(used / limit, 1) : 0;
  const pctRounded = Math.round(pct * 100);
  const isWarning = pct >= 0.8;
  const isNearFull = pct >= 0.9;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">{t('library.ttsQuota')}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatChars(used)} / {formatChars(limit)} {t('library.ttsChars')}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label={`${t('library.ttsQuota')}: ${pctRounded}%`}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-all ${
            isNearFull ? 'bg-red-500 dark:bg-red-400' : isWarning ? 'bg-amber-500 dark:bg-amber-400' : 'bg-purple-500 dark:bg-purple-400'
          }`}
          style={{ width: `${pctRounded}%` }}
        />
      </div>
      {isNearFull && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{t('library.ttsQuotaNearLimit')}</p>
      )}
    </div>
  );
}
