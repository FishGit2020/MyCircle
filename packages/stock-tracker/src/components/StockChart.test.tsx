import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StockChart from './StockChart';
import { StockCandle, TIMEFRAMES } from '../hooks/useStockData';

const now = Math.floor(Date.now() / 1000);

const mockCandles: StockCandle = {
  c: [150, 152, 148, 155, 153],
  h: [153, 154, 150, 157, 155],
  l: [148, 150, 146, 153, 151],
  o: [149, 151, 149, 154, 154],
  t: [now - 4 * 86400, now - 3 * 86400, now - 2 * 86400, now - 86400, now],
  v: [1000, 1200, 900, 1100, 1050],
  s: 'ok',
};

describe('StockChart', () => {
  it('renders SVG chart when data is provided', () => {
    render(<StockChart symbol="AAPL" candles={mockCandles} />);

    const svg = screen.getByRole('img', { name: 'AAPL price chart' });
    expect(svg).toBeInTheDocument();
    expect(svg.tagName).toBe('svg');
  });

  it('renders symbol heading', () => {
    render(<StockChart symbol="AAPL" candles={mockCandles} />);

    expect(screen.getByText('AAPL')).toBeInTheDocument();
  });

  it('displays high and low prices from data', () => {
    render(<StockChart symbol="AAPL" candles={mockCandles} />);

    // Max close is 155, min close is 148
    // These prices appear in multiple places (chart markers + header)
    expect(screen.getAllByText(/\$155\.00/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/\$148\.00/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when candles have no_data status', () => {
    const noDataCandles: StockCandle = {
      c: [],
      h: [],
      l: [],
      o: [],
      t: [],
      v: [],
      s: 'no_data',
    };

    render(<StockChart symbol="AAPL" candles={noDataCandles} />);

    expect(screen.getByText('No stocks found')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'AAPL price chart' })).not.toBeInTheDocument();
  });

  it('shows empty state when candles have fewer than 2 close prices', () => {
    const singleCandle: StockCandle = {
      c: [150],
      h: [153],
      l: [148],
      o: [149],
      t: [now],
      v: [1000],
      s: 'ok',
    };

    render(<StockChart symbol="AAPL" candles={singleCandle} />);

    expect(screen.getByText('No stocks found')).toBeInTheDocument();
  });

  it('renders timeframe buttons when onTimeframeChange is provided', () => {
    const onTimeframeChange = vi.fn();
    render(
      <StockChart
        symbol="AAPL"
        candles={mockCandles}
        timeframe="1M"
        onTimeframeChange={onTimeframeChange}
      />
    );

    // Should render all TIMEFRAMES as buttons
    for (const tf of TIMEFRAMES) {
      expect(screen.getByText(tf.label)).toBeInTheDocument();
    }
  });

  it('does not render timeframe buttons when onTimeframeChange is not provided', () => {
    render(<StockChart symbol="AAPL" candles={mockCandles} />);

    // TIMEFRAMES buttons should not be present (no callback = no buttons)
    for (const _tf of TIMEFRAMES) {
      // The labels are short strings like "1W", "1M" etc.
      // They might appear in price text, so check specifically for button role
      const buttons = screen.queryAllByRole('button');
      expect(buttons.length).toBe(0);
    }
  });

  it('calls onTimeframeChange when a timeframe button is clicked', () => {
    const onTimeframeChange = vi.fn();
    render(
      <StockChart
        symbol="AAPL"
        candles={mockCandles}
        timeframe="1M"
        onTimeframeChange={onTimeframeChange}
      />
    );

    fireEvent.click(screen.getByText('1W'));
    expect(onTimeframeChange).toHaveBeenCalledWith('1W');

    fireEvent.click(screen.getByText('1Y'));
    expect(onTimeframeChange).toHaveBeenCalledWith('1Y');
  });

  it('highlights the active timeframe button', () => {
    const onTimeframeChange = vi.fn();
    render(
      <StockChart
        symbol="AAPL"
        candles={mockCandles}
        timeframe="3M"
        onTimeframeChange={onTimeframeChange}
      />
    );

    const activeButton = screen.getByText('3M');
    expect(activeButton.className).toContain('bg-blue-500');

    const inactiveButton = screen.getByText('1W');
    expect(inactiveButton.className).not.toContain('bg-blue-500');
  });

  it('uses green color for positive trend (last price >= first price)', () => {
    // mockCandles: first close=150, last close=153 => positive
    const { container } = render(<StockChart symbol="AAPL" candles={mockCandles} />);

    const priceLine = container.querySelector('path[stroke="#22c55e"]');
    expect(priceLine).toBeInTheDocument();
  });

  it('uses red color for negative trend (last price < first price)', () => {
    const negativeCandles: StockCandle = {
      c: [155, 152, 150, 148, 145],
      h: [157, 154, 152, 150, 147],
      l: [153, 150, 148, 146, 143],
      o: [154, 153, 151, 149, 147],
      t: [now - 4 * 86400, now - 3 * 86400, now - 2 * 86400, now - 86400, now],
      v: [1000, 1200, 900, 1100, 1050],
      s: 'ok',
    };

    const { container } = render(<StockChart symbol="AAPL" candles={negativeCandles} />);

    const priceLine = container.querySelector('path[stroke="#ef4444"]');
    expect(priceLine).toBeInTheDocument();
  });
});
