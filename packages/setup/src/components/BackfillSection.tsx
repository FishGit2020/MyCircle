import { useEffect } from 'react';
import {
  useTranslation,
  useQuery,
  useMutation,
  GET_SQL_BACKFILL_STATUS,
  START_SQL_BACKFILL,
  GET_SQL_CONNECTION_STATUS,
} from '@mycircle/shared';

export default function BackfillSection() {
  const { t } = useTranslation();

  const { data: connData } = useQuery(GET_SQL_CONNECTION_STATUS);
  const isConnected = connData?.sqlConnectionStatus?.status === 'connected';

  const { data, loading, startPolling, stopPolling } = useQuery(GET_SQL_BACKFILL_STATUS, {
    pollInterval: 0,
  });

  const [startBackfill, { loading: starting }] = useMutation(START_SQL_BACKFILL, {
    refetchQueries: [{ query: GET_SQL_BACKFILL_STATUS }],
  });

  const status = data?.sqlBackfillStatus;
  const isRunning = status?.status === 'running';
  const isCompleted = status?.status === 'completed';
  const isError = status?.status === 'error';
  // Poll every 3s while running
  useEffect(() => {
    if (isRunning) {
      startPolling(3000);
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [isRunning, startPolling, stopPolling]);

  const handleStart = async () => {
    try {
      await startBackfill();
    } catch {
      // Error handled by Apollo
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        {t('app.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {t('setup.backfill.title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('setup.backfill.description')}
        </p>
      </div>

      {/* Not connected warning */}
      {!isConnected && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {t('setup.backfill.noConnection')}
        </p>
      )}

      {/* Running state */}
      {isRunning && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {t('setup.backfill.importing')}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: status.totalMigrated > 0 ? '50%' : '10%' }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('setup.backfill.progress').replace('{count}', String(status.totalMigrated || 0))}
          </p>
          {status.totalErrors > 0 && (
            <p className="text-xs text-red-500 dark:text-red-400">
              {status.totalErrors} {t('setup.backfill.errors')}
            </p>
          )}
        </div>
      )}

      {/* Completed state */}
      {isCompleted && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {t('setup.backfill.completed')}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {status.totalMigrated} {t('setup.backfill.records')}
          </p>
          {status.totalErrors > 0 && (
            <p className="text-xs text-red-500 dark:text-red-400">
              {status.totalErrors} {t('setup.backfill.errors')}
            </p>
          )}
          {status.completedAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t('setup.backfill.lastImport')}: {new Date(status.completedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="space-y-1">
          <p className="text-sm text-red-600 dark:text-red-400">
            {status.error}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {status.totalMigrated} {t('setup.backfill.records')}
            {status.totalErrors > 0 && ` / ${status.totalErrors} ${t('setup.backfill.errors')}`}
          </p>
        </div>
      )}

      {/* Action buttons */}
      {isConnected && !isRunning && (
        <div>
          <button
            type="button"
            onClick={handleStart}
            disabled={starting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition"
          >
            {starting
              ? t('setup.backfill.importing')
              : isError
                ? t('setup.backfill.resume')
                : isCompleted
                  ? t('setup.backfill.importButton')
                  : t('setup.backfill.importButton')}
          </button>
        </div>
      )}
    </div>
  );
}
