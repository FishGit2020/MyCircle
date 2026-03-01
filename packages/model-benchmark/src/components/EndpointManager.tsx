import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useEndpoints } from '../hooks/useEndpoints';

export default function EndpointManager() {
  const { t } = useTranslation();
  const { endpoints, loading, saving, saveEndpoint, deleteEndpoint } = useEndpoints();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [cfEnabled, setCfEnabled] = useState(false);
  const [cfClientId, setCfClientId] = useState('');
  const [cfClientSecret, setCfClientSecret] = useState('');

  const handleSave = async () => {
    if (!name.trim() || !url.trim()) return;
    await saveEndpoint({
      name: name.trim(),
      url: url.trim().replace(/\/+$/, ''),
      ...(cfEnabled && cfClientId ? { cfAccessClientId: cfClientId, cfAccessClientSecret: cfClientSecret } : {}),
    });
    setName('');
    setUrl('');
    setCfEnabled(false);
    setCfClientId('');
    setCfClientSecret('');
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('benchmark.endpoints.deleteConfirm'))) return;
    await deleteEndpoint(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('benchmark.endpoints.title')}</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          {t('benchmark.endpoints.add')}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3 border border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('benchmark.endpoints.name')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('benchmark.endpoints.namePlaceholder')}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('benchmark.endpoints.url')}</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={t('benchmark.endpoints.urlPlaceholder')}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={cfEnabled} onChange={e => setCfEnabled(e.target.checked)} className="rounded" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('benchmark.endpoints.cfAccess')}</span>
            </label>
          </div>
          {cfEnabled && (
            <div className="space-y-2 pl-6">
              <input
                type="text"
                value={cfClientId}
                onChange={e => setCfClientId(e.target.value)}
                placeholder={t('benchmark.endpoints.cfClientId')}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="password"
                value={cfClientSecret}
                onChange={e => setCfClientSecret(e.target.value)}
                placeholder={t('benchmark.endpoints.cfClientSecret')}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              {t('benchmark.endpoints.cancel')}
            </button>
            <button type="button" onClick={handleSave} disabled={saving || !name.trim() || !url.trim()} className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition">
              {saving ? '...' : t('benchmark.endpoints.save')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">{t('app.loading')}</div>
      ) : endpoints.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">{t('benchmark.endpoints.none')}</div>
      ) : (
        <div className="space-y-2">
          {endpoints.map(ep => (
            <div key={ep.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <div className="font-medium text-gray-800 dark:text-white text-sm">{ep.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{ep.url}</div>
                {ep.hasCfAccess && (
                  <span className="inline-block mt-1 text-xs px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">CF Access</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(ep.id)}
                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                aria-label={t('benchmark.endpoints.delete')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
