import {
  useTranslation,
  useQuery,
  GET_SQL_TOOL_USAGE_STATS,
  GET_SQL_TOOL_CO_OCCURRENCES,
} from '@mycircle/shared';

export default function ToolUsagePatterns() {
  const { t } = useTranslation();
  const { data: statsData, loading: statsLoading } = useQuery(GET_SQL_TOOL_USAGE_STATS, {
    variables: { days: 30 },
    fetchPolicy: 'cache-and-network',
  });
  const { data: coData, loading: coLoading } = useQuery(GET_SQL_TOOL_CO_OCCURRENCES, {
    variables: { days: 30, minCount: 2 },
    fetchPolicy: 'cache-and-network',
  });

  const loading = statsLoading || coLoading;

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        {t('app.loading')}
      </div>
    );
  }

  const tools = statsData?.sqlToolUsageStats;
  const coOccurrences = coData?.sqlToolCoOccurrences;

  if ((!tools || tools.length === 0) && (!coOccurrences || coOccurrences.length === 0)) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        {t('setup.analytics.noData')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
        {t('setup.analytics.tools')}
      </h3>

      {/* Ranked tool list */}
      {tools && tools.length > 0 && (
        <div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium w-8">
                    #
                  </th>
                  <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">
                    {t('setup.analytics.toolName')}
                  </th>
                  <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium text-right">
                    {t('setup.analytics.callCount')}
                  </th>
                  <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium text-right">
                    {t('setup.analytics.avgDuration')}
                  </th>
                  <th className="py-2 text-gray-500 dark:text-gray-400 font-medium text-right">
                    {t('setup.analytics.errorRate')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tools.map(
                  (
                    row: {
                      toolName: string;
                      callCount: number;
                      avgDurationMs: number | null;
                      errorRate: number;
                    },
                    index: number,
                  ) => (
                    <tr
                      key={row.toolName}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-2 pr-4 text-gray-400 dark:text-gray-500 text-xs">
                        {index + 1}
                      </td>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium font-mono text-xs">
                        {row.toolName}
                      </td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 text-right">
                        {row.callCount.toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 text-right">
                        {row.avgDurationMs != null
                          ? `${Math.round(row.avgDurationMs)} ${t('setup.analytics.ms')}`
                          : '\u2014'}
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

      {/* Co-occurrence pairs */}
      {coOccurrences && coOccurrences.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('setup.analytics.coOccurrences')}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">
                    {t('setup.analytics.pairA')}
                  </th>
                  <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">
                    {t('setup.analytics.pairB')}
                  </th>
                  <th className="py-2 text-gray-500 dark:text-gray-400 font-medium text-right">
                    {t('setup.analytics.count')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {coOccurrences.map(
                  (row: { toolA: string; toolB: string; coOccurrences: number }) => (
                    <tr
                      key={`${row.toolA}-${row.toolB}`}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-2 pr-4 text-gray-900 dark:text-white font-mono text-xs">
                        {row.toolA}
                      </td>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white font-mono text-xs">
                        {row.toolB}
                      </td>
                      <td className="py-2 text-gray-700 dark:text-gray-300 text-right">
                        {row.coOccurrences.toLocaleString()}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
