import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing/react';
import { GET_STOCK_QUOTE, StorageKeys } from '@weather/shared';
import StockTracker from './StockTracker';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('StockTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('renders the stock tracker title', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <StockTracker />
      </MockedProvider>
    );

    expect(screen.getByText('Stock Tracker')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <StockTracker />
      </MockedProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search stocks...');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders the watchlist section', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <StockTracker />
      </MockedProvider>
    );

    expect(screen.getByText('Watchlist')).toBeInTheDocument();
  });

  it('shows empty watchlist message when no stocks are saved', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <StockTracker />
      </MockedProvider>
    );

    expect(screen.getByText('No stocks in your watchlist yet.')).toBeInTheDocument();
    expect(screen.getByText('Search for stocks and add them to your watchlist.')).toBeInTheDocument();
  });

  it('renders search input with correct aria attributes', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <StockTracker />
      </MockedProvider>
    );

    const searchInput = screen.getByPlaceholderText('Search stocks...');
    expect(searchInput).toHaveAttribute('role', 'combobox');
    expect(searchInput).toHaveAttribute('aria-label', 'Search stocks...');
  });

  it('shows LIVE indicator when a stock quote is loaded and live is enabled', async () => {
    const mockTimestamp = Math.floor(Date.now() / 1000);
    const mocks = [
      {
        request: {
          query: GET_STOCK_QUOTE,
          variables: { symbol: 'AAPL' },
        },
        result: {
          data: {
            stockQuote: {
              c: 150.25,
              d: 2.5,
              dp: 1.69,
              h: 152.0,
              l: 148.0,
              o: 149.0,
              pc: 147.75,
              t: mockTimestamp,
            },
          },
        },
      },
    ];

    // Pre-populate watchlist with AAPL and enable live mode
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === StorageKeys.STOCK_WATCHLIST) return JSON.stringify([{ symbol: 'AAPL', companyName: 'Apple Inc.' }]);
      if (key === StorageKeys.STOCK_LIVE) return 'true';
      return null;
    });

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <StockTracker />
      </MockedProvider>
    );

    // Click on the watchlist card to select AAPL
    const appleCard = await screen.findByText('AAPL');
    await act(async () => {
      await userEvent.click(appleCard);
    });

    // Wait for the LIVE indicator to appear after query resolves
    const liveIndicator = await screen.findByText('LIVE');
    expect(liveIndicator).toBeInTheDocument();
  });

  it('shows Paused when live is disabled', async () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <StockTracker />
      </MockedProvider>
    );

    // Live defaults to false, so no LIVE indicator should be shown
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });

  it('live toggle has visible border and background styling', async () => {
    const mockTimestamp = Math.floor(Date.now() / 1000);
    const mocks = [
      {
        request: {
          query: GET_STOCK_QUOTE,
          variables: { symbol: 'AAPL' },
        },
        result: {
          data: {
            stockQuote: {
              c: 150.25, d: 2.5, dp: 1.69, h: 152.0,
              l: 148.0, o: 149.0, pc: 147.75, t: mockTimestamp,
            },
          },
        },
      },
    ];

    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === StorageKeys.STOCK_WATCHLIST) return JSON.stringify([{ symbol: 'AAPL', companyName: 'Apple Inc.' }]);
      if (key === StorageKeys.STOCK_LIVE) return 'true';
      return null;
    });

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <StockTracker />
      </MockedProvider>
    );

    const appleCard = await screen.findByText('AAPL');
    await act(async () => {
      await userEvent.click(appleCard);
    });

    const liveButton = await screen.findByText('LIVE');
    const button = liveButton.closest('button');
    expect(button?.className).toContain('border');
    expect(button?.className).toContain('rounded-lg');
  });
});
