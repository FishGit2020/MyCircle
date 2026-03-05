import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router';
import PodcastSearch from './PodcastSearch';

const mockSearchResult = {
  feeds: [
    {
      id: 1,
      title: 'Tech Talk Daily',
      author: 'Tech Host',
      artwork: 'https://example.com/art.jpg',
      description: 'Daily tech news',
      feedUrl: 'https://example.com/feed.xml',
      episodeCount: 100,
      categories: {},
    },
  ],
  count: 1,
};

const mockUsePodcastSearch = vi.fn();

vi.mock('../hooks/usePodcastData', () => ({
  usePodcastSearch: (...args: unknown[]) => mockUsePodcastSearch(...args),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MockedProvider mocks={[]} addTypename={false}>
      <MemoryRouter>{ui}</MemoryRouter>
    </MockedProvider>
  );
};

describe('PodcastSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePodcastSearch.mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });
  });

  it('renders search input with placeholder', () => {
    renderWithProviders(<PodcastSearch onSelectPodcast={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search podcasts...')).toBeInTheDocument();
  });

  it('has combobox role for accessibility', () => {
    renderWithProviders(<PodcastSearch onSelectPodcast={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('passes query to search hook on input change', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWithProviders(<PodcastSearch onSelectPodcast={vi.fn()} />);

    const input = screen.getByPlaceholderText('Search podcasts...');
    await user.type(input, 'tech');

    expect(mockUsePodcastSearch).toHaveBeenCalledWith('tech');
    vi.useRealTimers();
  });

  it('shows search results when data is returned', () => {
    mockUsePodcastSearch.mockReturnValue({
      data: mockSearchResult,
      loading: false,
      error: null,
    });

    renderWithProviders(<PodcastSearch onSelectPodcast={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search podcasts...');

    fireEvent.change(input, { target: { value: 'tech' } });
    fireEvent.focus(input);

    expect(screen.getByText('Tech Talk Daily')).toBeInTheDocument();
    expect(screen.getByText('Tech Host')).toBeInTheDocument();
  });

  it('calls onSelectPodcast when a result is clicked', () => {
    const onSelectPodcast = vi.fn();
    mockUsePodcastSearch.mockReturnValue({
      data: mockSearchResult,
      loading: false,
      error: null,
    });

    renderWithProviders(<PodcastSearch onSelectPodcast={onSelectPodcast} />);
    const input = screen.getByPlaceholderText('Search podcasts...');

    fireEvent.change(input, { target: { value: 'tech' } });
    fireEvent.focus(input);
    fireEvent.click(screen.getByText('Tech Talk Daily'));

    expect(onSelectPodcast).toHaveBeenCalledWith(mockSearchResult.feeds[0]);
  });

  it('shows loading skeleton when searching', () => {
    mockUsePodcastSearch.mockReturnValue({
      data: null,
      loading: true,
      error: null,
    });

    renderWithProviders(<PodcastSearch onSelectPodcast={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search podcasts...');

    fireEvent.change(input, { target: { value: 'tech' } });
    fireEvent.focus(input);

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows no results message when search returns empty', () => {
    mockUsePodcastSearch.mockReturnValue({
      data: { feeds: [], count: 0 },
      loading: false,
      error: null,
    });

    renderWithProviders(<PodcastSearch onSelectPodcast={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search podcasts...');

    fireEvent.change(input, { target: { value: 'xyznonexistent' } });
    fireEvent.focus(input);

    expect(screen.getByText('No podcasts found')).toBeInTheDocument();
  });
});
