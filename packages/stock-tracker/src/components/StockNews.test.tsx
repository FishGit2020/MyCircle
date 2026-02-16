import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing/react';
import StockNews from './StockNews';
import { GET_COMPANY_NEWS } from '@mycircle/shared';

vi.mock('@mycircle/shared', async () => {
  const actual = await vi.importActual('@mycircle/shared');
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

function getDateRange() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return {
    from: weekAgo.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

const mockArticle = (overrides: Partial<{ image: string | null }> = {}) => ({
  id: 1,
  category: 'company',
  datetime: Math.floor(Date.now() / 1000) - 3600,
  headline: 'Test Headline',
  image: 'https://example.com/image.jpg',
  source: 'Reuters',
  summary: 'Test summary',
  url: 'https://example.com/article',
  ...overrides,
});

function buildMock(articles: ReturnType<typeof mockArticle>[]): MockedResponse {
  const { from, to } = getDateRange();
  return {
    request: {
      query: GET_COMPANY_NEWS,
      variables: { symbol: 'AAPL', from, to },
    },
    result: { data: { companyNews: articles } },
  };
}

async function flushPromises() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

describe('StockNews', () => {
  it('renders article image when image URL is present', async () => {
    render(
      <MockedProvider mocks={[buildMock([mockArticle()])]} addTypename={false}>
        <StockNews symbol="AAPL" />
      </MockedProvider>
    );
    await flushPromises();
    await screen.findByText('Test Headline');
    // img has alt="" (presentational), so query by tag instead
    const img = document.querySelector('img[src="https://example.com/image.jpg"]');
    expect(img).toBeInTheDocument();
  });

  it('renders placeholder when image is null', async () => {
    render(
      <MockedProvider mocks={[buildMock([mockArticle({ image: null })])]} addTypename={false}>
        <StockNews symbol="AAPL" />
      </MockedProvider>
    );
    await flushPromises();
    await screen.findByText('Test Headline');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders placeholder when image is empty string', async () => {
    render(
      <MockedProvider mocks={[buildMock([mockArticle({ image: '' })])]} addTypename={false}>
        <StockNews symbol="AAPL" />
      </MockedProvider>
    );
    await flushPromises();
    await screen.findByText('Test Headline');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders placeholder when image is whitespace only', async () => {
    render(
      <MockedProvider mocks={[buildMock([mockArticle({ image: '   ' })])]} addTypename={false}>
        <StockNews symbol="AAPL" />
      </MockedProvider>
    );
    await flushPromises();
    await screen.findByText('Test Headline');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
