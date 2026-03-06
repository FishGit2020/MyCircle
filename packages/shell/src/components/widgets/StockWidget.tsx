import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation, StorageKeys, WindowEvents } from '@mycircle/shared';

const StockWidget = React.memo(function StockWidget() {
  const { t } = useTranslation();
  const [watchlist, setWatchlist] = React.useState<Array<{ symbol: string; companyName: string }>>([]);

  useEffect(() => {
    function load() {
      try {
        const stored = localStorage.getItem(StorageKeys.STOCK_WATCHLIST);
        if (stored) setWatchlist(JSON.parse(stored));
        else setWatchlist([]);
      } catch { /* ignore */ }
    }
    load();
    window.addEventListener(WindowEvents.WATCHLIST_CHANGED, load);
    return () => window.removeEventListener(WindowEvents.WATCHLIST_CHANGED, load);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.stocks')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.stocksDesc')}</p>
        </div>
      </div>
      {watchlist.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {watchlist.map(item => (
            <Link
              key={item.symbol}
              to={`/stocks/${item.symbol}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-mono font-medium hover:bg-green-100 dark:hover:bg-green-800/40 active:bg-green-200 dark:active:bg-green-700/40 transition-colors"
            >
              {item.symbol}
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noStocks')}</p>
      )}
    </div>
  );
});

export default StockWidget;
