import { useTranslation } from '@mycircle/shared';
import type { SetlistListItem } from '../types';

interface SetlistListProps {
  setlists: SetlistListItem[];
  loading: boolean;
  isAuthenticated: boolean;
  onSelectSetlist: (id: string) => void;
  onNewSetlist: () => void;
}

export default function SetlistList({ setlists, loading, isAuthenticated, onSelectSetlist, onNewSetlist }: SetlistListProps) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('worship.setlists')}</h2>
        {isAuthenticated && (
          <button
            type="button"
            onClick={onNewSetlist}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition min-h-[44px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {t('worship.newSetlist')}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-12" role="status" aria-label="Loading">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && setlists.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">{t('worship.noSetlists')}</p>
        </div>
      )}

      {!loading && setlists.length > 0 && (
        <ul className="space-y-3" role="list">
          {setlists.map(setlist => (
            <li key={setlist.id}>
              <button
                type="button"
                onClick={() => onSelectSetlist(setlist.id)}
                className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition min-h-[44px] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{setlist.name}</p>
                  {setlist.serviceDate && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{setlist.serviceDate}</p>
                  )}
                </div>
                <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                  {setlist.entries.length} {setlist.entries.length === 1 ? 'song' : 'songs'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
