import { useState } from 'react';
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey(k => k + 1);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        {t('setup.analytics.noConnection')}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {t('setup.analytics.title')}
        </h2>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 19.644V14.652" />
          </svg>
          {refreshing ? t('weather.refreshing') : t('weather.refresh')}
        </button>
      </div>
      <div key={refreshKey}>
        <div className="space-y-8">
          <UsageSummary />
          <CostBreakdown />
          <LatencyPercentiles />
          <ToolUsagePatterns />
          <BenchmarkTrends />
        </div>
      </div>
    </div>
  );
}
