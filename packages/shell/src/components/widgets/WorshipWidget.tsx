import React, { useEffect, useState } from 'react';
import { useTranslation, StorageKeys, WindowEvents, useQuery, GET_WORSHIP_SONGS } from '@mycircle/shared';

const WorshipWidget = React.memo(function WorshipWidget() {
  const { t } = useTranslation();
  const [favCount, setFavCount] = useState(0);

  const { data } = useQuery(GET_WORSHIP_SONGS, {
    fetchPolicy: 'cache-and-network',
  });
  const songCount = data?.worshipSongs?.length ?? 0;

  useEffect(() => {
    function loadFavs() {
      try {
        const rawFav = localStorage.getItem(StorageKeys.WORSHIP_FAVORITES);
        if (rawFav) {
          const favs = JSON.parse(rawFav);
          setFavCount(Array.isArray(favs) ? favs.length : 0);
        } else {
          setFavCount(0);
        }
      } catch { setFavCount(0); }
    }
    loadFavs();
    window.addEventListener(WindowEvents.WORSHIP_FAVORITES_CHANGED, loadFavs);
    return () => window.removeEventListener(WindowEvents.WORSHIP_FAVORITES_CHANGED, loadFavs);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.worship')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.worshipDesc')}</p>
        </div>
      </div>
      {songCount > 0 || favCount > 0 ? (
        <div className="space-y-1">
          {songCount > 0 && (
            <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">
              {t('widgets.worshipSongCount').replace('{count}', String(songCount))}
            </p>
          )}
          {favCount > 0 && (
            <p className="text-xs text-violet-500 dark:text-violet-400/70">
              {t('widgets.worshipFavCount').replace('{count}', String(favCount))}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noWorshipSongs')}</p>
      )}
    </div>
  );
});

export default WorshipWidget;
