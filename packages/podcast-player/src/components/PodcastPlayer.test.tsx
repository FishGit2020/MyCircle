import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter, Routes, Route } from 'react-router';
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

const renderWithProviders = () => {
  return render(
    <MockedProvider mocks={[]} addTypename={false}>
      <MemoryRouter initialEntries={['/podcasts']}>
        <Routes>
          <Route path="/podcasts" element={<PodcastPlayer />} />
          <Route path="/podcasts/:podcastId" element={<PodcastPlayer />} />
        </Routes>
      </MemoryRouter>
    </MockedProvider>
  );
};

describe('PodcastPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Firebase auth so the Subscriptions tab is visible
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
  });

  it('renders the podcast player title', () => {
    renderWithProviders();
    expect(screen.getByText('Podcasts')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    renderWithProviders();
    expect(screen.getByPlaceholderText('Search podcasts...')).toBeInTheDocument();
  });

  it('renders trending section header', () => {
    renderWithProviders();
    expect(screen.getAllByText('Trending').length).toBeGreaterThan(0);
  });

  it('renders trending podcast cards', () => {
    renderWithProviders();
    expect(screen.getByText('Test Podcast')).toBeInTheDocument();
    expect(screen.getByText('Another Podcast')).toBeInTheDocument();
  });

  it('displays podcast authors', () => {
    renderWithProviders();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('Another Author')).toBeInTheDocument();
  });

  it('renders subscribe buttons for each podcast', () => {
    renderWithProviders();
    const subscribeButtons = screen.getAllByText('Subscribe');
    expect(subscribeButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('renders discover and subscribed tabs', async () => {
    renderWithProviders();
    // Tab bar with "Trending" (discover) and "My Subscriptions" tabs
    const trendingTabs = screen.getAllByText('Trending');
    expect(trendingTabs.length).toBeGreaterThanOrEqual(1);
    // Auth check is async — wait for subscriptions tab to appear
    expect(await screen.findByText('My Subscriptions')).toBeInTheDocument();
  });

  it('switches to subscribed tab and shows empty state', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    // Auth check is async — wait for the tab to appear
    const subscribedTab = await screen.findByText('My Subscriptions');
    await user.click(subscribedTab);

    expect(screen.getByText('No subscriptions yet.')).toBeInTheDocument();
  });

  it('uses string IDs for subscription management', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    // Subscribe to a podcast
    const subscribeButtons = screen.getAllByText('Subscribe');
    await user.click(subscribeButtons[0]);

    // The button should change to Unsubscribe
    expect(screen.getAllByText('Unsubscribe').length).toBeGreaterThanOrEqual(1);
  });
});
