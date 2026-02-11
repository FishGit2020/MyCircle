import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StockCard from './StockCard';
import { StockQuote } from '../hooks/useStockData';

const mockQuotePositive: StockQuote = {
  c: 185.92,
  d: 2.45,
  dp: 1.34,
  h: 187.05,
  l: 183.80,
  o: 184.10,
  pc: 183.47,
  t: 1700000000,
};

const mockQuoteNegative: StockQuote = {
  c: 142.30,
  d: -3.15,
  dp: -2.17,
  h: 146.00,
  l: 141.50,
  o: 145.50,
  pc: 145.45,
  t: 1700000000,
};

const mockSparklineData = [180, 182, 181, 184, 183, 185, 186];

describe('StockCard', () => {
  it('renders symbol and company name', () => {
    render(
      <StockCard
        symbol="AAPL"
        companyName="Apple Inc."
        quote={mockQuotePositive}
        loading={false}
        isInWatchlist={false}
        onToggleWatchlist={vi.fn()}
      />
    );

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
  });

  it('displays current price', () => {
    render(
      <StockCard
        symbol="AAPL"
        companyName="Apple Inc."
        quote={mockQuotePositive}
        loading={false}
        isInWatchlist={false}
        onToggleWatchlist={vi.fn()}
      />
    );

    expect(screen.getByText('$185.92')).toBeInTheDocument();
  });

  it('shows positive change in green', () => {
    render(
      <StockCard
        symbol="AAPL"
        companyName="Apple Inc."
        quote={mockQuotePositive}
        loading={false}
        isInWatchlist={false}
        onToggleWatchlist={vi.fn()}
      />
    );

    const changeElement = screen.getByText('+2.45 (+1.34%)');
    expect(changeElement).toBeInTheDocument();

    // The parent container should have green color class
    const changeBadge = changeElement.closest('div');
    expect(changeBadge?.className).toContain('text-green-600');
  });

  it('shows negative change in red', () => {
    render(
      <StockCard
        symbol="TSLA"
        companyName="Tesla Inc."
        quote={mockQuoteNegative}
        loading={false}
        isInWatchlist={false}
        onToggleWatchlist={vi.fn()}
      />
    );

    const changeElement = screen.getByText('-3.15 (-2.17%)');
    expect(changeElement).toBeInTheDocument();

    const changeBadge = changeElement.closest('div');
    expect(changeBadge?.className).toContain('text-red-600');
  });

  it('shows loading skeleton when loading', () => {
    const { container } = render(
      <StockCard
        symbol="AAPL"
        companyName="Apple Inc."
        quote={null}
        loading={true}
        isInWatchlist={false}
        onToggleWatchlist={vi.fn()}
      />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows loading text when quote is null and not loading', () => {
    render(
      <StockCard
        symbol="AAPL"
        companyName="Apple Inc."
        quote={null}
        loading={false}
        isInWatchlist={false}
        onToggleWatchlist={vi.fn()}
      />
    );

    expect(screen.getByText('Loading stock data...')).toBeInTheDocument();
  });

  it('calls onToggleWatchlist when star button is clicked', () => {
    const onToggle = vi.fn();
    render(
      <StockCard
        symbol="AAPL"
        companyName="Apple Inc."
        quote={mockQuotePositive}
        loading={false}
        isInWatchlist={false}
        onToggleWatchlist={onToggle}
      />
    );

    const starButton = screen.getByRole('button', { name: 'Add to watchlist' });
    fireEvent.click(starButton);

    expect(onToggle).toHaveBeenCalledWith('AAPL');
  });

  it('shows filled star when in watchlist', () => {
    render(
      <StockCard
        symbol="AAPL"
        companyName="Apple Inc."
        quote={mockQuotePositive}
        loading={false}
        isInWatchlist={true}
        onToggleWatchlist={vi.fn()}
      />
    );

    const removeButton = screen.getByRole('button', { name: 'Remove from watchlist' });
    expect(removeButton).toBeInTheDocument();
  });

  it('renders sparkline when data is provided', () => {
    const { container } = render(
      <StockCard
        symbol="AAPL"
        companyName="Apple Inc."
        quote={mockQuotePositive}
        loading={false}
        isInWatchlist={false}
        onToggleWatchlist={vi.fn()}
        sparklineData={mockSparklineData}
      />
    );

    // Sparkline renders an SVG
    const svgs = container.querySelectorAll('svg');
    // Should have at least 2 SVGs: star icon + sparkline
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it('calls onClick when card is clicked', () => {
    const onClick = vi.fn();
    render(
      <StockCard
        symbol="AAPL"
        companyName="Apple Inc."
        quote={mockQuotePositive}
        loading={false}
        isInWatchlist={false}
        onToggleWatchlist={vi.fn()}
        onClick={onClick}
      />
    );

    const card = screen.getByRole('button', { name: 'AAPL - Apple Inc.' });
    fireEvent.click(card);

    expect(onClick).toHaveBeenCalledWith('AAPL');
  });
});
