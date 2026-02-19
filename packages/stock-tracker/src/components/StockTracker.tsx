import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import { useTranslation, WindowEvents, StorageKeys } from '@mycircle/shared';
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
  buyPrice?: number;
  quantity?: number;
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
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [buyPrice, setBuyPrice] = useState('');
  const [quantity, setQuantity] = useState('');

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
    setShowPortfolioForm(false);
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

  const handleBackToOverview = useCallback(() => {
    navigate('/stocks');
  }, [navigate]);

  const handleSavePortfolio = useCallback(() => {
    if (!selectedSymbol) return;
    const bp = parseFloat(buyPrice);
    const qty = parseFloat(quantity);
    if (isNaN(bp) || bp <= 0) return;
    setWatchlist(prev => prev.map(item =>
      item.symbol === selectedSymbol
        ? { ...item, buyPrice: bp, quantity: isNaN(qty) ? undefined : qty }
        : item
    ));
    setBuyPrice('');
    setQuantity('');
    setShowPortfolioForm(false);
  }, [selectedSymbol, buyPrice, quantity]);

  const isInWatchlist = selectedSymbol ? watchlist.some(item => item.symbol === selectedSymbol) : false;
  const watchlistItem = selectedSymbol ? watchlist.find(item => item.symbol === selectedSymbol) : null;

  const isPositive = selectedQuote ? selectedQuote.d >= 0 : true;
  const changeColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

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
                <span className={`text-xl font-semibold ${changeColor}`}>
                  {isPositive ? '+' : ''}{selectedQuote.d.toFixed(2)} ({isPositive ? '+' : ''}{selectedQuote.dp.toFixed(2)}%)
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

              {/* Portfolio tracking */}
              {isInWatchlist && watchlistItem && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  {watchlistItem.buyPrice ? (
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">{t('stocks.costBasis')}</p>
                        <p className="font-medium text-gray-900 dark:text-white">${watchlistItem.buyPrice.toFixed(2)}</p>
                      </div>
                      {watchlistItem.quantity && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">{t('stocks.shares')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{watchlistItem.quantity}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">{t('stocks.gainLoss')}</p>
                        {(() => {
                          const gain = selectedQuote.c - watchlistItem.buyPrice;
                          const gainPct = (gain / watchlistItem.buyPrice) * 100;
                          const isUp = gain >= 0;
                          return (
                            <p className={`font-medium ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {isUp ? '+' : ''}{gain.toFixed(2)} ({isUp ? '+' : ''}{gainPct.toFixed(2)}%)
                            </p>
                          );
                        })()}
                      </div>
                      {watchlistItem.quantity && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">{t('stocks.totalValue')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            ${(selectedQuote.c * watchlistItem.quantity).toFixed(2)}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setWatchlist(prev => prev.map(item =>
                            item.symbol === selectedSymbol ? { ...item, buyPrice: undefined, quantity: undefined } : item
                          ));
                        }}
                        className="text-xs text-gray-400 hover:text-red-500 transition"
                      >
                        {t('stocks.clearPosition')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPortfolioForm(prev => !prev)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                      </svg>
                      {t('stocks.addPosition')}
                    </button>
                  )}

                  {showPortfolioForm && !watchlistItem.buyPrice && (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="number"
                        value={buyPrice}
                        onChange={(e) => setBuyPrice(e.target.value)}
                        placeholder={t('stocks.buyPricePlaceholder')}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                        step="0.01"
                        min="0"
                      />
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder={t('stocks.quantityPlaceholder')}
                        className="w-24 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                        step="1"
                        min="0"
                      />
                      <button
                        onClick={handleSavePortfolio}
                        disabled={!buyPrice}
                        className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        {t('stocks.save')}
                      </button>
                    </div>
                  )}
                </div>
              )}
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

    </div>
  );
}
