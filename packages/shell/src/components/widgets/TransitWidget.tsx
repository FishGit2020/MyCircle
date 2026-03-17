import React, { useEffect } from 'react';
import { useTranslation, StorageKeys, WindowEvents } from '@mycircle/shared';
import { useNavigate } from 'react-router';

interface FavoriteStop {
  stopId: string;
  stopName: string;
  direction: string;
}

const TransitWidget = React.memo(function TransitWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [favorites, setFavorites] = React.useState<FavoriteStop[]>([]);

  useEffect(() => {
    function load() {
      try {
        const stored = localStorage.getItem(StorageKeys.TRANSIT_FAVORITES);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setFavorites(parsed);
        } else {
          setFavorites([]);
        }
      } catch { /* ignore */ }
    }
    load();

    // Listen for changes
    window.addEventListener(WindowEvents.TRANSIT_FAVORITES_CHANGED, load);
    return () => window.removeEventListener(WindowEvents.TRANSIT_FAVORITES_CHANGED, load);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.transit')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.transitDesc')}</p>
        </div>
      </div>
      {favorites.length > 0 ? (
        <div>
          <p className="text-sm text-teal-600 dark:text-teal-400 font-medium mb-2">
            {t('widgets.transitFavoriteCount' as any).replace('{count}', String(favorites.length))} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </p>
          <ul className="space-y-1">
            {favorites.slice(0, 3).map((fav) => (
              <li key={fav.stopId}>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/transit/${encodeURIComponent(fav.stopId)}`); }}
                  className="w-full rounded px-2 py-1 text-left text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{fav.stopName}</span>
                  {fav.direction && (
                    <span className="ml-1 text-gray-500 dark:text-gray-400">{fav.direction}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.transitNoFavorites' as any)}</p> // eslint-disable-line @typescript-eslint/no-explicit-any
      )}
    </div>
  );
});

export default TransitWidget;
