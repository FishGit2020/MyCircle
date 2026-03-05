import React, { useState } from 'react';
import { useTranslation } from '../i18n';
import { useEndpoints } from '../hooks/useEndpoints';


interface EndpointManagerProps {
  source: 'chat' | 'benchmark';
}

const SOURCE_STYLES: Record<string, string> = {
  chat: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  benchmark: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
};

export default function EndpointManager({ source }: EndpointManagerProps) {
  const { t } = useTranslation();
  const { endpoints, loading, saving, saveEndpoint, deleteEndpoint } = useEndpoints();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [cfEnabled, setCfEnabled] = useState(false);
  const [cfClientId, setCfClientId] = useState('');
  const [cfClientSecret, setCfClientSecret] = useState('');

  const resetForm = () => {
    setName('');
    setUrl('');
    setCfEnabled(false);
    setCfClientId('');
    setCfClientSecret('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (ep: { id: string; name: string; url: string; hasCfAccess?: boolean; source: string }) => {
    setEditingId(ep.id);
    setName(ep.name);
    setUrl(ep.url);
    setCfEnabled(!!ep.hasCfAccess);
    setCfClientId('');
    setCfClientSecret('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !url.trim()) return;
    // If editing, delete old endpoint first
    if (editingId) {
      await deleteEndpoint(editingId);
    }
    await saveEndpoint({
      name: name.trim(),
      url: url.trim().replace(/\/+$/, ''),
      source,
      ...(cfEnabled && cfClientId ? { cfAccessClientId: cfClientId, cfAccessClientSecret: cfClientSecret } : {}),
    });
    window.__logAnalyticsEvent?.('endpoint_saved', { source, has_cf_access: cfEnabled, edited: !!editingId });
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('benchmark.endpoints.deleteConfirm'))) return;
    await deleteEndpoint(id);
    window.__logAnalyticsEvent?.('endpoint_deleted', { source });
  };

  const sourceLabel = (s: string) =>
    s === 'chat' ? t('endpoints.sourceChat') : t('endpoints.sourceBenchmark');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('benchmark.endpoints.title')}</h3>
        <button
          type="button"
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          {t('benchmark.endpoints.add')}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {editingId ? t('benchmark.endpoints.edit') : t('benchmark.endpoints.add')}
          </div>
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
            <button type="button" onClick={resetForm} className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
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
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 dark:text-white text-sm">{ep.name}</span>
                  <span className={`inline-block text-xs px-1.5 py-0.5 rounded ${SOURCE_STYLES[ep.source] || SOURCE_STYLES.benchmark}`}>
                    {sourceLabel(ep.source)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{ep.url}</div>
                {ep.hasCfAccess && (
                  <span className="inline-block mt-1 text-xs px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">CF Access</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleEdit(ep)}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                  aria-label={t('benchmark.endpoints.edit')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
