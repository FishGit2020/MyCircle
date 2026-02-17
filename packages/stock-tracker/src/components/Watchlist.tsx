import React from 'react';
import { useTranslation } from '@mycircle/shared';
import { useStockQuote, useStockCandles } from '../hooks/useStockData';
import StockCard from './StockCard';

interface WatchlistItem {
  symbol: string;
  companyName: string;
}

interface Props {
  watchlist: WatchlistItem[];
  onToggleWatchlist: (symbol: string) => void;
  onSelectStock: (symbol: string) => void;
}

function WatchlistCard({ item, onToggleWatchlist, onSelectStock }: {
  item: WatchlistItem;
  onToggleWatchlist: (symbol: string) => void;
  onSelectStock: (symbol: string) => void;
}) {
  const { quote, loading: quoteLoading } = useStockQuote(item.symbol, 0);
  const { candles, loading: candlesLoading } = useStockCandles(item.symbol);

  const sparklineData = candles && candles.s !== 'no_data' && candles.c
    ? candles.c
    : undefined;

  return (
    <StockCard
      symbol={item.symbol}
      companyName={item.companyName}
      quote={quote}
      loading={quoteLoading && !quote}
      isInWatchlist={true}
      onToggleWatchlist={onToggleWatchlist}
      onClick={onSelectStock}
      sparklineData={sparklineData}
    />
  );
}

export default function Watchlist({ watchlist, onToggleWatchlist, onSelectStock }: Props) {
  const { t } = useTranslation();

  if (watchlist.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-1">
          {t('stocks.noWatchlist')}
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          {t('stocks.addSome')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {watchlist.map(item => (
        <WatchlistCard
          key={item.symbol}
          item={item}
          onToggleWatchlist={onToggleWatchlist}
          onSelectStock={onSelectStock}
        />
      ))}
    </div>
  );
}
