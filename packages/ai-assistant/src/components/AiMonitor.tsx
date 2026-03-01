import { useTranslation, useQuery, GET_AI_USAGE_SUMMARY, GET_OLLAMA_STATUS, GET_AI_RECENT_LOGS } from '@mycircle/shared';
import MonitorUsageStats from './MonitorUsageStats';
import MonitorCharts from './MonitorCharts';
import MonitorOllamaStatus from './MonitorOllamaStatus';
import MonitorRecentLogs from './MonitorRecentLogs';

export default function AiMonitor() {
  const { t } = useTranslation();

  const { data: usageData, loading: usageLoading } = useQuery(GET_AI_USAGE_SUMMARY, {
    variables: { days: 7 },
    fetchPolicy: 'cache-and-network',
  });

  const { data: statusData } = useQuery(GET_OLLAMA_STATUS, {
    pollInterval: 30000,
  });

  const { data: logsData, loading: logsLoading } = useQuery(GET_AI_RECENT_LOGS, {
    variables: { limit: 20 },
    fetchPolicy: 'cache-and-network',
  });

  const usage = usageData?.aiUsageSummary;
  const status = statusData?.ollamaStatus;
  const logs = logsData?.aiRecentLogs;

  return (
    <div className="flex-1 overflow-y-auto space-y-6 pb-20 md:pb-8">
      <p className="text-xs text-gray-400 dark:text-gray-500">{t('ai.monitor.last7days')}</p>

      <MonitorUsageStats usage={usage} loading={usageLoading} />
      <MonitorCharts dailyBreakdown={usage?.dailyBreakdown} />
      <MonitorOllamaStatus status={status} />
      <MonitorRecentLogs logs={logs} loading={logsLoading} />
    </div>
  );
}
