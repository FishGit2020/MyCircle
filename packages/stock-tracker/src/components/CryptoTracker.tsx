import React, { useState, useCallback } from 'react';
import { useTranslation, useCryptoPrices } from '@mycircle/shared';
import type { CryptoPrice } from '@mycircle/shared';

function formatCompactNumber(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return null;

  const width = 80;
  const height = 32;
  const padding = 2;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  // Downsample to ~40 points for performance
  const step = Math.max(1, Math.floor(data.length / 40));
  const sampled = data.filter((_, i) => i % step === 0 || i === data.length - 1);

  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const range = max - min || 1;

  const points = sampled.map((value, index) => {
    const x = padding + (index / (sampled.length - 1)) * plotWidth;
    const y = padding + (1 - (value - min) / range) * plotHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`).join(' ');

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
        stroke={positive ? '#22c55e' : '#ef4444'}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

const CryptoCard = React.memo(function CryptoCard({ coin, expanded, onToggle }: {
  coin: CryptoPrice;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const isPositive = (coin.price_change_percentage_24h ?? 0) >= 0;
  const changeColor = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const changeBg = isPositive ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30';

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow cursor-pointer"
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-label={`${coin.name} (${coin.symbol.toUpperCase()})`}
      aria-expanded={expanded}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="flex items-start gap-3">
        <img
          src={coin.image}
          alt={coin.name}
          className="w-8 h-8 rounded-full flex-shrink-0"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {coin.symbol.toUpperCase()}
            </h3>
            {coin.market_cap_rank && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                #{coin.market_cap_rank}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{coin.name}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            ${coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: coin.current_price < 1 ? 6 : 2 })}
          </p>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium ${changeBg} ${changeColor}`}>
            <svg
              className={`w-3 h-3 ${isPositive ? '' : 'rotate-180'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span>{isPositive ? '+' : ''}{(coin.price_change_percentage_24h ?? 0).toFixed(2)}%</span>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-3">
            <div>
              <p className="text-gray-500 dark:text-gray-400">{t('crypto.marketCap')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatCompactNumber(coin.market_cap)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">{t('crypto.volume24h')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatCompactNumber(coin.total_volume)}</p>
            </div>
            {coin.market_cap_rank && (
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t('crypto.rank')}</p>
                <p className="font-medium text-gray-900 dark:text-white">#{coin.market_cap_rank}</p>
              </div>
            )}
          </div>
          {coin.sparkline_7d.length >= 2 && (
            <div title={t('crypto.sparkline7d')}>
              <MiniSparkline data={coin.sparkline_7d} positive={isPositive} />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default function CryptoTracker() {
  const { t } = useTranslation();
  const { prices, loading, error } = useCryptoPrices();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = useCallback((coinId: string) => {
    setExpandedId(prev => prev === coinId ? null : coinId);
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-700 dark:text-red-300 text-sm">{t('crypto.loadError')}</p>
      </div>
    );
  }

  if (loading && prices.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="animate-pulse flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full" />
              <div className="flex-1">
                <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24" />
              </div>
              <div className="text-right">
                <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (prices.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">{t('crypto.noPrices')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" role="list" aria-label={t('crypto.title')}>
      {prices.map(coin => (
        <div key={coin.id} role="listitem">
          <CryptoCard
            coin={coin}
            expanded={expandedId === coin.id}
            onToggle={() => handleToggle(coin.id)}
          />
        </div>
      ))}
    </div>
  );
}
