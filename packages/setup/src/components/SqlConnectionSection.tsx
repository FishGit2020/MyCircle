import { useState, useEffect } from 'react';
import {
  useTranslation,
  useQuery,
  useMutation,
  GET_SQL_CONNECTION_STATUS,
  SAVE_SQL_CONNECTION,
  DELETE_SQL_CONNECTION,
  TEST_SQL_CONNECTION,
} from '@mycircle/shared';

export default function SqlConnectionSection() {
  const { t } = useTranslation();

  const { data, loading } = useQuery(GET_SQL_CONNECTION_STATUS);
  const [saveSqlConnection, { loading: saving }] = useMutation(SAVE_SQL_CONNECTION, {
    refetchQueries: [{ query: GET_SQL_CONNECTION_STATUS }],
  });
  const [testSqlConnection, { loading: testing }] = useMutation(TEST_SQL_CONNECTION, {
    refetchQueries: [{ query: GET_SQL_CONNECTION_STATUS }],
  });
  const [deleteSqlConnection, { loading: deleting }] = useMutation(DELETE_SQL_CONNECTION, {
    refetchQueries: [{ query: GET_SQL_CONNECTION_STATUS }],
  });

  const [tunnelUrl, setTunnelUrl] = useState('');
  const [dbName, setDbName] = useState('mycircle');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [saveResult, setSaveResult] = useState<'saved' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const status = data?.sqlConnectionStatus;

  useEffect(() => {
    if (status) {
      setTunnelUrl(status.tunnelUrl || '');
      setDbName(status.dbName || 'mycircle');
    }
  }, [status]);

  const handleSaveAndTest = async () => {
    setSaveResult(null);
    setErrorMessage('');
    try {
      const result = await saveSqlConnection({
        variables: {
          input: {
            tunnelUrl: tunnelUrl.trim(),
            dbName: dbName.trim() || 'mycircle',
            username: username.trim() || undefined,
            password: password || undefined,
          },
        },
      });
      const connStatus = result.data?.saveSqlConnection?.status;
      setSaveResult(connStatus === 'connected' ? 'saved' : 'error');
      if (connStatus !== 'connected') {
        setErrorMessage(t('setup.sql.status.error'));
      }
      setPassword('');
    } catch (err: any) {
      setSaveResult('error');
      setErrorMessage(err.message || String(err));
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('setup.sql.deleteConfirm'))) return;
    await deleteSqlConnection();
    setTunnelUrl('');
    setDbName('mycircle');
    setUsername('');
    setPassword('');
  };

  const statusColor =
    status?.status === 'connected'
      ? 'bg-green-500'
      : status?.status === 'error'
        ? 'bg-red-500'
        : 'bg-gray-400';

  const statusLabel =
    status?.status === 'connected'
      ? t('setup.sql.status.connected')
      : status?.status === 'error'
        ? t('setup.sql.status.error')
        : t('setup.sql.status.disconnected');

  if (loading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
        {t('app.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          {t('setup.sql.title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('setup.sql.description')}
        </p>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {status ? statusLabel : t('setup.sql.status.none')}
        </span>
        {status?.lastTestedAt && (
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
            {t('setup.sql.lastTested')}: {new Date(status.lastTestedAt).toLocaleString()}
          </span>
        )}
      </div>

      {/* Save feedback */}
      {saveResult === 'saved' && (
        <div className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {t('setup.sql.status.connected')} — {t('setup.sql.savedSuccess')}
        </div>
      )}
      {saveResult === 'error' && (
        <div className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          {t('setup.sql.savedWithError')}{errorMessage ? `: ${errorMessage}` : ''}
        </div>
      )}

      {/* Form */}
      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('setup.sql.tunnelUrl')}
          </label>
          <input
            type="text"
            value={tunnelUrl}
            onChange={e => setTunnelUrl(e.target.value)}
            placeholder={t('setup.sql.tunnelUrlPlaceholder')}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('setup.sql.dbName')}
          </label>
          <input
            type="text"
            value={dbName}
            onChange={e => setDbName(e.target.value)}
            placeholder={t('setup.sql.dbNamePlaceholder')}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('setup.sql.username')}
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder={t('setup.sql.usernamePlaceholder')}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('setup.sql.password')}
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('setup.sql.passwordPlaceholder')}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSaveAndTest}
          disabled={saving || testing || !tunnelUrl.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition"
        >
          {saving || testing ? t('setup.sql.testing') : t('setup.sql.saveAndTest')}
        </button>

        {status?.hasCredentials && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
          >
            {t('setup.sql.delete')}
          </button>
        )}
      </div>
    </div>
  );
}
