import { useTranslation, useQuery, GET_SQL_ANALYTICS_SUMMARY } from '@mycircle/shared';

export default function CostBreakdown() {
  const { t } = useTranslation();
  const { data, loading } = useQuery(GET_SQL_ANALYTICS_SUMMARY, {
    variables: { days: 30 },
    fetchPolicy: 'cache-and-network',
  });

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        {t('app.loading')}
      </div>
    );
  }

  const models = data?.sqlAnalyticsSummary?.modelBreakdown;
  if (!models || models.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        {t('setup.analytics.noData')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
        {t('setup.analytics.cost')}
      </h3>

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
                {t('setup.analytics.estCost')}
              </th>
            </tr>
          </thead>
          <tbody>
            {models.map(
              (row: {
                model: string;
                provider: string;
                calls: number;
                tokens: number;
                estimatedCost: number | null;
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
                    {row.estimatedCost != null ? (
                      `$${row.estimatedCost.toFixed(4)}`
                    ) : (
                      <span
                        className="text-gray-400 dark:text-gray-500"
                        title={t('setup.analytics.noCostData')}
                      >
                        &mdash;
                      </span>
                    )}
                  </td>
                </tr>
              ),
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 dark:border-gray-600">
              <td
                colSpan={2}
                className="py-2 pr-4 text-gray-900 dark:text-white font-semibold"
              >
                Total
              </td>
              <td className="py-2 pr-4 text-gray-900 dark:text-white font-semibold text-right">
                {models
                  .reduce((sum: number, r: { calls: number }) => sum + r.calls, 0)
                  .toLocaleString()}
              </td>
              <td className="py-2 pr-4 text-gray-900 dark:text-white font-semibold text-right">
                {models
                  .reduce((sum: number, r: { tokens: number }) => sum + r.tokens, 0)
                  .toLocaleString()}
              </td>
              <td className="py-2 text-gray-900 dark:text-white font-semibold text-right">
                {models.some((r: { estimatedCost: number | null }) => r.estimatedCost != null)
                  ? `$${models
                      .reduce(
                        (sum: number, r: { estimatedCost: number | null }) =>
                          sum + (r.estimatedCost || 0),
                        0,
                      )
                      .toFixed(4)}`
                  : '\u2014'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
