import { useTranslation, useQuery, GET_SQL_CONNECTION_STATUS } from '@mycircle/shared';
import UsageSummary from './analytics/UsageSummary';
import CostBreakdown from './analytics/CostBreakdown';
import LatencyPercentiles from './analytics/LatencyPercentiles';
import ToolUsagePatterns from './analytics/ToolUsagePatterns';
import BenchmarkTrends from './analytics/BenchmarkTrends';

export default function AnalyticsDashboard() {
  const { t } = useTranslation();
  const { data: connData } = useQuery(GET_SQL_CONNECTION_STATUS);
  const isConnected = connData?.sqlConnectionStatus?.status === 'connected';

  if (!isConnected) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        {t('setup.analytics.noConnection')}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <UsageSummary />
      <CostBreakdown />
      <LatencyPercentiles />
      <ToolUsagePatterns />
      <BenchmarkTrends />
    </div>
  );
}
