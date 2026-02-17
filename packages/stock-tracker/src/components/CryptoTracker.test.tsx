import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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

function createMock(prices = [mockBitcoin]) {
  return {
    request: {
      query: GET_CRYPTO_PRICES,
      variables: { ids: ['bitcoin'] },
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
      variables: { ids: ['bitcoin'] },
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

  it('renders Bitcoin price after loading', async () => {
    render(
      <MockedProvider mocks={[createMock()]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    expect(await screen.findByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
  });

  it('shows positive change with + prefix', async () => {
    render(
      <MockedProvider mocks={[createMock()]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    expect(await screen.findByText('+2.54%')).toBeInTheDocument();
  });

  it('shows negative change', async () => {
    const negativeBtc = { ...mockBitcoin, price_change_percentage_24h: -3.21 };
    render(
      <MockedProvider mocks={[createMock([negativeBtc])]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    expect(await screen.findByText('-3.21%')).toBeInTheDocument();
  });

  it('shows error message when query fails', async () => {
    render(
      <MockedProvider mocks={[createErrorMock()]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    expect(await screen.findByText('Failed to load crypto data')).toBeInTheDocument();
  });

  it('renders sparkline SVG', async () => {
    render(
      <MockedProvider mocks={[createMock()]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    await screen.findByText('BTC');

    const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('shows no-data message when prices array is empty', async () => {
    render(
      <MockedProvider mocks={[createMock([])]} addTypename={false}>
        <CryptoTracker />
      </MockedProvider>
    );

    expect(await screen.findByText('No crypto prices available')).toBeInTheDocument();
  });
});
