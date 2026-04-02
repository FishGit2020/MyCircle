import { useState, useEffect } from 'react';
import {
  useTranslation,
  useQuery,
  useMutation,
  GET_NAS_CONNECTION_STATUS,
  SAVE_NAS_CONNECTION,
  TEST_NAS_CONNECTION,
  DELETE_NAS_CONNECTION,
} from '@mycircle/shared';

export default function NasConnectionSection() {
  const { t } = useTranslation();

  const { data, loading } = useQuery(GET_NAS_CONNECTION_STATUS);
  const [saveNasConnection, { loading: saving }] = useMutation(SAVE_NAS_CONNECTION, {
    refetchQueries: [{ query: GET_NAS_CONNECTION_STATUS }],
  });
  const [testNasConnectionMutation, { loading: testing }] = useMutation(TEST_NAS_CONNECTION, {
    refetchQueries: [{ query: GET_NAS_CONNECTION_STATUS }],
  });
  const [deleteNasConnection, { loading: deleting }] = useMutation(DELETE_NAS_CONNECTION, {
    refetchQueries: [{ query: GET_NAS_CONNECTION_STATUS }],
  });

  const [nasUrl, setNasUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [destFolder, setDestFolder] = useState('/MyCircle');
  const [saveResult, setSaveResult] = useState<'saved' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const status = data?.nasConnectionStatus;

  useEffect(() => {
    if (status) {
      setNasUrl(status.nasUrl || '');
      setDestFolder(status.destFolder || '/MyCircle');
    }
  }, [status]);

  const handleSaveAndTest = async () => {
    setSaveResult(null);
    setErrorMessage('');
    try {
      const result = await saveNasConnection({
        variables: {
          input: {
            nasUrl: nasUrl.trim(),
            username: username.trim(),
            password: password || undefined,
            destFolder: destFolder.trim() || '/MyCircle',
          },
        },
      });
      const connStatus = result.data?.saveNasConnection?.status;
      setSaveResult(connStatus === 'connected' ? 'saved' : 'error');
      if (connStatus !== 'connected') {
        setErrorMessage(t('setup.nas.status.error'));
      }
      setPassword('');
    } catch (err: unknown) {
      setSaveResult('error');
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRetest = async () => {
    setSaveResult(null);
    setErrorMessage('');
    try {
      const result = await testNasConnectionMutation();
      const connStatus = result.data?.testNasConnection?.status;
      setSaveResult(connStatus === 'connected' ? 'saved' : 'error');
      if (connStatus !== 'connected') {
        setErrorMessage(t('setup.nas.status.error'));
      }
    } catch (err: unknown) {
      setSaveResult('error');
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('setup.nas.deleteConfirm'))) return;
    await deleteNasConnection();
    setNasUrl('');
    setUsername('');
    setPassword('');
    setDestFolder('/MyCircle');
    setSaveResult(null);
  };

  const statusColor =
    status?.status === 'connected'
      ? 'bg-green-500'
      : status?.status === 'error'
        ? 'bg-red-500'
        : 'bg-gray-400';

  const statusLabel =
    status?.status === 'connected'
      ? t('setup.nas.status.connected')
      : status?.status === 'error'
        ? t('setup.nas.status.error')
        : t('setup.nas.status.disconnected');

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
          {t('setup.nas.title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('setup.nas.description')}
        </p>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {status ? statusLabel : t('setup.nas.status.none')}
        </span>
        {status?.lastTestedAt && (
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
            {t('setup.nas.lastTested')}: {new Date(status.lastTestedAt).toLocaleString()}
          </span>
        )}
      </div>

      {/* Save feedback */}
      {saveResult === 'saved' && (
        <div className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {t('setup.nas.status.connected')} — {t('setup.nas.savedSuccess')}
        </div>
      )}
      {saveResult === 'error' && (
        <div className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          {t('setup.nas.savedWithError')}{errorMessage ? `: ${errorMessage}` : ''}
        </div>
      )}

      {/* Form */}
      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('setup.nas.nasUrl')}
          </label>
          <input
            type="text"
            value={nasUrl}
            onChange={e => setNasUrl(e.target.value)}
            placeholder={t('setup.nas.nasUrlPlaceholder')}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('setup.nas.username')}
          </label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder={t('setup.nas.usernamePlaceholder')}
            autoComplete="username"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('setup.nas.password')}
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={t('setup.nas.passwordPlaceholder')}
            autoComplete="current-password"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('setup.nas.destFolder')}
          </label>
          <input
            type="text"
            value={destFolder}
            onChange={e => setDestFolder(e.target.value)}
            placeholder={t('setup.nas.destFolderPlaceholder')}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={handleSaveAndTest}
          disabled={saving || testing || !nasUrl.trim() || !username.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition min-h-[44px]"
        >
          {saving || testing ? t('setup.nas.testing') : t('setup.nas.saveAndTest')}
        </button>

        {status && (
          <button
            type="button"
            onClick={handleRetest}
            disabled={saving || testing}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 rounded-lg transition min-h-[44px]"
          >
            {testing ? t('setup.nas.testing') : t('setup.nas.retest')}
          </button>
        )}

        {status && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 rounded-lg transition min-h-[44px]"
          >
            {t('setup.nas.delete')}
          </button>
        )}
      </div>
    </div>
  );
}
