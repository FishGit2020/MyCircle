import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Watchlist from './Watchlist';

// Mock the child component StockCard
vi.mock('./StockCard', () => ({
  default: ({ symbol, companyName, isInWatchlist, onToggleWatchlist, onClick }: any) => (
    <div data-testid={`stock-card-${symbol}`}>
      <span>{symbol}</span>
      <span>{companyName}</span>
      <button onClick={() => onToggleWatchlist(symbol)}>
        {isInWatchlist ? 'Remove' : 'Add'}
      </button>
      <button onClick={() => onClick?.(symbol)}>Select</button>
    </div>
  ),
}));

// Mock the hooks used by WatchlistCard
vi.mock('../hooks/useStockData', () => ({
  useStockQuote: vi.fn().mockReturnValue({
    quote: { c: 150, d: 2, dp: 1.3, h: 152, l: 148, o: 149, pc: 148, t: 1700000000 },
    loading: false,
    error: null,
    refetch: vi.fn(),
    lastUpdated: null,
    isLive: false,
  }),
  useStockCandles: vi.fn().mockReturnValue({
    candles: { c: [148, 149, 150], h: [], l: [], o: [], t: [], v: [], s: 'ok' },
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe('Watchlist', () => {
  const mockWatchlist = [
    { symbol: 'AAPL', companyName: 'Apple Inc.' },
    { symbol: 'GOOGL', companyName: 'Alphabet Inc.' },
    { symbol: 'MSFT', companyName: 'Microsoft Corp.' },
  ];
  const onToggleWatchlist = vi.fn();
  const onSelectStock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all watchlist items', () => {
    render(
      <Watchlist
        watchlist={mockWatchlist}
        onToggleWatchlist={onToggleWatchlist}
        onSelectStock={onSelectStock}
      />
    );

    expect(screen.getByTestId('stock-card-AAPL')).toBeInTheDocument();
    expect(screen.getByTestId('stock-card-GOOGL')).toBeInTheDocument();
    expect(screen.getByTestId('stock-card-MSFT')).toBeInTheDocument();
  });

  it('renders in a grid layout', () => {
    const { container } = render(
      <Watchlist
        watchlist={mockWatchlist}
        onToggleWatchlist={onToggleWatchlist}
        onSelectStock={onSelectStock}
      />
    );

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it('shows empty state when watchlist is empty', () => {
    render(
      <Watchlist
        watchlist={[]}
        onToggleWatchlist={onToggleWatchlist}
        onSelectStock={onSelectStock}
      />
    );

    expect(screen.getByText('No stocks in your watchlist yet.')).toBeInTheDocument();
    expect(screen.getByText('Search for stocks and add them to your watchlist.')).toBeInTheDocument();
  });

  it('does not render grid when watchlist is empty', () => {
    const { container } = render(
      <Watchlist
        watchlist={[]}
        onToggleWatchlist={onToggleWatchlist}
        onSelectStock={onSelectStock}
      />
    );

    expect(container.querySelector('.grid')).not.toBeInTheDocument();
  });

  it('passes onToggleWatchlist to stock cards', () => {
    render(
      <Watchlist
        watchlist={mockWatchlist}
        onToggleWatchlist={onToggleWatchlist}
        onSelectStock={onSelectStock}
      />
    );

    // Click the Remove button on the AAPL card (mocked StockCard)
    const aaplCard = screen.getByTestId('stock-card-AAPL');
    const removeButton = aaplCard.querySelector('button');
    removeButton?.click();

    expect(onToggleWatchlist).toHaveBeenCalledWith('AAPL');
  });

  it('passes onSelectStock to stock cards', () => {
    render(
      <Watchlist
        watchlist={mockWatchlist}
        onToggleWatchlist={onToggleWatchlist}
        onSelectStock={onSelectStock}
      />
    );

    // Click the Select button on the GOOGL card
    const googlCard = screen.getByTestId('stock-card-GOOGL');
    const buttons = googlCard.querySelectorAll('button');
    // Second button is the Select button in our mock
    buttons[1]?.click();

    expect(onSelectStock).toHaveBeenCalledWith('GOOGL');
  });

  it('renders correct number of WatchlistCard components', () => {
    render(
      <Watchlist
        watchlist={[{ symbol: 'TSLA', companyName: 'Tesla Inc.' }]}
        onToggleWatchlist={onToggleWatchlist}
        onSelectStock={onSelectStock}
      />
    );

    expect(screen.getAllByText(/Select/).length).toBe(1);
    expect(screen.getByText('TSLA')).toBeInTheDocument();
  });
});
