import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing/react';
import { GET_CRYPTO_PRICES } from '@mycircle/shared';
import CryptoTracker from './CryptoTracker';

const mockBitcoin = {
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  image: 'https://example.com/btc.png',
  current_price: 67432.0,
  market_cap: 1320000000000,
  market_cap_rank: 1,
  price_change_percentage_24h: 2.54,
  total_volume: 28000000000,
  sparkline_7d: [65000, 66000, 65500, 67000, 67432],
};

const mockEthereum = {
  id: 'ethereum',
  symbol: 'eth',
  name: 'Ethereum',
  image: 'https://example.com/eth.png',
  current_price: 3521.45,
  market_cap: 423000000000,
  market_cap_rank: 2,
  price_change_percentage_24h: -1.23,
  total_volume: 15000000000,
  sparkline_7d: [3600, 3550, 3500, 3480, 3521.45],
};

function createMock(prices = [mockBitcoin, mockEthereum]) {
  return {
    request: {
      query: GET_CRYPTO_PRICES,
      variables: { ids: ['bitcoin', 'ethereum', 'solana', 'cardano', 'dogecoin'] },
    },
    result: {
      data: { cryptoPrices: prices },
    },
  };
}

function createErrorMock() {
  return {
    request: {
      query: GET_CRYPTO_PRICES,
      variables: { ids: ['bitcoin', 'ethereum', 'solana', 'cardano', 'dogecoin'] },
    },
    error: new Error('Network error'),
  };
}

describe('CryptoTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton initially', () => {
    render(
      <MockedProvider mocks={[createMock()]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders crypto prices after loading', async () => {
    render(
      <MockedProvider mocks={[createMock()]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    expect(await screen.findByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(await screen.findByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });

  it('shows rank badge for each coin', async () => {
    render(
      <MockedProvider mocks={[createMock()]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    expect(await screen.findByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
  });

  it('shows positive change in green with + prefix', async () => {
    render(
      <MockedProvider mocks={[createMock()]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    expect(await screen.findByText('+2.54%')).toBeInTheDocument();
  });

  it('shows negative change in red', async () => {
    render(
      <MockedProvider mocks={[createMock()]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    expect(await screen.findByText('-1.23%')).toBeInTheDocument();
  });

  it('expands card to show market cap and volume on click', async () => {
    render(
      <MockedProvider mocks={[createMock()]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    const btcCard = await screen.findByText('BTC');
    await act(async () => {
      await userEvent.click(btcCard.closest('[role="button"]')!);
    });

    expect(screen.getByText('Market Cap')).toBeInTheDocument();
    expect(screen.getByText('$1.32T')).toBeInTheDocument();
    expect(screen.getByText('24h Volume')).toBeInTheDocument();
    expect(screen.getByText('$28.00B')).toBeInTheDocument();
  });

  it('collapses expanded card when clicked again', async () => {
    render(
      <MockedProvider mocks={[createMock()]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    const btcCard = await screen.findByText('BTC');
    const button = btcCard.closest('[role="button"]')!;

    // Expand
    await act(async () => { await userEvent.click(button); });
    expect(screen.getByText('Market Cap')).toBeInTheDocument();

    // Collapse
    await act(async () => { await userEvent.click(button); });
    expect(screen.queryByText('Market Cap')).not.toBeInTheDocument();
  });

  it('has correct ARIA list structure', async () => {
    render(
      <MockedProvider mocks={[createMock()]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    await screen.findByText('BTC');

    const list = screen.getByRole('list', { name: /crypto/i });
    expect(list).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items.length).toBe(2);
  });

  it('shows error message when query fails', async () => {
    render(
      <MockedProvider mocks={[createErrorMock()]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    expect(await screen.findByText('Failed to load crypto data')).toBeInTheDocument();
  });

  it('shows sparkline SVG in expanded view', async () => {
    render(
      <MockedProvider mocks={[createMock()]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    const btcCard = await screen.findByText('BTC');
    await act(async () => {
      await userEvent.click(btcCard.closest('[role="button"]')!);
    });

    const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('formats price correctly for sub-dollar coins', async () => {
    const cheapCoin = {
      ...mockBitcoin,
      id: 'dogecoin',
      symbol: 'doge',
      name: 'Dogecoin',
      current_price: 0.082345,
      market_cap_rank: 8,
    };
    render(
      <MockedProvider mocks={[createMock([cheapCoin])]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    await screen.findByText('DOGE');
    // Sub-dollar coins should show more decimal places
    const priceEl = screen.getByText((content) => content.includes('0.082345'));
    expect(priceEl).toBeInTheDocument();
  });

  it('navigates with keyboard (Enter key)', async () => {
    render(
      <MockedProvider mocks={[createMock()]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    const btcCard = await screen.findByText('BTC');
    const button = btcCard.closest('[role="button"]')!;

    // Focus and press Enter
    (button as HTMLElement).focus();
    await act(async () => {
      await userEvent.keyboard('{Enter}');
    });

    expect(screen.getByText('Market Cap')).toBeInTheDocument();
  });
});
