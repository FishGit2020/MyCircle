import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import PodcastPlayer from './PodcastPlayer';
import { MFEvents, StorageKeys } from '@mycircle/shared';

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
    localStorage.clear();
    // Mock Firebase auth so the Subscriptions tab is visible
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
  });

  afterEach(() => {
    localStorage.clear();
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

  it('renders InlinePlaybackControls when now-playing matches viewed podcast', () => {
    const mockPodcast = {
      id: 1,
      title: 'Test Podcast',
      author: 'Test Author',
      artwork: 'https://example.com/art.jpg',
      description: 'A test podcast',
      feedUrl: 'https://example.com/feed.xml',
      episodeCount: 42,
      categories: {},
    };
    const mockEpisode = {
      id: 10,
      title: 'Now Playing Episode',
      description: 'desc',
      datePublished: 1700000000,
      duration: 1800,
      enclosureUrl: 'https://example.com/ep.mp3',
      enclosureType: 'audio/mpeg',
      image: '',
      feedId: 1,
    };

    // Set now-playing in localStorage matching the viewed podcast
    localStorage.setItem(
      StorageKeys.PODCAST_NOW_PLAYING,
      JSON.stringify({ episode: mockEpisode, podcast: mockPodcast }),
    );

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={[{ pathname: '/podcasts/1', state: { podcast: mockPodcast } }]}>
          <Routes>
            <Route path="/podcasts/:podcastId" element={<PodcastPlayer />} />
          </Routes>
        </MemoryRouter>
      </MockedProvider>
    );

    // InlinePlaybackControls renders a "Now Playing" region
    expect(screen.getByRole('region', { name: 'Now Playing' })).toBeInTheDocument();
    expect(screen.getByText('Now Playing Episode')).toBeInTheDocument();
  });

  it('does not render InlinePlaybackControls when now-playing is for a different podcast', () => {
    const mockPodcast = {
      id: 1,
      title: 'Test Podcast',
      author: 'Test Author',
      artwork: 'https://example.com/art.jpg',
      description: 'A test podcast',
      feedUrl: 'https://example.com/feed.xml',
      episodeCount: 42,
      categories: {},
    };
    const otherPodcast = {
      id: 999,
      title: 'Other Podcast',
      author: 'Other',
      artwork: '',
      description: '',
      feedUrl: '',
      episodeCount: 5,
      categories: {},
    };
    const mockEpisode = {
      id: 10,
      title: 'Other Episode',
      description: '',
      datePublished: 1700000000,
      duration: 600,
      enclosureUrl: 'https://example.com/other.mp3',
      enclosureType: 'audio/mpeg',
      image: '',
      feedId: 999,
    };

    // Now-playing is for podcast 999, but we're viewing podcast 1
    localStorage.setItem(
      StorageKeys.PODCAST_NOW_PLAYING,
      JSON.stringify({ episode: mockEpisode, podcast: otherPodcast }),
    );

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={[{ pathname: '/podcasts/1', state: { podcast: mockPodcast } }]}>
          <Routes>
            <Route path="/podcasts/:podcastId" element={<PodcastPlayer />} />
          </Routes>
        </MemoryRouter>
      </MockedProvider>
    );

    // Should not show inline controls
    expect(screen.queryByRole('region', { name: 'Now Playing' })).toBeNull();
  });

  it('shows InlinePlaybackControls when PODCAST_PLAY_EPISODE fires for current podcast', () => {
    const mockPodcast = {
      id: 1,
      title: 'Test Podcast',
      author: 'Test Author',
      artwork: 'https://example.com/art.jpg',
      description: 'A test podcast',
      feedUrl: 'https://example.com/feed.xml',
      episodeCount: 42,
      categories: {},
    };
    const mockEpisode = {
      id: 10,
      title: 'Live Episode',
      description: 'desc',
      datePublished: 1700000000,
      duration: 1200,
      enclosureUrl: 'https://example.com/live.mp3',
      enclosureType: 'audio/mpeg',
      image: '',
      feedId: 1,
    };

    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <MemoryRouter initialEntries={[{ pathname: '/podcasts/1', state: { podcast: mockPodcast } }]}>
          <Routes>
            <Route path="/podcasts/:podcastId" element={<PodcastPlayer />} />
          </Routes>
        </MemoryRouter>
      </MockedProvider>
    );

    // Initially no inline controls
    expect(screen.queryByRole('region', { name: 'Now Playing' })).toBeNull();

    // Fire play event
    act(() => {
      window.dispatchEvent(
        new CustomEvent(MFEvents.PODCAST_PLAY_EPISODE, {
          detail: { episode: mockEpisode, podcast: mockPodcast },
        }),
      );
    });

    expect(screen.getByRole('region', { name: 'Now Playing' })).toBeInTheDocument();
    expect(screen.getByText('Live Episode')).toBeInTheDocument();
  });
});
