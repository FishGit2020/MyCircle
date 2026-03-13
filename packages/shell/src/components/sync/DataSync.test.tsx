import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import DataSync from './DataSync';

const mockSyncStockWatchlist = vi.fn();
const mockSyncPodcastSubscriptions = vi.fn();
const mockUpdateLastPlayed = vi.fn();
const mockUpdatePodcastPlayedEpisodes = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'u1' },
    syncStockWatchlist: mockSyncStockWatchlist,
    syncPodcastSubscriptions: mockSyncPodcastSubscriptions,
  }),
}));

vi.mock('../../lib/firebase', () => ({
  updateLastPlayed: (...args: unknown[]) => mockUpdateLastPlayed(...args),
  updatePodcastPlayedEpisodes: (...args: unknown[]) => mockUpdatePodcastPlayedEpisodes(...args),
}));

vi.mock('@mycircle/shared', () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  WindowEvents: {
    WATCHLIST_CHANGED: 'watchlist-changed',
    SUBSCRIPTIONS_CHANGED: 'subscriptions-changed',
    LAST_PLAYED_CHANGED: 'last-played-changed',
    PODCAST_PLAYED_CHANGED: 'podcast-played-changed',
  },
  StorageKeys: {
    STOCK_WATCHLIST: 'stock-tracker-watchlist',
    PODCAST_SUBSCRIPTIONS: 'podcast-subscriptions',
    PODCAST_LAST_PLAYED: 'podcast-last-played',
    PODCAST_PLAYED_EPISODES: 'podcast-played-episodes',
  },
}));

const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

beforeEach(() => {
  getItemSpy.mockReturnValue(null);
  vi.clearAllMocks();
});

afterEach(() => {
  getItemSpy.mockReset();
});

describe('DataSync', () => {
  it('renders nothing (returns null)', () => {
    const { container } = render(<DataSync />);
    expect(container.innerHTML).toBe('');
  });

  it('syncs watchlist on watchlist-changed event', () => {
    const watchlist = [{ symbol: 'AAPL', companyName: 'Apple' }];
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'stock-tracker-watchlist') return JSON.stringify(watchlist);
      return null;
    });
    render(<DataSync />);
    window.dispatchEvent(new Event('watchlist-changed'));
    expect(mockSyncStockWatchlist).toHaveBeenCalledWith(watchlist);
  });

  it('syncs podcast subscriptions on subscriptions-changed event', () => {
    const subs = [1, 2, 3];
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'podcast-subscriptions') return JSON.stringify(subs);
      return null;
    });
    render(<DataSync />);
    window.dispatchEvent(new Event('subscriptions-changed'));
    expect(mockSyncPodcastSubscriptions).toHaveBeenCalledWith(subs);
  });

  it('syncs last played on last-played-changed event', () => {
    const lastPlayed = { episode: { id: 1, title: 'ep' }, podcast: { id: 2 } };
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'podcast-last-played') return JSON.stringify(lastPlayed);
      return null;
    });
    render(<DataSync />);
    window.dispatchEvent(new Event('last-played-changed'));
    expect(mockUpdateLastPlayed).toHaveBeenCalledWith('u1', lastPlayed);
  });

  it('syncs played episodes on podcast-played-changed event', () => {
    const ids = ['ep1', 'ep2'];
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'podcast-played-episodes') return JSON.stringify(ids);
      return null;
    });
    render(<DataSync />);
    window.dispatchEvent(new Event('podcast-played-changed'));
    expect(mockUpdatePodcastPlayedEpisodes).toHaveBeenCalledWith('u1', ids);
  });

  it('does not sync when localStorage returns null (key removed)', () => {
    render(<DataSync />);
    window.dispatchEvent(new Event('watchlist-changed'));
    expect(mockSyncStockWatchlist).not.toHaveBeenCalled();
  });
});
