import { useTranslation } from '@mycircle/shared';

interface DailyStats {
  date: string;
  calls: number;
  avgLatencyMs: number;
  tokens: number;
  errors: number;
}

interface Props {
  dailyBreakdown?: DailyStats[];
}

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en', { weekday: 'short' });
}

function latencyColor(ms: number): string {
  if (ms < 2000) return 'bg-green-400 dark:bg-green-500';
  if (ms < 5000) return 'bg-yellow-400 dark:bg-yellow-500';
  return 'bg-red-400 dark:bg-red-500';
}

export default function MonitorCharts({ dailyBreakdown }: Props) {
  const { t } = useTranslation();

  if (!dailyBreakdown || dailyBreakdown.length === 0) {
    return (
      <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
        {t('ai.monitor.noChartData')}
      </div>
    );
  }

  const maxCalls = Math.max(...dailyBreakdown.map(d => d.calls), 1);
  const maxLatency = Math.max(...dailyBreakdown.map(d => d.avgLatencyMs), 1);
  const avgLatency = dailyBreakdown.reduce((s, d) => s + d.avgLatencyMs, 0) / dailyBreakdown.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Calls per day bar chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">{t('ai.monitor.callsPerDay')}</p>
        <div className="flex items-end gap-1 h-32">
          {dailyBreakdown.map(day => {
            const pct = (day.calls / maxCalls) * 100;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-blue-400 dark:bg-blue-500 rounded-t transition-all min-h-[2px]"
                  style={{ height: `${pct}%` }}
                  title={`${day.date}: ${day.calls} calls`}
                />
                <span className="text-[10px] text-gray-400 dark:text-gray-500">{getDayLabel(day.date)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Latency trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">{t('ai.monitor.latencyTrend')}</p>
        <div className="relative h-32 flex items-end gap-1">
          {/* Average line */}
          <div
            className="absolute left-0 right-0 border-t border-dashed border-gray-300 dark:border-gray-600"
            style={{ bottom: `${(avgLatency / maxLatency) * 100}%` }}
          />
          {dailyBreakdown.map(day => {
            const pct = (day.avgLatencyMs / maxLatency) * 100;
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <div className="flex flex-col items-center justify-end flex-1 w-full">
                  <div
                    className={`w-3 h-3 rounded-full ${latencyColor(day.avgLatencyMs)} flex-shrink-0`}
                    style={{ marginBottom: `${pct}%` }}
                    title={`${day.date}: ${(day.avgLatencyMs / 1000).toFixed(1)}s`}
                  />
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500">{getDayLabel(day.date)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
