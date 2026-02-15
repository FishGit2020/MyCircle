import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation, WindowEvents, StorageKeys } from '@mycircle/shared';
import StockSearch from './StockSearch';
import CryptoTracker from './CryptoTracker';
import EarningsCalendar from './EarningsCalendar';
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

interface PriceAlert {
  symbol: string;
  type: 'above' | 'below';
  price: number;
  enabled: boolean;
}

const ALERTS_KEY = 'stock-price-alerts';

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

function loadAlerts(): PriceAlert[] {
  try {
    const stored = localStorage.getItem(ALERTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function saveAlerts(alerts: PriceAlert[]): void {
  try { localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts)); } catch { /* ignore */ }
}

export default function StockTracker() {
  const { t } = useTranslation();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(loadWatchlist);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>('');
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [alerts, setAlerts] = useState<PriceAlert[]>(loadAlerts);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');
  const [buyPrice, setBuyPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const [cryptoCollapsed, setCryptoCollapsed] = useState(() => {
    try { return localStorage.getItem('stock-crypto-collapsed') === 'true'; } catch { return false; }
  });

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
  const { candles: selectedCandles, loading: candlesLoading } = useStockCandles(selectedSymbol, timeframe);

  // Persist watchlist
  useEffect(() => {
    saveWatchlist(watchlist);
    window.dispatchEvent(new Event(WindowEvents.WATCHLIST_CHANGED));
  }, [watchlist]);

  // Persist alerts
  useEffect(() => { saveAlerts(alerts); }, [alerts]);

  const handleStockSelect = useCallback((symbol: string, description: string) => {
    setSelectedSymbol(symbol);
    setSelectedName(description);
    setTimeframe('1M');
    setShowAlertForm(false);
    setShowPortfolioForm(false);
  }, []);

  const handleToggleWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => {
      const exists = prev.find(item => item.symbol === symbol);
      if (exists) return prev.filter(item => item.symbol !== symbol);
      const name = symbol === selectedSymbol ? selectedName : symbol;
      return [...prev, { symbol, companyName: name }];
    });
  }, [selectedSymbol, selectedName]);

  const handleWatchlistStockSelect = useCallback((symbol: string) => {
    const item = watchlist.find(w => w.symbol === symbol);
    setSelectedSymbol(symbol);
    setSelectedName(item?.companyName ?? symbol);
    setTimeframe('1M');
  }, [watchlist]);

  const handleBackToOverview = useCallback(() => {
    setSelectedSymbol(null);
    setSelectedName('');
    setShowAlertForm(false);
    setShowPortfolioForm(false);
  }, []);

  const handleAddAlert = useCallback(() => {
    if (!selectedSymbol || !alertPrice) return;
    const price = parseFloat(alertPrice);
    if (isNaN(price) || price <= 0) return;
    setAlerts(prev => [...prev, { symbol: selectedSymbol, type: alertType, price, enabled: true }]);
    setAlertPrice('');
    setShowAlertForm(false);
  }, [selectedSymbol, alertPrice, alertType]);

  const handleRemoveAlert = useCallback((index: number) => {
    setAlerts(prev => prev.filter((_, i) => i !== index));
  }, []);

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
  const symbolAlerts = selectedSymbol ? alerts.filter(a => a.symbol === selectedSymbol) : [];

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
            liveEnabled={liveEnabled}
          />
        </div>
      )}

      {/* Crypto Tracker */}
      {!selectedSymbol && (
        <div className="mb-8">
          <button
            onClick={() => setCryptoCollapsed(prev => {
              const next = !prev;
              try { localStorage.setItem('stock-crypto-collapsed', String(next)); } catch { /* ignore */ }
              return next;
            })}
            className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white mb-4 group"
            aria-expanded={!cryptoCollapsed}
          >
            <svg className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-transform ${cryptoCollapsed ? '' : 'rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {t('crypto.title')}
          </button>
          {!cryptoCollapsed && <CryptoTracker />}
        </div>
      )}

      {/* Earnings Calendar */}
      {!selectedSymbol && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t('earnings.title')}
          </h2>
          <EarningsCalendar onSymbolClick={(symbol) => handleStockSelect(symbol, symbol)} />
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
              {/* Alert button */}
              <button
                onClick={() => { setShowAlertForm(prev => !prev); setShowPortfolioForm(false); }}
                className={`p-2 rounded-full transition ${
                  symbolAlerts.length > 0
                    ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                    : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-label={t('stocks.priceAlert')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {symbolAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {symbolAlerts.length}
                  </span>
                )}
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

          {/* Price Alert Form */}
          {showAlertForm && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3">{t('stocks.priceAlert')}</h3>
              {symbolAlerts.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {symbolAlerts.map((alert, i) => {
                    const globalIndex = alerts.indexOf(alert);
                    const triggered = selectedQuote && (
                      (alert.type === 'above' && selectedQuote.c >= alert.price) ||
                      (alert.type === 'below' && selectedQuote.c <= alert.price)
                    );
                    return (
                      <div key={i} className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm ${
                        triggered ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}>
                        <span>
                          {alert.type === 'above' ? '\u2191' : '\u2193'} ${alert.price.toFixed(2)}
                          {triggered && ' \u2714'}
                        </span>
                        <button onClick={() => handleRemoveAlert(globalIndex)} className="text-gray-400 hover:text-red-500 transition">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-2">
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as 'above' | 'below')}
                  className="px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="above">{t('stocks.alertAbove')}</option>
                  <option value="below">{t('stocks.alertBelow')}</option>
                </select>
                <input
                  type="number"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  placeholder="$0.00"
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                  step="0.01"
                  min="0"
                />
                <button
                  onClick={handleAddAlert}
                  disabled={!alertPrice}
                  className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  {t('stocks.addAlert')}
                </button>
              </div>
            </div>
          )}

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
                      onClick={() => { setShowPortfolioForm(prev => !prev); setShowAlertForm(false); }}
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
