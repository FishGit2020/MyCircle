import { useState } from 'react';
import { useTranslation, useQuery, GET_TTS_QUOTA } from '@mycircle/shared';

const GCP_CONSOLE_URL =
  'https://console.cloud.google.com/apis/api/texttospeech.googleapis.com/quotas?project=mycircle-dash';

// 90% hard limits applied to GCP per-minute quotas
const RATE_LIMITS = [
  { labelKey: 'library.ttsRateAll',       limit: 900  }, // 90% of 1000
  { labelKey: 'library.ttsRateNeural2',   limit: 900  }, // 90% of 1000
  { labelKey: 'library.ttsRatePolyglot',  limit: 900  }, // 90% of 1000
  { labelKey: 'library.ttsRateChirp3',    limit: 180  }, // 90% of 200
  { labelKey: 'library.ttsRateLongAudio', limit: 90   }, // 90% of 100
] as const;

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
  const [showRates, setShowRates] = useState(false);

  const ws = data?.ttsQuota?.wavenetStandard;
  const np = data?.ttsQuota?.neural2Polyglot;
  const c3 = data?.ttsQuota?.chirp3;

  const anyNearFull = [ws, np, c3].some(q => q && q.used / q.limit >= 0.9);

  return (
    <div className="mb-4">
      {/* Header row: label + console link */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
          {t('library.ttsQuota')}
        </span>
        <a
          href={GCP_CONSOLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
          aria-label={t('library.ttsViewConsole')}
        >
          {t('library.ttsViewConsole')}
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Monthly character quota bars */}
      <QuotaRow label="WaveNet / Standard (4M free)" used={ws?.used ?? 0} limit={ws?.limit ?? 3_600_000} />
      <QuotaRow label="Neural2 / Polyglot (1M free)" used={np?.used ?? 0} limit={np?.limit ?? 900_000} />
      <QuotaRow label="Chirp3 HD (1M free)"           used={c3?.used ?? 0} limit={c3?.limit ?? 900_000} />

      {anyNearFull && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{t('library.ttsQuotaNearLimit')}</p>
      )}

      {/* Collapsible rate limits section */}
      <button
        type="button"
        onClick={() => setShowRates(v => !v)}
        className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 min-h-[44px] -my-2 py-2"
        aria-expanded={showRates}
      >
        <svg
          className={`w-3 h-3 transition-transform flex-shrink-0 ${showRates ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {t('library.ttsRateLimits')}
      </button>

      {showRates && (
        <div className="mt-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-3 py-1.5 text-gray-500 dark:text-gray-400 font-medium">Voice type</th>
                <th className="text-right px-3 py-1.5 text-gray-500 dark:text-gray-400 font-medium">Req / min</th>
              </tr>
            </thead>
            <tbody>
              {RATE_LIMITS.map(({ labelKey, limit }, i) => (
                <tr
                  key={labelKey}
                  className={i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
                >
                  <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{t(labelKey)}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-gray-600 dark:text-gray-400">
                    {limit.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
