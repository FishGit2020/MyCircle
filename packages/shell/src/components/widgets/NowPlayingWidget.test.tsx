import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NowPlayingWidget from './NowPlayingWidget';

const { mockNavigate, mockPublish } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockPublish: vi.fn(),
}));

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  StorageKeys: {
    PODCAST_NOW_PLAYING: 'podcast-now-playing',
    PODCAST_LAST_PLAYED: 'podcast-last-played',
    PODCAST_SUBSCRIPTIONS: 'podcast-subscriptions',
    PODCAST_PLAYED_EPISODES: 'podcast-played-episodes',
    PODCAST_PROGRESS: 'podcast-progress',
  },
  WindowEvents: {
    SUBSCRIPTIONS_CHANGED: 'subscriptions-changed',
    LAST_PLAYED_CHANGED: 'last-played-changed',
  },
  MFEvents: {
    PODCAST_PLAY_EPISODE: 'mf:podcast-play-episode',
    PODCAST_CLOSE_PLAYER: 'mf:podcast-close-player',
  },
  subscribeToMFEvent: () => () => {},
  eventBus: { publish: mockPublish },
}));

const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

beforeEach(() => {
  getItemSpy.mockReturnValue(null);
  mockNavigate.mockClear();
  mockPublish.mockClear();
});

const nowPlayingData = {
  episode: { id: 42, title: 'Test Episode', image: 'https://img.png', feedId: 10 },
  podcast: { id: 10, title: 'Test Podcast', artwork: 'https://art.png' },
};

describe('NowPlayingWidget', () => {
  it('renders podcast title when no display data', () => {
    render(<NowPlayingWidget />);
    expect(screen.getByText('widgets.podcastsTitle')).toBeInTheDocument();
  });

  it('shows discover podcasts message when no subscriptions and no display', () => {
    render(<NowPlayingWidget />);
    expect(screen.getByText('widgets.discoverPodcasts')).toBeInTheDocument();
  });

  it('shows nothing playing when subscriptions exist but no display', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'podcast-subscriptions') return JSON.stringify([1, 2]);
      return null;
    });
    render(<NowPlayingWidget />);
    expect(screen.getByText('widgets.nothingPlaying')).toBeInTheDocument();
  });

  it('renders episode info from now-playing localStorage', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'podcast-now-playing') return JSON.stringify(nowPlayingData);
      return null;
    });
    render(<NowPlayingWidget />);
    expect(screen.getByText('Test Episode')).toBeInTheDocument();
    expect(screen.getByText('Test Podcast')).toBeInTheDocument();
  });

  it('shows continue listening button when display data exists', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'podcast-now-playing') return JSON.stringify(nowPlayingData);
      return null;
    });
    render(<NowPlayingWidget />);
    expect(screen.getByText('widgets.continueListening')).toBeInTheDocument();
  });

  it('navigates on continue click', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'podcast-now-playing') return JSON.stringify(nowPlayingData);
      return null;
    });
    render(<NowPlayingWidget />);
    fireEvent.click(screen.getByText('widgets.continueListening'));
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/podcasts/10'));
  });

  it('falls back to last-played when now-playing is absent', () => {
    const lastPlayed = {
      episode: { id: 99, title: 'Restored Episode', image: '' },
      podcast: { id: 20, title: 'Restored Podcast', artwork: '' },
      position: 120,
      savedAt: Date.now(),
    };
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'podcast-last-played') return JSON.stringify(lastPlayed);
      return null;
    });
    render(<NowPlayingWidget />);
    expect(screen.getByText('Restored Episode')).toBeInTheDocument();
  });

  it('renders artwork image when available', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'podcast-now-playing') return JSON.stringify(nowPlayingData);
      return null;
    });
    const { container } = render(<NowPlayingWidget />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', 'https://img.png');
  });

  it('shows progress bar when progress data exists', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'podcast-now-playing') return JSON.stringify(nowPlayingData);
      if (key === 'podcast-progress') return JSON.stringify({ '42': { position: 300, duration: 600 } });
      return null;
    });
    const { container } = render(<NowPlayingWidget />);
    const progressBar = container.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
  });
});
