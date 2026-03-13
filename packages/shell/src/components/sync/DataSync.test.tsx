import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import DataSync from './DataSync';

vi.mock('@mycircle/shared', () => ({
  WindowEvents: {
    WATCHLIST_CHANGED: 'watchlist-changed',
    SUBSCRIPTIONS_CHANGED: 'subscriptions-changed',
    LAST_PLAYED_CHANGED: 'last-played-changed',
    PODCAST_PLAYED_CHANGED: 'podcast-played-changed',
  },
  StorageKeys: {
    STOCK_WATCHLIST: 'stock_watchlist',
    PODCAST_SUBSCRIPTIONS: 'podcast_subscriptions',
    PODCAST_LAST_PLAYED: 'podcast_last_played',
    PODCAST_PLAYED_EPISODES: 'podcast_played_episodes',
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    syncStockWatchlist: vi.fn(),
    syncPodcastSubscriptions: vi.fn(),
  }),
}));

vi.mock('../../lib/firebase', () => ({
  updateLastPlayed: vi.fn(),
  updatePodcastPlayedEpisodes: vi.fn(),
}));

describe('DataSync', () => {
  it('renders nothing (returns null)', () => {
    const { container } = render(<DataSync />);
    expect(container.innerHTML).toBe('');
  });
});
