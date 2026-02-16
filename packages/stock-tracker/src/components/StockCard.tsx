import React from 'react';
import { useTranslation } from '@mycircle/shared';
import { StockQuote } from '../hooks/useStockData';

interface Props {
  symbol: string;
  companyName: string;
  quote: StockQuote | null;
  loading: boolean;
  isInWatchlist: boolean;
  onToggleWatchlist: (symbol: string) => void;
  onClick?: (symbol: string) => void;
  sparklineData?: number[];
}

const MiniSparkline = React.memo(function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const width = 80;
  const height = 32;
  const padding = 2;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * plotWidth;
    const y = padding + (1 - (value - min) / range) * plotHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`).join(' ');

  const isPositive = data[data.length - 1] >= data[0];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="flex-shrink-0"
      aria-hidden="true"
    >
      <path
        d={pathD}
        fill="none"
        stroke={isPositive ? '#22c55e' : '#ef4444'}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
});

function StockCard({
  symbol,
  companyName,
  quote,
  loading,
  isInWatchlist,
  onToggleWatchlist,
  onClick,
  sparklineData,
}: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="stock-card-enter bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-28" />
            </div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full" />
          </div>
          <div className="flex justify-between items-end">
            <div className="h-7 bg-gray-200 dark:bg-gray-600 rounded w-20" />
            <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-16" />
          </div>
        </div>
      </div>
    );
  }

  const isPositive = quote ? quote.d >= 0 : true;
  const changeColor = isPositive
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';
  const changeBg = isPositive
    ? 'bg-green-50 dark:bg-green-900/30'
    : 'bg-red-50 dark:bg-red-900/30';

  return (
    <div
      className="stock-card-enter bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow cursor-pointer"
      onClick={() => onClick?.(symbol)}
      role="button"
      tabIndex={0}
      aria-label={`${symbol} - ${companyName}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(symbol);
        }
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{symbol}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{companyName}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWatchlist(symbol);
          }}
          className={`ml-2 p-2 rounded-full transition flex-shrink-0 ${
            isInWatchlist
              ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
              : 'text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          aria-label={isInWatchlist ? t('stocks.removeFromWatchlist') : t('stocks.addToWatchlist')}
          title={isInWatchlist ? t('stocks.removeFromWatchlist') : t('stocks.addToWatchlist')}
        >
          <svg className="w-5 h-5" fill={isInWatchlist ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      <div className="flex justify-between items-end">
        <div>
          {quote ? (
            <>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${quote.c.toFixed(2)}
              </p>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium mt-1 ${changeBg} ${changeColor}`}>
                <svg
                  className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span>
                  <span className="sr-only">{isPositive ? t('stocks.priceUp') : t('stocks.priceDown')}</span>
                  {isPositive ? '+' : ''}{quote.d.toFixed(2)} ({isPositive ? '+' : ''}{quote.dp.toFixed(2)}%)
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">{t('stocks.loading')}</p>
          )}
        </div>

        {sparklineData && sparklineData.length >= 2 && (
          <div className="flex-shrink-0" title={t('stocks.sparkline7d')}>
            <MiniSparkline data={sparklineData} />
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(StockCard);
