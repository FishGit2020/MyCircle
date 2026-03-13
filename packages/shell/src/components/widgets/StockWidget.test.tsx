import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import StockWidget from './StockWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  StorageKeys: { STOCK_WATCHLIST: 'stock-tracker-watchlist' },
  WindowEvents: { WATCHLIST_CHANGED: 'watchlist-changed' },
}));

const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

beforeEach(() => {
  getItemSpy.mockReturnValue(null);
});

describe('StockWidget', () => {
  it('renders stocks title', () => {
    render(<MemoryRouter><StockWidget /></MemoryRouter>);
    expect(screen.getByText('widgets.stocks')).toBeInTheDocument();
  });

  it('shows no stocks message when watchlist is empty', () => {
    render(<MemoryRouter><StockWidget /></MemoryRouter>);
    expect(screen.getByText('widgets.noStocks')).toBeInTheDocument();
  });

  it('renders watchlist symbols as links', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'stock-tracker-watchlist')
        return JSON.stringify([
          { symbol: 'AAPL', companyName: 'Apple' },
          { symbol: 'GOOG', companyName: 'Alphabet' },
        ]);
      return null;
    });
    render(<MemoryRouter><StockWidget /></MemoryRouter>);
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('GOOG')).toBeInTheDocument();
  });

  it('renders links to correct stock pages', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'stock-tracker-watchlist')
        return JSON.stringify([{ symbol: 'AAPL', companyName: 'Apple' }]);
      return null;
    });
    render(<MemoryRouter><StockWidget /></MemoryRouter>);
    const link = screen.getByText('AAPL').closest('a');
    expect(link).toHaveAttribute('href', '/stocks/AAPL');
  });

  it('updates when watchlist changes via window event', () => {
    render(<MemoryRouter><StockWidget /></MemoryRouter>);
    expect(screen.getByText('widgets.noStocks')).toBeInTheDocument();

    getItemSpy.mockImplementation((key: string) => {
      if (key === 'stock-tracker-watchlist')
        return JSON.stringify([{ symbol: 'TSLA', companyName: 'Tesla' }]);
      return null;
    });
    act(() => {
      window.dispatchEvent(new Event('watchlist-changed'));
    });
    expect(screen.getByText('TSLA')).toBeInTheDocument();
  });
});
