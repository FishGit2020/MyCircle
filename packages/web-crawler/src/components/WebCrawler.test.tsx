import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router';
import { GET_CRAWL_JOBS } from '@mycircle/shared';
import WebCrawler from './WebCrawler';

vi.mock('@mycircle/shared', async () => {
  const actual = await vi.importActual<typeof import('@mycircle/shared')>('@mycircle/shared');
  return {
    ...actual,
    useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
    createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
  };
});

const emptyJobsMock = {
  request: { query: GET_CRAWL_JOBS },
  result: { data: { crawlJobs: [] } },
};

const renderCrawler = (mocks = [emptyJobsMock]) =>
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <MemoryRouter>
        <WebCrawler />
      </MemoryRouter>
    </MockedProvider>,
  );

describe('WebCrawler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title and URL input', () => {
    renderCrawler();
    expect(screen.getByText('webCrawler.title')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /webCrawler.urlLabel/i })).toBeInTheDocument();
  });

  it('renders start button disabled when URL is empty', () => {
    renderCrawler();
    const startBtn = screen.getByRole('button', { name: /webCrawler.startCrawl/i });
    expect(startBtn).toBeDisabled();
  });

  it('enables start button when URL is entered', () => {
    renderCrawler();
    const input = screen.getByRole('textbox', { name: /webCrawler.urlLabel/i });
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    const startBtn = screen.getByRole('button', { name: /webCrawler.startCrawl/i });
    expect(startBtn).toBeEnabled();
  });

  it('renders tabs', () => {
    renderCrawler();
    expect(screen.getByText('webCrawler.tabs.jobs')).toBeInTheDocument();
    expect(screen.getByText('webCrawler.tabs.documents')).toBeInTheDocument();
    expect(screen.getByText('webCrawler.tabs.tracing')).toBeInTheDocument();
  });

  it('shows no jobs message when empty', async () => {
    renderCrawler();
    expect(await screen.findByText('webCrawler.noJobs')).toBeInTheDocument();
  });

  it('shows max depth and max pages controls', () => {
    renderCrawler();
    expect(screen.getByText('webCrawler.maxDepth')).toBeInTheDocument();
    expect(screen.getByText('webCrawler.maxPages')).toBeInTheDocument();
  });
});
