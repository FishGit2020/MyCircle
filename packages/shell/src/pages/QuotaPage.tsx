import React, { useState } from 'react';
import {
  useTranslation,
  useQuery,
  useMutation,
  PageContent,
  GET_QUOTA_SNAPSHOTS,
  COLLECT_QUOTA_SNAPSHOT,
  DUMP_QUOTA_TO_SQL,
  GET_SQL_CONNECTION_STATUS,
} from '@mycircle/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyMetric {
  today: number;
  peak7d: number;
  freeTierLimit: number;
  exceeded7d: boolean;
}

interface TtsQuotaEntry {
  used: number;
  limit: number;
  remaining: number;
}

interface QuotaSnapshot {
  id: string;
  collectedAt: string;
  elapsedDays: number;
  daysInMonth: number;
  totalMtdCostUsd: number;
  totalProjectedCostUsd: number;
  errors: string[];
  cloudRun: {
    totalRequests: number;
    freeTierLimit: number;
    mtdCostUsd: number;
    projectedCostUsd: number;
    byService: { serviceName: string; requests: number }[];
  };
  functions: {
    totalInvocations: number;
    freeTierLimit: number;
    mtdCostUsd: number;
    projectedCostUsd: number;
    byFunction: { functionName: string; invocations: number }[];
  };
  storage: {
    totalBytes: number;
    bandwidthBytes: number;
    freeTierStorageBytes: number;
    freeTierBandwidthBytes: number;
    mtdCostUsd: number;
    projectedCostUsd: number;
    byFolder: { folder: string; bytes: number }[];
  };
  firestore: {
    mtdCostUsd: number;
    projectedCostUsd: number;
    reads: DailyMetric;
    writes: DailyMetric;
    deletes: DailyMetric;
  };
  tts: {
    wavenetStandard: TtsQuotaEntry;
    neural2Polyglot: TtsQuotaEntry;
    chirp3: TtsQuotaEntry;
  };
  artifactRegistry: {
    totalBytes: number;
    freeTierBytes: number;
    mtdCostUsd: number;
    projectedCostUsd: number;
    byRepository: { repository: string; bytes: number }[];
  };
  hosting: {
    storageBytes: number | null;
    dailyDownloadBytes: number | null;
    freeTierStorageBytes: number;
    freeTierDailyDownloadBytes: number;
    mtdCostUsd: number;
    projectedCostUsd: number;
    unavailable: boolean;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function fmtCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

function pct(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.round((used / limit) * 100);
}

function statusColor(percent: number): 'green' | 'yellow' | 'red' {
  if (percent > 100) return 'red';
  if (percent > 80) return 'yellow';
  return 'green';
}

function fmtTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  formattedValue: string;
  formattedLimit: string;
  limitPeriod: 'daily' | 'monthly';
  percent: number;
  status: 'green' | 'yellow' | 'red';
  mtdCostUsd: number;
  projectedCostUsd: number;
  elapsedDays: number;
  consoleUrl: string;
  breakdown?: { name: string; value: string }[];
  peakLine?: { label: string; exceeded: boolean };
}

const STATUS_DOT: Record<'green' | 'yellow' | 'red', string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
};

const STATUS_PERCENT: Record<'green' | 'yellow' | 'red', string> = {
  green: 'text-green-600 dark:text-green-400',
  yellow: 'text-yellow-600 dark:text-yellow-400',
  red: 'text-red-600 dark:text-red-400',
};

function MetricCard({
  label, formattedValue, formattedLimit, limitPeriod, percent, status,
  mtdCostUsd, projectedCostUsd, elapsedDays, consoleUrl, breakdown, peakLine,
}: MetricCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2"
      aria-label={`${label}: ${formattedValue} of ${formattedLimit} ${limitPeriod === 'daily' ? t('quotaBilling.perDay') : t('quotaBilling.perMonth')} — ${status === 'green' ? 'within free tier' : status === 'yellow' ? 'approaching limit' : 'exceeded free tier'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[status]}`} />
          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{label}</span>
        </div>
        <a
          href={consoleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline flex-shrink-0"
          aria-label={`Open ${label} console`}
        >
          Console ↗
        </a>
      </div>

      {/* Usage */}
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold ${STATUS_PERCENT[status]}`}>{formattedValue}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          / {formattedLimit} {limitPeriod === 'daily' ? t('quotaBilling.perDay') : t('quotaBilling.perMonth')}
        </span>
      </div>

      {/* Percent bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${status === 'green' ? 'bg-green-500' : status === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      {/* Peak warning */}
      {peakLine && (
        <p className={`text-xs ${peakLine.exceeded ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
          {peakLine.label}
        </p>
      )}

      {/* Breakdown */}
      {breakdown && breakdown.length > 0 && (
        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 border-t border-gray-100 dark:border-gray-700 pt-2 mt-1">
          {breakdown.map(({ name, value }) => (
            <li key={name} className="flex justify-between">
              <span className="truncate mr-2">{name}</span>
              <span className="flex-shrink-0">{value}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Costs */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-700 mt-auto">
        <span className={`text-xs font-medium ${mtdCostUsd > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {fmtCost(mtdCostUsd)} {t('quotaBilling.mtdCost')}
        </span>
        <span className="text-gray-300 dark:text-gray-600">·</span>
        <span className={`text-xs ${projectedCostUsd > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {t('quotaBilling.projectedCost')} {fmtCost(projectedCostUsd)} {t('quotaBilling.perMonth')}
        </span>
        {elapsedDays < 7 && (
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">({elapsedDays}d)</span>
        )}
      </div>
    </div>
  );
}

// ─── HistoryChart ─────────────────────────────────────────────────────────────

function HistoryChart({ snapshots }: { snapshots: QuotaSnapshot[] }) {
  const [activeMetric, setActiveMetric] = useState<'total' | 'cloudRun' | 'storage' | 'tts' | 'artifactRegistry'>('total');

  const ordered = [...snapshots].sort((a, b) => a.collectedAt.localeCompare(b.collectedAt));
  const WIDTH = 400;
  const HEIGHT = 160;
  const PAD = { top: 10, right: 20, bottom: 30, left: 45 };
  const chartW = WIDTH - PAD.left - PAD.right;
  const chartH = HEIGHT - PAD.top - PAD.bottom;

  const getValue = (s: QuotaSnapshot) => {
    switch (activeMetric) {
      case 'cloudRun': return s.cloudRun.mtdCostUsd;
      case 'storage': return s.storage.mtdCostUsd;
      case 'tts': return (s.tts.wavenetStandard.used + s.tts.neural2Polyglot.used + s.tts.chirp3.used) > 0 ? s.totalMtdCostUsd : 0;
      case 'artifactRegistry': return s.artifactRegistry.mtdCostUsd;
      default: return s.totalMtdCostUsd;
    }
  };

  const values = ordered.map(getValue);
  const maxY = Math.max(...values, 0.01);
  const xStep = ordered.length > 1 ? chartW / (ordered.length - 1) : chartW;

  const points = ordered.map((s, i) => {
    const x = PAD.left + (ordered.length > 1 ? i * xStep : chartW / 2);
    const y = PAD.top + chartH - (getValue(s) / maxY) * chartH;
    return `${x},${y}`;
  });

  const buttons: { key: typeof activeMetric; label: string }[] = [
    { key: 'total', label: 'Total' },
    { key: 'cloudRun', label: 'Cloud Run' },
    { key: 'storage', label: 'Storage' },
    { key: 'tts', label: 'TTS' },
    { key: 'artifactRegistry', label: 'Registry' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-wrap gap-1 mb-3">
        {buttons.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveMetric(key)}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors ${activeMetric === key ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Usage cost history chart">
        {/* Y-axis labels */}
        {[0, 0.5, 1].map(frac => (
          <text
            key={frac}
            x={PAD.left - 4}
            y={PAD.top + chartH * (1 - frac) + 4}
            textAnchor="end"
            fontSize={8}
            className="fill-gray-400"
          >
            ${(maxY * frac).toFixed(2)}
          </text>
        ))}
        {/* X-axis date labels */}
        {ordered.map((s, i) => {
          const x = PAD.left + (ordered.length > 1 ? i * xStep : chartW / 2);
          const d = new Date(s.collectedAt);
          const label = `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
          return (
            <text key={s.id} x={x} y={HEIGHT - 4} textAnchor="middle" fontSize={8} className="fill-gray-400">
              {label}
            </text>
          );
        })}
        {/* Polyline */}
        {points.length >= 2 && (
          <polyline
            points={points.join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}
        {/* Dots */}
        {ordered.map((s, i) => {
          const x = PAD.left + (ordered.length > 1 ? i * xStep : chartW / 2);
          const y = PAD.top + chartH - (getValue(s) / maxY) * chartH;
          return <circle key={s.id} cx={x} cy={y} r={3} fill="#3b82f6" />;
        })}
      </svg>
    </div>
  );
}

// ─── QuotaPage ────────────────────────────────────────────────────────────────

export default function QuotaPage() {
  const { t } = useTranslation();
  const [dumpSuccess, setDumpSuccess] = useState(false);

  const { data: snapshotsData, loading: snapshotsLoading, refetch } = useQuery(
    GET_QUOTA_SNAPSHOTS,
    { variables: { limit: 10 }, fetchPolicy: 'cache-and-network' },
  );

  const [collectSnapshot, { loading: collecting }] = useMutation(COLLECT_QUOTA_SNAPSHOT, {
    onCompleted: () => refetch(),
  });

  const { data: sqlData } = useQuery(GET_SQL_CONNECTION_STATUS);
  const [dumpToSql, { loading: dumping, error: dumpError }] = useMutation(DUMP_QUOTA_TO_SQL, {
    onCompleted: () => {
      setDumpSuccess(true);
      setTimeout(() => setDumpSuccess(false), 3000);
    },
  });

  const snapshots: QuotaSnapshot[] = snapshotsData?.quotaSnapshots?.snapshots ?? [];
  const latest = snapshots[0] ?? null;
  const sqlConnected =
    sqlData?.sqlConnectionStatus?.hasCredentials === true &&
    sqlData?.sqlConnectionStatus?.status === 'connected';

  return (
    <PageContent>
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('quotaBilling.title')}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="https://console.cloud.google.com/billing/01752D-EE3836-922FD4"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('quotaBilling.viewInBilling')} ↗
            </a>
            <a
              href="https://console.firebase.google.com/u/0/project/mycircle-dash/usage"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('quotaBilling.firebaseUsage')} ↗
            </a>
          </div>
        </div>

        {/* Refresh row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            onClick={() => collectSnapshot()}
            disabled={collecting || snapshotsLoading}
            aria-label={collecting ? t('quotaBilling.refreshing') : t('quotaBilling.refreshNow')}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {collecting ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('quotaBilling.refreshing')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('quotaBilling.refreshNow')}
              </>
            )}
          </button>

          {latest && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('quotaBilling.lastRefreshed')}: {fmtTimestamp(latest.collectedAt)}
              {latest.elapsedDays > 0 && (
                <span className="ml-2 text-gray-400 dark:text-gray-500">
                  · {t('quotaBilling.projectedCost')} {fmtCost(latest.totalProjectedCostUsd)} {t('quotaBilling.perMonth')}
                  {latest.elapsedDays < 7 && (
                    <span className="ml-1 italic">({latest.elapsedDays}d data)</span>
                  )}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Error banner */}
        {latest && latest.errors.length > 0 && (
          <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 text-sm">
            {t('quotaBilling.partialError')}: {latest.errors.join(', ')}
          </div>
        )}
      </div>

      {/* Empty state */}
      {snapshots.length === 0 && !snapshotsLoading && (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="12" width="4" height="9" rx="1" />
            <rect x="10" y="7" width="4" height="14" rx="1" />
            <rect x="17" y="3" width="4" height="18" rx="1" />
          </svg>
          <p>{t('quotaBilling.noData')}</p>
        </div>
      )}

      {/* Metric cards */}
      {latest && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          {/* Cloud Run */}
          {(() => {
            const p = pct(latest.cloudRun.totalRequests, latest.cloudRun.freeTierLimit);
            return (
              <MetricCard
                label={t('quotaBilling.cloudRun')}
                formattedValue={fmtNum(latest.cloudRun.totalRequests)}
                formattedLimit={fmtNum(latest.cloudRun.freeTierLimit)}
                limitPeriod="monthly"
                percent={p}
                status={statusColor(p)}
                mtdCostUsd={latest.cloudRun.mtdCostUsd}
                projectedCostUsd={latest.cloudRun.projectedCostUsd}
                elapsedDays={latest.elapsedDays}
                consoleUrl="https://console.cloud.google.com/run?project=mycircle-dash"
                breakdown={latest.cloudRun.byService.map(s => ({ name: s.serviceName, value: fmtNum(s.requests) }))}
              />
            );
          })()}

          {/* Firebase Functions */}
          {(() => {
            const p = pct(latest.functions.totalInvocations, latest.functions.freeTierLimit);
            return (
              <MetricCard
                label={t('quotaBilling.functions')}
                formattedValue={fmtNum(latest.functions.totalInvocations)}
                formattedLimit={fmtNum(latest.functions.freeTierLimit)}
                limitPeriod="monthly"
                percent={p}
                status={statusColor(p)}
                mtdCostUsd={latest.functions.mtdCostUsd}
                projectedCostUsd={latest.functions.projectedCostUsd}
                elapsedDays={latest.elapsedDays}
                consoleUrl="https://console.firebase.google.com/u/0/project/mycircle-dash/functions"
                breakdown={latest.functions.byFunction.map(f => ({ name: f.functionName, value: fmtNum(f.invocations) }))}
              />
            );
          })()}

          {/* Firebase Storage */}
          {(() => {
            const storePct = pct(latest.storage.totalBytes, latest.storage.freeTierStorageBytes);
            const bwPct = pct(latest.storage.bandwidthBytes, latest.storage.freeTierBandwidthBytes);
            const p = Math.max(storePct, bwPct);
            return (
              <MetricCard
                label={t('quotaBilling.storage')}
                formattedValue={fmtBytes(latest.storage.totalBytes)}
                formattedLimit={fmtBytes(latest.storage.freeTierStorageBytes)}
                limitPeriod="monthly"
                percent={p}
                status={statusColor(p)}
                mtdCostUsd={latest.storage.mtdCostUsd}
                projectedCostUsd={latest.storage.projectedCostUsd}
                elapsedDays={latest.elapsedDays}
                consoleUrl="https://console.cloud.google.com/storage/browser?project=mycircle-dash"
                breakdown={[
                  ...latest.storage.byFolder.map(f => ({ name: f.folder, value: fmtBytes(f.bytes) })),
                  { name: t('quotaBilling.bandwidth'), value: `${fmtBytes(latest.storage.bandwidthBytes)} / ${fmtBytes(latest.storage.freeTierBandwidthBytes)} ${t('quotaBilling.perMonth')}` },
                ]}
              />
            );
          })()}

          {/* Firestore */}
          {(() => {
            const readPct = pct(latest.firestore.reads.today, latest.firestore.reads.freeTierLimit);
            const writePct = pct(latest.firestore.writes.today, latest.firestore.writes.freeTierLimit);
            const delPct = pct(latest.firestore.deletes.today, latest.firestore.deletes.freeTierLimit);
            const p = Math.max(readPct, writePct, delPct);
            const anyExceeded = latest.firestore.reads.exceeded7d || latest.firestore.writes.exceeded7d || latest.firestore.deletes.exceeded7d;
            const peakLabel = [
              latest.firestore.reads.exceeded7d && `Reads peaked at ${fmtNum(latest.firestore.reads.peak7d)}/day (limit: ${fmtNum(latest.firestore.reads.freeTierLimit)})`,
              latest.firestore.writes.exceeded7d && `Writes peaked at ${fmtNum(latest.firestore.writes.peak7d)}/day (limit: ${fmtNum(latest.firestore.writes.freeTierLimit)})`,
              latest.firestore.deletes.exceeded7d && `Deletes peaked at ${fmtNum(latest.firestore.deletes.peak7d)}/day (limit: ${fmtNum(latest.firestore.deletes.freeTierLimit)})`,
            ].filter(Boolean).join(' · ');
            return (
              <MetricCard
                label={t('quotaBilling.firestore')}
                formattedValue={`${fmtNum(latest.firestore.reads.today)}R / ${fmtNum(latest.firestore.writes.today)}W / ${fmtNum(latest.firestore.deletes.today)}D`}
                formattedLimit={`${fmtNum(latest.firestore.reads.freeTierLimit)}R / ${fmtNum(latest.firestore.writes.freeTierLimit)}W`}
                limitPeriod="daily"
                percent={p}
                status={statusColor(p)}
                mtdCostUsd={latest.firestore.mtdCostUsd}
                projectedCostUsd={latest.firestore.projectedCostUsd}
                elapsedDays={latest.elapsedDays}
                consoleUrl="https://console.cloud.google.com/firestore/data?project=mycircle-dash"
                peakLine={anyExceeded ? { label: peakLabel, exceeded: true } : undefined}
                breakdown={[
                  { name: t('quotaBilling.reads'), value: `${fmtNum(latest.firestore.reads.today)} today (peak: ${fmtNum(latest.firestore.reads.peak7d)})` },
                  { name: t('quotaBilling.writes'), value: `${fmtNum(latest.firestore.writes.today)} today (peak: ${fmtNum(latest.firestore.writes.peak7d)})` },
                  { name: t('quotaBilling.deletes'), value: `${fmtNum(latest.firestore.deletes.today)} today (peak: ${fmtNum(latest.firestore.deletes.peak7d)})` },
                ]}
              />
            );
          })()}

          {/* TTS */}
          {(() => {
            const waveUsed = latest.tts.wavenetStandard.used;
            const waveLimit = latest.tts.wavenetStandard.limit;
            const neural2Used = latest.tts.neural2Polyglot.used;
            const neural2Limit = latest.tts.neural2Polyglot.limit;
            const chirp3Used = latest.tts.chirp3.used;
            const chirp3Limit = latest.tts.chirp3.limit;
            const p = Math.max(pct(waveUsed, waveLimit), pct(neural2Used, neural2Limit), pct(chirp3Used, chirp3Limit));
            const totalUsed = waveUsed + neural2Used + chirp3Used;
            const totalCost = (latest.cloudRun.mtdCostUsd === 0 && latest.storage.mtdCostUsd === 0) ? latest.totalMtdCostUsd : 0;
            return (
              <MetricCard
                label={t('quotaBilling.tts')}
                formattedValue={fmtNum(totalUsed)}
                formattedLimit={`${fmtNum(waveLimit)} WaveNet`}
                limitPeriod="monthly"
                percent={p}
                status={statusColor(p)}
                mtdCostUsd={totalCost}
                projectedCostUsd={calcTtsProjected(latest)}
                elapsedDays={latest.elapsedDays}
                consoleUrl="https://console.cloud.google.com/apis/api/texttospeech.googleapis.com/quotas?project=mycircle-dash"
                breakdown={[
                  { name: 'WaveNet/Standard', value: `${fmtNum(waveUsed)} / ${fmtNum(waveLimit)}` },
                  { name: 'Neural2/Polyglot', value: `${fmtNum(neural2Used)} / ${fmtNum(neural2Limit)}` },
                  { name: 'Chirp3-HD', value: `${fmtNum(chirp3Used)} / ${fmtNum(chirp3Limit)}` },
                ]}
              />
            );
          })()}

          {/* Artifact Registry */}
          {(() => {
            const p = pct(latest.artifactRegistry.totalBytes, latest.artifactRegistry.freeTierBytes);
            return (
              <MetricCard
                label={t('quotaBilling.artifactRegistry')}
                formattedValue={fmtBytes(latest.artifactRegistry.totalBytes)}
                formattedLimit={fmtBytes(latest.artifactRegistry.freeTierBytes)}
                limitPeriod="monthly"
                percent={p}
                status={statusColor(p)}
                mtdCostUsd={latest.artifactRegistry.mtdCostUsd}
                projectedCostUsd={latest.artifactRegistry.projectedCostUsd}
                elapsedDays={latest.elapsedDays}
                consoleUrl="https://console.cloud.google.com/artifacts?project=mycircle-dash"
                breakdown={latest.artifactRegistry.byRepository.map(r => ({ name: r.repository, value: fmtBytes(r.bytes) }))}
              />
            );
          })()}

          {/* Firebase Hosting */}
          {(() => {
            if (latest.hosting.unavailable) {
              return (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{t('quotaBilling.hosting')}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('quotaBilling.unavailable')}</p>
                  <a
                    href="https://console.firebase.google.com/u/0/project/mycircle-dash/hosting"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 underline"
                  >
                    Firebase Hosting Console ↗
                  </a>
                </div>
              );
            }
            const storagePct = latest.hosting.storageBytes != null
              ? pct(latest.hosting.storageBytes, latest.hosting.freeTierStorageBytes)
              : 0;
            const dlPct = latest.hosting.dailyDownloadBytes != null
              ? pct(latest.hosting.dailyDownloadBytes, latest.hosting.freeTierDailyDownloadBytes)
              : 0;
            const p = Math.max(storagePct, dlPct);
            return (
              <MetricCard
                label={t('quotaBilling.hosting')}
                formattedValue={latest.hosting.storageBytes != null ? fmtBytes(latest.hosting.storageBytes) : 'N/A'}
                formattedLimit={fmtBytes(latest.hosting.freeTierStorageBytes)}
                limitPeriod="monthly"
                percent={p}
                status={statusColor(p)}
                mtdCostUsd={latest.hosting.mtdCostUsd}
                projectedCostUsd={latest.hosting.projectedCostUsd}
                elapsedDays={latest.elapsedDays}
                consoleUrl="https://console.firebase.google.com/u/0/project/mycircle-dash/hosting"
                breakdown={[
                  { name: 'Storage', value: latest.hosting.storageBytes != null ? `${fmtBytes(latest.hosting.storageBytes)} / ${fmtBytes(latest.hosting.freeTierStorageBytes)}` : 'N/A' },
                  { name: 'Downloads/day', value: latest.hosting.dailyDownloadBytes != null ? `${fmtBytes(latest.hosting.dailyDownloadBytes)} / ${fmtBytes(latest.hosting.freeTierDailyDownloadBytes)}` : 'N/A' },
                ]}
              />
            );
          })()}
        </div>
      )}

      {/* History chart */}
      {snapshots.length >= 2 && (
        <div className="mb-8">
          <HistoryChart snapshots={snapshots} />
        </div>
      )}
      {snapshots.length === 1 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">{t('quotaBilling.historyNote')}</p>
      )}

      {/* Dump to SQL */}
      {sqlConnected && snapshots.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => dumpToSql()}
            disabled={dumping}
            aria-label={t('quotaBilling.dumpToSql')}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-gray-700 hover:bg-gray-800 disabled:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {dumping ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('quotaBilling.dumpToSql')}
              </>
            )}
          </button>
          {dumpSuccess && (
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              ✓ {t('quotaBilling.dumpSuccess')}
            </span>
          )}
          {dumpError && (
            <span className="text-sm text-red-600 dark:text-red-400">
              {dumpError.message}
            </span>
          )}
        </div>
      )}
    </PageContent>
  );
}

// Helper to calculate TTS projected cost from snapshot
function calcTtsProjected(snapshot: QuotaSnapshot): number {
  return snapshot.totalProjectedCostUsd;
}
