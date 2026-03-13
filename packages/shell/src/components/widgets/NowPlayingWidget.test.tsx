import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NowPlayingWidget from './NowPlayingWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: {
    PODCAST_PLAYED_EPISODES: 'podcast_played_episodes',
    PODCAST_NOW_PLAYING: 'podcast_now_playing',
    PODCAST_LAST_PLAYED: 'podcast_last_played',
    PODCAST_PROGRESS: 'podcast_progress',
    PODCAST_SUBSCRIPTIONS: 'podcast_subscriptions',
  },
  WindowEvents: {
    SUBSCRIPTIONS_CHANGED: 'subscriptions-changed',
    LAST_PLAYED_CHANGED: 'last-played-changed',
  },
  subscribeToMFEvent: () => vi.fn(),
  MFEvents: {
    PODCAST_PLAY_EPISODE: 'podcast-play-episode',
    PODCAST_CLOSE_PLAYER: 'podcast-close-player',
  },
  eventBus: { publish: vi.fn() },
}));

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
}));

describe('NowPlayingWidget', () => {
  it('renders without crashing', () => {
    render(<NowPlayingWidget />);
    expect(screen.getByText('widgets.podcastsTitle')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<NowPlayingWidget />);
    expect(screen.getByText('widgets.discoverAndListen')).toBeInTheDocument();
  });

  it('shows discover podcasts when no subscriptions and no display', () => {
    render(<NowPlayingWidget />);
    expect(screen.getByText('widgets.discoverPodcasts')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<NowPlayingWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.podcastsTitle');
  });
});
