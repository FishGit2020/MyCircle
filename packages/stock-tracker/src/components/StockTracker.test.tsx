import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { GET_STOCK_QUOTE, StorageKeys } from '@mycircle/shared';
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

  const renderTracker = (initialPath = '/stocks') => render(
    <MockedProvider mocks={[]} addTypename={false}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/stocks" element={<StockTracker />} />
          <Route path="/stocks/:symbol" element={<StockTracker />} />
        </Routes>
      </MemoryRouter>
    </MockedProvider>
  );

  it('renders title and watchlist section', () => {
    renderTracker();

    expect(screen.getByText('Stock Tracker')).toBeInTheDocument();
    expect(screen.getByText('Watchlist')).toBeInTheDocument();
  });

  it('shows empty watchlist message when no stocks are saved', () => {
    renderTracker();

    expect(screen.getByText('No stocks in your watchlist yet.')).toBeInTheDocument();
    expect(screen.getByText('Search for stocks and add them to your watchlist.')).toBeInTheDocument();
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

    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === StorageKeys.STOCK_WATCHLIST) return JSON.stringify([{ symbol: 'AAPL', companyName: 'Apple Inc.' }]);
      if (key === StorageKeys.STOCK_LIVE) return 'true';
      return null;
    });

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <MemoryRouter initialEntries={['/stocks']}>
          <Routes>
            <Route path="/stocks" element={<StockTracker />} />
            <Route path="/stocks/:symbol" element={<StockTracker />} />
          </Routes>
        </MemoryRouter>
      </MockedProvider>
    );

    const appleCard = await screen.findByText('AAPL');
    await act(async () => {
      await userEvent.click(appleCard);
    });

    const liveIndicator = await screen.findByText('LIVE');
    expect(liveIndicator).toBeInTheDocument();
  });

  it('shows Paused when live is disabled', () => {
    renderTracker();

    expect(screen.queryByText('LIVE')).not.toBeInTheDocument();
  });
});
