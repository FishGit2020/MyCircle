import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StockWidget from './StockWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { STOCK_WATCHLIST: 'stock_watchlist' },
  WindowEvents: { WATCHLIST_CHANGED: 'watchlist-changed' },
}));

vi.mock('react-router', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

describe('StockWidget', () => {
  it('renders without crashing', () => {
    render(<StockWidget />);
    expect(screen.getByText('widgets.stocks')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<StockWidget />);
    expect(screen.getByText('widgets.stocksDesc')).toBeInTheDocument();
  });

  it('shows no stocks message when no data', () => {
    render(<StockWidget />);
    expect(screen.getByText('widgets.noStocks')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<StockWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.stocks');
  });
});
