import { useTranslation, useQuery, GET_SQL_ANALYTICS_SUMMARY } from '@mycircle/shared';

export default function UsageSummary() {
  const { t } = useTranslation();
  const { data, loading } = useQuery(GET_SQL_ANALYTICS_SUMMARY, {
    variables: { days: 30 },
  });

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        {t('app.loading')}
      </div>
    );
  }

  const summary = data?.sqlAnalyticsSummary;
  if (!summary) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        {t('setup.analytics.noData')}
      </div>
    );
  }

  const totalTokens = (summary.totalInputTokens || 0) + (summary.totalOutputTokens || 0);
  const avgLatency =
    summary.providerBreakdown && summary.providerBreakdown.length > 0
      ? Math.round(
          summary.providerBreakdown.reduce(
            (sum: number, p: { avgLatencyMs: number; calls: number }) =>
              sum + p.avgLatencyMs * p.calls,
            0,
          ) / summary.providerBreakdown.reduce((sum: number, p: { calls: number }) => sum + p.calls, 0),
        )
      : 0;
  const errorRate =
    summary.providerBreakdown && summary.providerBreakdown.length > 0
      ? (
          summary.providerBreakdown.reduce(
            (sum: number, p: { errorRate: number; calls: number }) =>
              sum + p.errorRate * p.calls,
            0,
          ) /
          summary.providerBreakdown.reduce((sum: number, p: { calls: number }) => sum + p.calls, 0) *
          100
        ).toFixed(1)
      : '0.0';

  const maxDailyCalls = Math.max(
    ...(summary.dailyBreakdown || []).map((d: { calls: number }) => d.calls),
    1,
  );

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
        {t('setup.analytics.usage')}
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('setup.analytics.totalCalls')}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {(summary.totalCalls || 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('setup.analytics.totalTokens')}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {totalTokens.toLocaleString()}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('setup.analytics.avgLatency')}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {avgLatency} {t('setup.analytics.ms')}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('setup.analytics.errorRate')}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {errorRate}%
          </div>
        </div>
      </div>

      {/* Provider Breakdown Table */}
      {summary.providerBreakdown && summary.providerBreakdown.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('setup.analytics.byProvider')}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">
                    {t('setup.analytics.provider')}
                  </th>
                  <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium text-right">
                    {t('setup.analytics.calls')}
                  </th>
                  <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium text-right">
                    {t('setup.analytics.tokens')}
                  </th>
                  <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium text-right">
                    {t('setup.analytics.avgLatency')}
                  </th>
                  <th className="py-2 text-gray-500 dark:text-gray-400 font-medium text-right">
                    {t('setup.analytics.errorRate')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.providerBreakdown.map(
                  (row: {
                    provider: string;
                    calls: number;
                    tokens: number;
                    avgLatencyMs: number;
                    errorRate: number;
                  }) => (
                    <tr
                      key={row.provider}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium">
                        {row.provider}
                      </td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 text-right">
                        {row.calls.toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 text-right">
                        {row.tokens.toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 text-right">
                        {Math.round(row.avgLatencyMs)} {t('setup.analytics.ms')}
                      </td>
                      <td className="py-2 text-gray-700 dark:text-gray-300 text-right">
                        {(row.errorRate * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Model Breakdown Table */}
      {summary.modelBreakdown && summary.modelBreakdown.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('setup.analytics.byModel')}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">
                    {t('setup.analytics.model')}
                  </th>
                  <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">
                    {t('setup.analytics.provider')}
                  </th>
                  <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium text-right">
                    {t('setup.analytics.calls')}
                  </th>
                  <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium text-right">
                    {t('setup.analytics.tokens')}
                  </th>
                  <th className="py-2 text-gray-500 dark:text-gray-400 font-medium text-right">
                    {t('setup.analytics.avgLatency')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.modelBreakdown.map(
                  (row: {
                    model: string;
                    provider: string;
                    calls: number;
                    tokens: number;
                    avgLatencyMs: number;
                  }) => (
                    <tr
                      key={`${row.provider}-${row.model}`}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium">
                        {row.model}
                      </td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{row.provider}</td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 text-right">
                        {row.calls.toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 text-right">
                        {row.tokens.toLocaleString()}
                      </td>
                      <td className="py-2 text-gray-700 dark:text-gray-300 text-right">
                        {Math.round(row.avgLatencyMs)} {t('setup.analytics.ms')}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Activity Bar Chart (CSS-only) */}
      {summary.dailyBreakdown && summary.dailyBreakdown.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('setup.analytics.daily')}
          </h4>
          <div className="flex items-end gap-1 h-32 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 overflow-x-auto">
            {summary.dailyBreakdown.map(
              (day: { date: string; calls: number; errors: number }) => {
                const height = Math.max((day.calls / maxDailyCalls) * 100, 2);
                const hasErrors = day.errors > 0;
                return (
                  <div
                    key={day.date}
                    className="flex flex-col items-center flex-shrink-0 group relative"
                    style={{ minWidth: '12px' }}
                  >
                    <div
                      className={`w-3 rounded-t transition-colors ${
                        hasErrors
                          ? 'bg-red-400 dark:bg-red-500'
                          : 'bg-blue-400 dark:bg-blue-500'
                      } group-hover:bg-blue-600 dark:group-hover:bg-blue-400`}
                      style={{ height: `${height}%` }}
                      title={`${day.date}: ${day.calls} ${t('setup.analytics.calls').toLowerCase()}${
                        hasErrors ? `, ${day.errors} ${t('setup.analytics.errors').toLowerCase()}` : ''
                      }`}
                    />
                  </div>
                );
              },
            )}
          </div>
          <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1 px-3">
            <span>
              {summary.dailyBreakdown[0]?.date
                ? new Date(summary.dailyBreakdown[0].date).toLocaleDateString()
                : ''}
            </span>
            <span>
              {summary.dailyBreakdown[summary.dailyBreakdown.length - 1]?.date
                ? new Date(
                    summary.dailyBreakdown[summary.dailyBreakdown.length - 1].date,
                  ).toLocaleDateString()
                : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
