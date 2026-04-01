import { useTranslation, useQuery, GET_TTS_QUOTA } from '@mycircle/shared';

function formatChars(chars: number): string {
  if (chars >= 1_000_000) return `${(chars / 1_000_000).toFixed(1)}M`;
  if (chars >= 1_000) return `${(chars / 1_000).toFixed(0)}K`;
  return String(chars);
}

function QuotaRow({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(used / limit, 1) : 0;
  const pctRounded = Math.round(pct * 100);
  const isWarning = pct >= 0.8;
  const isNearFull = pct >= 0.9;
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{formatChars(used)} / {formatChars(limit)}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-label={`${label}: ${pctRounded}%`}
        className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
      >
        <div
          className={`h-full rounded-full transition-all ${
            isNearFull ? 'bg-red-500 dark:bg-red-400' : isWarning ? 'bg-amber-500 dark:bg-amber-400' : 'bg-purple-500 dark:bg-purple-400'
          }`}
          style={{ width: `${pctRounded}%` }}
        />
      </div>
    </div>
  );
}

export default function TtsQuotaBar() {
  const { t } = useTranslation();
  const { data } = useQuery(GET_TTS_QUOTA);

  const ws = data?.ttsQuota?.wavenetStandard;
  const np = data?.ttsQuota?.neural2Polyglot;
  const c3 = data?.ttsQuota?.chirp3;

  const anyNearFull = [ws, np, c3].some(q => q && q.used / q.limit >= 0.9);

  return (
    <div className="mb-4">
      <span className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-1">{t('library.ttsQuota')}</span>
      <QuotaRow label="WaveNet / Standard (4M free)" used={ws?.used ?? 0} limit={ws?.limit ?? 3_600_000} />
      <QuotaRow label="Neural2 / Polyglot (1M free)" used={np?.used ?? 0} limit={np?.limit ?? 900_000} />
      <QuotaRow label="Chirp3 HD (1M free)"           used={c3?.used ?? 0} limit={c3?.limit ?? 900_000} />
      {anyNearFull && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{t('library.ttsQuotaNearLimit')}</p>
      )}
    </div>
  );
}
