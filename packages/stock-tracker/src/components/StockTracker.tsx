import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { useTranslation, WindowEvents, StorageKeys, PageContent } from '@mycircle/shared';
import StockSearch from './StockSearch';
import CryptoTracker from './CryptoTracker';
import Watchlist from './Watchlist';
import StockChart from './StockChart';
import StockNews from './StockNews';
import { useStockQuote, useStockCandles, Timeframe } from '../hooks/useStockData';
import './StockTracker.css';

interface WatchlistItem {
  symbol: string;
  companyName: string;
}

function loadWatchlist(): WatchlistItem[] {
  try {
    const stored = localStorage.getItem(StorageKeys.STOCK_WATCHLIST);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function saveWatchlist(watchlist: WatchlistItem[]): void {
  try { localStorage.setItem(StorageKeys.STOCK_WATCHLIST, JSON.stringify(watchlist)); } catch { /* ignore */ }
}

export default function StockTracker() {
  const { t } = useTranslation();
  const { symbol: routeSymbol } = useParams<{ symbol: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedSymbol = routeSymbol ?? null;
  const selectedName = searchParams.get('name') ?? routeSymbol ?? '';

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(loadWatchlist);
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');

  const { quote: selectedQuote, loading: quoteLoading, lastUpdated, refetch } = useStockQuote(
    selectedSymbol,
    0
  );
  const { candles: selectedCandles, loading: candlesLoading } = useStockCandles(selectedSymbol, timeframe);

  // Persist watchlist
  useEffect(() => {
    saveWatchlist(watchlist);
    window.dispatchEvent(new Event(WindowEvents.WATCHLIST_CHANGED));
  }, [watchlist]);

  // Reset form state when navigating to a different stock
  useEffect(() => {
    setTimeframe('1M');
  }, [routeSymbol]);

  const handleStockSelect = useCallback((symbol: string, description: string) => {
    navigate(`/stocks/${symbol}?name=${encodeURIComponent(description)}`);
  }, [navigate]);

  const handleToggleWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => {
      const exists = prev.find(item => item.symbol === symbol);
      window.__logAnalyticsEvent?.('watchlist_toggle', { symbol, action: exists ? 'remove' : 'add' });
      if (exists) return prev.filter(item => item.symbol !== symbol);
      const name = symbol === selectedSymbol ? selectedName : symbol;
      return [...prev, { symbol, companyName: name }];
    });
  }, [selectedSymbol, selectedName]);

  const handleWatchlistStockSelect = useCallback((symbol: string) => {
    const item = watchlist.find(w => w.symbol === symbol);
    navigate(`/stocks/${symbol}?name=${encodeURIComponent(item?.companyName ?? symbol)}`);
  }, [watchlist, navigate]);

  const isInWatchlist = selectedSymbol ? watchlist.some(item => item.symbol === selectedSymbol) : false;

  const isPositive = selectedQuote ? selectedQuote.d >= 0 : true;
  const changeColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

  return (
    <PageContent maxWidth="4xl" className="stock-tracker-container">
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

      {/* Watchlist */}
      {!selectedSymbol && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('stocks.watchlist')}
          </h2>
          <Watchlist
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            onSelectStock={handleWatchlistStockSelect}
          />
        </div>
      )}

      {/* Crypto Tracker */}
      {!selectedSymbol && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('crypto.title')}
          </h2>
          <CryptoTracker />
        </div>
      )}


      {/* Selected stock detail view */}
      {selectedSymbol && (
        <div className="mb-8 stock-card-enter">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedSymbol}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{selectedName}</p>
            </div>
            <div className="flex items-center gap-1">
              {/* Refresh button */}
              <button
                type="button"
                onClick={() => refetch()}
                disabled={quoteLoading}
                className="p-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
                aria-label={t('stocks.refresh')}
              >
                <svg className={`w-5 h-5 ${quoteLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              {/* Watchlist star */}
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
                <span className={`inline-flex items-center gap-1 text-xl font-semibold ${changeColor}`}>
                  <svg className={`w-4 h-4 ${isPositive ? '' : 'rotate-180'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <span className="sr-only">{isPositive ? 'Up' : 'Down'}</span>
                    {isPositive ? '+' : ''}{selectedQuote.d.toFixed(2)} ({isPositive ? '+' : ''}{selectedQuote.dp.toFixed(2)}%)
                  </span>
                </span>
              </div>
              {lastUpdated && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                  {lastUpdated.toLocaleTimeString()}
                </p>
              )}
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

          {/* Chart with timeframe selector */}
          {candlesLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="stock-loading-pulse h-64 bg-gray-100 dark:bg-gray-700 rounded" />
            </div>
          ) : selectedCandles ? (
            <StockChart
              symbol={selectedSymbol}
              candles={selectedCandles}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
          ) : null}

          <StockNews symbol={selectedSymbol} />
        </div>
      )}

    </PageContent>
  );
}
