import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation, WindowEvents, StorageKeys } from '@mycircle/shared';
import StockSearch from './StockSearch';
import Watchlist from './Watchlist';
import StockChart from './StockChart';
import { useStockQuote, useStockCandles } from '../hooks/useStockData';
import './StockTracker.css';

interface WatchlistItem {
  symbol: string;
  companyName: string;
}

function loadWatchlist(): WatchlistItem[] {
  try {
    const stored = localStorage.getItem(StorageKeys.STOCK_WATCHLIST);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch { /* ignore */ }
  return [];
}

function saveWatchlist(watchlist: WatchlistItem[]): void {
  try {
    localStorage.setItem(StorageKeys.STOCK_WATCHLIST, JSON.stringify(watchlist));
  } catch { /* ignore */ }
}

export default function StockTracker() {
  const { t } = useTranslation();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(loadWatchlist);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>('');

  const [liveEnabled, setLiveEnabled] = useState(() => {
    try { return localStorage.getItem(StorageKeys.STOCK_LIVE) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(StorageKeys.STOCK_LIVE, String(liveEnabled)); } catch { /* ignore */ }
  }, [liveEnabled]);

  const { quote: selectedQuote, loading: quoteLoading, lastUpdated, isLive } = useStockQuote(
    selectedSymbol,
    liveEnabled ? 60_000 : 0
  );
  const { candles: selectedCandles, loading: candlesLoading } = useStockCandles(selectedSymbol);

  // Persist watchlist to localStorage and notify shell for Firestore sync
  useEffect(() => {
    saveWatchlist(watchlist);
    window.dispatchEvent(new Event(WindowEvents.WATCHLIST_CHANGED));
  }, [watchlist]);

  const handleStockSelect = useCallback((symbol: string, description: string) => {
    setSelectedSymbol(symbol);
    setSelectedName(description);
  }, []);

  const handleToggleWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => {
      const exists = prev.find(item => item.symbol === symbol);
      if (exists) {
        return prev.filter(item => item.symbol !== symbol);
      }
      // When adding from the watchlist toggle, we may not have the company name readily
      // If it's the currently selected stock, use that name
      const name = symbol === selectedSymbol ? selectedName : symbol;
      return [...prev, { symbol, companyName: name }];
    });
  }, [selectedSymbol, selectedName]);

  const handleWatchlistStockSelect = useCallback((symbol: string) => {
    const item = watchlist.find(w => w.symbol === symbol);
    setSelectedSymbol(symbol);
    setSelectedName(item?.companyName ?? symbol);
  }, [watchlist]);

  const handleBackToOverview = useCallback(() => {
    setSelectedSymbol(null);
    setSelectedName('');
  }, []);

  const isInWatchlist = selectedSymbol
    ? watchlist.some(item => item.symbol === selectedSymbol)
    : false;

  const isPositive = selectedQuote ? selectedQuote.d >= 0 : true;
  const changeColor = isPositive
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  return (
    <div className="stock-tracker-container max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('stocks.title')}
        </h1>
      </div>

      {/* Search */}
      <div className="mb-8">
        <StockSearch onSelect={handleStockSelect} />
      </div>

      {/* Selected stock detail view */}
      {selectedSymbol && (
        <div className="mb-8 stock-card-enter">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleBackToOverview}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-500 dark:text-gray-400"
              aria-label="Back to overview"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedSymbol}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{selectedName}</p>
            </div>
            <button
              onClick={() => handleToggleWatchlist(selectedSymbol)}
              className={`p-2 rounded-full transition ${
                isInWatchlist
                  ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                  : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-label={isInWatchlist ? t('stocks.removeFromWatchlist') : t('stocks.addToWatchlist')}
            >
              <svg className="w-6 h-6" fill={isInWatchlist ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>

          {/* Quote summary */}
          {quoteLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-4">
              <div className="animate-pulse flex items-center gap-6">
                <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded w-28" />
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20" />
              </div>
            </div>
          ) : selectedQuote ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-4">
              <div className="flex flex-wrap items-baseline gap-4 mb-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  ${selectedQuote.c.toFixed(2)}
                </span>
                <span className={`text-xl font-semibold ${changeColor}`}>
                  {isPositive ? '+' : ''}{selectedQuote.d.toFixed(2)} ({isPositive ? '+' : ''}{selectedQuote.dp.toFixed(2)}%)
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm mb-4">
                <button
                  onClick={() => setLiveEnabled(prev => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors font-medium ${
                    isLive
                      ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                  aria-label={isLive ? t('stocks.live') : t('stocks.paused')}
                >
                  {isLive ? (
                    <>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      {t('stocks.live')}
                    </>
                  ) : (
                    t('stocks.paused')
                  )}
                </button>
                {isLive && lastUpdated && (
                  <span className="text-gray-500 dark:text-gray-400">· {lastUpdated.toLocaleTimeString()}</span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">{t('stocks.open')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">${selectedQuote.o.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">{t('stocks.high')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">${selectedQuote.h.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">{t('stocks.low')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">${selectedQuote.l.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">{t('stocks.prevClose')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">${selectedQuote.pc.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Chart */}
          {candlesLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="stock-loading-pulse h-64 bg-gray-100 dark:bg-gray-700 rounded" />
            </div>
          ) : selectedCandles ? (
            <StockChart symbol={selectedSymbol} candles={selectedCandles} />
          ) : null}
        </div>
      )}

      {/* Watchlist */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {t('stocks.watchlist')}
        </h2>
        <Watchlist
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
          onSelectStock={handleWatchlistStockSelect}
          liveEnabled={liveEnabled}
        />
      </div>
    </div>
  );
}
