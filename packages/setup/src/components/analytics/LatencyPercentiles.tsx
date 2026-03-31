import { useTranslation, useQuery, GET_SQL_LATENCY_PERCENTILES } from '@mycircle/shared';

export default function LatencyPercentiles() {
  const { t } = useTranslation();
  const { data, loading } = useQuery(GET_SQL_LATENCY_PERCENTILES, {
    variables: { days: 30 },
  });

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        {t('app.loading')}
      </div>
    );
  }

  const percentiles = data?.sqlLatencyPercentiles;
  if (!percentiles || percentiles.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        {t('setup.analytics.noData')}
      </div>
    );
  }

  const formatMs = (value: number | null | undefined): string => {
    if (value == null) return '\u2014';
    if (value < 10) return `${value.toFixed(1)} ${t('setup.analytics.ms')}`;
    return `${Math.round(value)} ${t('setup.analytics.ms')}`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
        {t('setup.analytics.latency')}
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">
                {t('setup.analytics.provider')}
              </th>
              <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium">
                {t('setup.analytics.model')}
              </th>
              <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium text-right">
                {t('setup.analytics.p50')}
              </th>
              <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium text-right">
                {t('setup.analytics.p90')}
              </th>
              <th className="py-2 pr-4 text-gray-500 dark:text-gray-400 font-medium text-right">
                {t('setup.analytics.p99')}
              </th>
              <th className="py-2 text-gray-500 dark:text-gray-400 font-medium text-right">
                {t('setup.analytics.sampleSize')}
              </th>
            </tr>
          </thead>
          <tbody>
            {percentiles.map(
              (row: {
                provider: string;
                model: string;
                p50: number | null;
                p90: number | null;
                p99: number | null;
                sampleSize: number;
              }) => (
                <tr
                  key={`${row.provider}-${row.model}`}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-2 pr-4 text-gray-900 dark:text-white font-medium">
                    {row.provider}
                  </td>
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{row.model}</td>
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 text-right">
                    {formatMs(row.p50)}
                  </td>
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 text-right">
                    {formatMs(row.p90)}
                  </td>
                  <td className="py-2 pr-4 text-gray-700 dark:text-gray-300 text-right">
                    {formatMs(row.p99)}
                  </td>
                  <td className="py-2 text-gray-700 dark:text-gray-300 text-right">
                    {row.sampleSize.toLocaleString()}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
