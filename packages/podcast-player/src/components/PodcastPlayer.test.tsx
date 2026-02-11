import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter } from 'react-router';
import PodcastPlayer from './PodcastPlayer';

// Mock the usePodcastData hooks
vi.mock('../hooks/usePodcastData', () => ({
  usePodcastSearch: vi.fn().mockReturnValue({
    data: null,
    loading: false,
    error: null,
  }),
  useTrendingPodcasts: vi.fn().mockReturnValue({
    data: [
      {
        id: 1,
        title: 'Test Podcast',
        author: 'Test Author',
        artwork: 'https://example.com/art.jpg',
        description: 'A test podcast',
        feedUrl: 'https://example.com/feed.xml',
        episodeCount: 42,
        categories: {},
      },
      {
        id: 2,
        title: 'Another Podcast',
        author: 'Another Author',
        artwork: 'https://example.com/art2.jpg',
        description: 'Another test podcast',
        feedUrl: 'https://example.com/feed2.xml',
        episodeCount: 10,
        categories: {},
      },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
  usePodcastEpisodes: vi.fn().mockReturnValue({
    data: null,
    loading: false,
    error: null,
  }),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MockedProvider mocks={[]} addTypename={false}>
      <MemoryRouter>{ui}</MemoryRouter>
    </MockedProvider>
  );
};

describe('PodcastPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the podcast player title', () => {
    renderWithProviders(<PodcastPlayer />);
    expect(screen.getByText('Podcasts')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    renderWithProviders(<PodcastPlayer />);
    expect(screen.getByPlaceholderText('Search podcasts...')).toBeInTheDocument();
  });

  it('renders trending section header', () => {
    renderWithProviders(<PodcastPlayer />);
    expect(screen.getAllByText('Trending').length).toBeGreaterThan(0);
  });

  it('renders trending podcast cards', () => {
    renderWithProviders(<PodcastPlayer />);
    expect(screen.getByText('Test Podcast')).toBeInTheDocument();
    expect(screen.getByText('Another Podcast')).toBeInTheDocument();
  });

  it('displays podcast authors', () => {
    renderWithProviders(<PodcastPlayer />);
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('Another Author')).toBeInTheDocument();
  });

  it('renders subscribe buttons for each podcast', () => {
    renderWithProviders(<PodcastPlayer />);
    const subscribeButtons = screen.getAllByText('Subscribe');
    expect(subscribeButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders discover and subscribed tabs', () => {
    renderWithProviders(<PodcastPlayer />);
    // Tab bar with "Trending" (discover) and "My Subscriptions" tabs
    const trendingTabs = screen.getAllByText('Trending');
    expect(trendingTabs.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('My Subscriptions')).toBeInTheDocument();
  });

  it('switches to subscribed tab and shows empty state', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PodcastPlayer />);

    const subscribedTab = screen.getByText('My Subscriptions');
    await user.click(subscribedTab);

    expect(screen.getByText('No subscriptions yet.')).toBeInTheDocument();
  });

  it('uses string IDs for subscription management', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PodcastPlayer />);

    // Subscribe to a podcast
    const subscribeButtons = screen.getAllByText('Subscribe');
    await user.click(subscribeButtons[0]);

    // The button should change to Unsubscribe
    expect(screen.getAllByText('Unsubscribe').length).toBeGreaterThanOrEqual(1);
  });
});
