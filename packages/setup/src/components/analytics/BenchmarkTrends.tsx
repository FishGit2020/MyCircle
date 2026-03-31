import { useTranslation, useQuery, GET_SQL_BENCHMARK_TRENDS } from '@mycircle/shared';

interface TrendRow {
  endpointName: string;
  model: string;
  week: string;
  avgTps: number | null;
  avgTtft: number | null;
  sampleSize: number;
}

interface GroupedTrends {
  [key: string]: TrendRow[];
}

export default function BenchmarkTrends() {
  const { t } = useTranslation();
  const { data, loading } = useQuery(GET_SQL_BENCHMARK_TRENDS, {
    variables: { weeks: 8 },
    fetchPolicy: 'cache-and-network',
  });

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        {t('app.loading')}
      </div>
    );
  }

  const trends: TrendRow[] = data?.sqlBenchmarkTrends;
  if (!trends || trends.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        {t('setup.analytics.noData')}
      </div>
    );
  }

  // Group by endpoint+model
  const grouped: GroupedTrends = {};
  for (const row of trends) {
    const key = `${row.endpointName}|||${row.model}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
        {t('setup.analytics.benchmarks')}
      </h3>

      {Object.entries(grouped).map(([key, rows]) => {
        const [endpointName, model] = key.split('|||');
        // Sort rows by week ascending
        const sorted = [...rows].sort((a, b) => a.week.localeCompare(b.week));

        return (
          <div key={key} className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {endpointName}{' '}
              <span className="text-gray-400 dark:text-gray-500 font-normal">/ {model}</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">
                      {t('setup.analytics.week')}
                    </th>
                    <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium text-right">
                      {t('setup.analytics.tps')}
                    </th>
                    <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium text-right">
                      {t('setup.analytics.ttft')}
                    </th>
                    <th className="py-2 text-gray-500 dark:text-gray-400 font-medium text-right">
                      {t('setup.analytics.sampleSize')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row) => (
                    <tr
                      key={row.week}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">
                        {row.week}
                      </td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 text-right">
                        {row.avgTps != null ? row.avgTps.toFixed(1) : '\u2014'}
                      </td>
                      <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 text-right">
                        {row.avgTtft != null
                          ? `${Math.round(row.avgTtft)} ${t('setup.analytics.ms')}`
                          : '\u2014'}
                      </td>
                      <td className="py-2 text-gray-700 dark:text-gray-300 text-right">
                        {row.sampleSize}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
