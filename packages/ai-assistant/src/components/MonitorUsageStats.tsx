import { useTranslation } from '@mycircle/shared';

interface UsageSummary {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  ollamaCalls: number;
  geminiCalls: number;
  avgLatencyMs: number;
  errorRate: number;
}

interface Props {
  usage?: UsageSummary;
  loading: boolean;
}

function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-800 dark:text-white">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
      <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function MonitorUsageStats({ usage, loading }: Props) {
  const { t } = useTranslation();

  if (loading && !usage) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (!usage) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <StatCard label={t('ai.monitor.totalCalls')} value={formatNumber(usage.totalCalls)} />
      <StatCard
        label={t('ai.monitor.inputTokens')}
        value={formatNumber(usage.totalInputTokens)}
      />
      <StatCard
        label={t('ai.monitor.outputTokens')}
        value={formatNumber(usage.totalOutputTokens)}
      />
      <StatCard
        label={t('ai.monitor.ollamaCalls') + ' / ' + t('ai.monitor.geminiCalls')}
        value={`${usage.ollamaCalls} / ${usage.geminiCalls}`}
      />
      <StatCard
        label={t('ai.monitor.avgLatency')}
        value={`${(usage.avgLatencyMs / 1000).toFixed(1)}s`}
      />
      <StatCard
        label={t('ai.monitor.errorRate')}
        value={`${(usage.errorRate * 100).toFixed(1)}%`}
      />
    </div>
  );
}
