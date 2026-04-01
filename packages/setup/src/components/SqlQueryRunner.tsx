import { useState } from 'react';
import { useTranslation, useMutation, useQuery, SQL_RUN_QUERY, GET_SQL_CONNECTION_STATUS } from '@mycircle/shared';

const SHOW_TABLES_SQL = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`;

export default function SqlQueryRunner() {
  const { t } = useTranslation();
  const { data: statusData } = useQuery(GET_SQL_CONNECTION_STATUS);
  const [runQuery, { loading }] = useMutation(SQL_RUN_QUERY);

  const [sql, setSql] = useState('SELECT * FROM ai_chat_logs ORDER BY created_at DESC LIMIT 10');
  const [result, setResult] = useState<{ columns: string[]; rows: Record<string, unknown>[]; rowCount: number; durationMs: number; error?: string | null } | null>(null);

  const isConnected = statusData?.sqlConnectionStatus?.status === 'connected';

  const handleRun = async () => {
    setResult(null);
    try {
      const res = await runQuery({ variables: { sql: sql.trim(), limit: 200 } });
      setResult(res.data?.sqlRunQuery ?? null);
    } catch (err) {
      setResult({ columns: [], rows: [], rowCount: 0, durationMs: 0, error: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleShowTables = () => {
    setSql(SHOW_TABLES_SQL);
  };

  if (!isConnected) {
    return (
      <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {t('setup.sql.query.notConnected')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {t('setup.sql.query.title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('setup.sql.query.description')}
        </p>
      </div>

      {/* Editor */}
      <div className="space-y-2">
        <textarea
          value={sql}
          onChange={e => setSql(e.target.value)}
          placeholder={t('setup.sql.query.placeholder')}
          rows={6}
          className="w-full font-mono text-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
          spellCheck={false}
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRun}
            disabled={loading || !sql.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition"
          >
            {loading ? t('setup.sql.query.running') : t('setup.sql.query.run')}
          </button>
          <button
            type="button"
            onClick={handleShowTables}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            {t('setup.sql.query.tables')}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-2">
          {result.error ? (
            <div className="px-3 py-2 text-sm rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 font-mono">
              <span className="font-semibold">{t('setup.sql.query.error')}: </span>{result.error}
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t('setup.sql.query.rowCount')
                  .replace('{count}', String(result.rowCount))
                  .replace('{ms}', String(result.durationMs))}
              </div>
              {result.rows.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {t('setup.sql.query.noRows')}
                </div>
              ) : (
                <div className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 max-h-[480px]">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                      <tr>
                        {result.columns.map(col => (
                          <th
                            key={col}
                            className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr
                          key={i}
                          className={i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}
                        >
                          {result.columns.map(col => {
                            const val = (row as Record<string, unknown>)[col];
                            const display = val === null || val === undefined ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val);
                            return (
                              <td
                                key={col}
                                className="px-3 py-1.5 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 max-w-[300px] truncate"
                                title={display}
                              >
                                {display}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
