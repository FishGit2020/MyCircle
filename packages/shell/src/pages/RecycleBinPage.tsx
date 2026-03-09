import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation, WindowEvents } from '@mycircle/shared';

interface TrashItem {
  id: string;
  type: string;
  name: string;
  deletedAt: number | null;
  collectionPath: string;
}

type TrashType = 'note' | 'flashcard' | 'file' | 'trip' | 'route' | 'child' | 'book';

const TYPE_ORDER: TrashType[] = ['note', 'flashcard', 'file', 'book', 'trip', 'route', 'child'];

function TypeBadge({ type, t }: { type: string; t: (key: string) => string }) {
  const colors: Record<string, string> = {
    note: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    flashcard: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    file: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    trip: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    route: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
    child: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
    book: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
      {t(`recycleBin.type.${type}` as any)}
    </span>
  );
}

function formatDate(ts: number | null): string {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RecycleBinPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState<Record<TrashType, TrashItem[]>>({
    note: [], flashcard: [], file: [], book: [], trip: [], route: [], child: [],
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const trash = window.__trash;
      if (!trash) {
        setLoading(false);
        return;
      }
      const result = await trash.getAll();
      setItems(result as Record<TrashType, TrashItem[]>);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
    const handler = () => loadItems();
    window.addEventListener(WindowEvents.TRASH_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.TRASH_CHANGED, handler);
  }, [loadItems]);

  const handleRestore = async (type: string, id: string) => {
    const key = `restore-${type}-${id}`;
    setActionLoading(key);
    try {
      await window.__trash?.restore(type, id);
      await loadItems();
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async (type: string, id: string) => {
    if (!window.confirm(t('recycleBin.deleteForeverConfirm'))) return;
    const key = `delete-${type}-${id}`;
    setActionLoading(key);
    try {
      await window.__trash?.permanentlyDelete(type, id);
      await loadItems();
    } finally {
      setActionLoading(null);
    }
  };

  const totalItems = TYPE_ORDER.reduce((sum, type) => sum + items[type].length, 0);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('recycleBin.title')}</h1>
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-2">
        <svg className="w-7 h-7 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('recycleBin.title')}</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('recycleBin.autoDelete')}</p>

      {totalItems === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-lg">{t('recycleBin.empty')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {TYPE_ORDER.map((type) => {
            const typeItems = items[type];
            if (typeItems.length === 0) return null;
            return (
              <div key={type}>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <TypeBadge type={type} t={t} />
                  <span>({typeItems.length})</span>
                </h2>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {typeItems.map((item) => {
                    const restoreKey = `restore-${item.type}-${item.id}`;
                    const deleteKey = `delete-${item.type}-${item.id}`;
                    return (
                      <li key={item.id} className="px-4 py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {item.name}
                          </p>
                          {item.deletedAt && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {t('recycleBin.deletedOn')} {formatDate(item.deletedAt)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRestore(item.type, item.id)}
                            disabled={actionLoading === restoreKey}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md transition-colors disabled:opacity-50"
                            aria-label={`${t('recycleBin.restore')} ${item.name}`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            </svg>
                            {t('recycleBin.restore')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermanentDelete(item.type, item.id)}
                            disabled={actionLoading === deleteKey}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-md transition-colors disabled:opacity-50"
                            aria-label={`${t('recycleBin.deleteForever')} ${item.name}`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {t('recycleBin.deleteForever')}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
