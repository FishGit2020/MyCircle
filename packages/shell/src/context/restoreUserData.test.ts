import { describe, it, expect, vi, beforeEach } from 'vitest';
import { restoreUserData } from './restoreUserData';

vi.mock('@mycircle/shared', () => ({
  WindowEvents: {
    UNITS_CHANGED: 'units-changed',
    WATCHLIST_CHANGED: 'watchlist-changed',
    SUBSCRIPTIONS_CHANGED: 'subscriptions-changed',
    BABY_DUE_DATE_CHANGED: 'baby-due-date-changed',
    BOTTOM_NAV_ORDER_CHANGED: 'bottom-nav-order-changed',
    BIBLE_BOOKMARKS_CHANGED: 'bible-bookmarks-changed',
    WORSHIP_FAVORITES_CHANGED: 'worship-favorites-changed',
    LAST_PLAYED_CHANGED: 'last-played-changed',
    PODCAST_PLAYED_CHANGED: 'podcast-played-changed',
    CHILD_DATA_CHANGED: 'child-data-changed',
    WIDGET_LAYOUT_CHANGED: 'widget-layout-changed',
    BOOK_BOOKMARKS_CHANGED: 'book-bookmarks-changed',
    BOOK_LAST_PLAYED_CHANGED: 'book-last-played-changed',
    NOTEBOOK_CHANGED: 'notebook-changed',
    DAILY_LOG_CHANGED: 'daily-log-changed',
    CLOUD_FILES_CHANGED: 'cloud-files-changed',
    WORSHIP_SONGS_CHANGED: 'worship-songs-changed',
    BENCHMARK_CHANGED: 'benchmark-changed',
    CHILDREN_CHANGED: 'children-changed',
  },
  StorageKeys: {
    TEMP_UNIT: 'tempUnit',
    SPEED_UNIT: 'speedUnit',
    STOCK_WATCHLIST: 'stock-tracker-watchlist',
    PODCAST_SUBSCRIPTIONS: 'podcast-subscriptions',
    BABY_DUE_DATE: 'baby-due-date',
    BOTTOM_NAV_ORDER: 'bottom-nav-order',
    BIBLE_BOOKMARKS: 'bible-bookmarks',
    WORSHIP_FAVORITES: 'worship-favorites',
    PODCAST_LAST_PLAYED: 'podcast-last-played',
    PODCAST_NOW_PLAYING: 'podcast-now-playing',
    PODCAST_PROGRESS: 'podcast-progress',
    PODCAST_PLAYED_EPISODES: 'podcast-played-episodes',
    CHILD_NAME: 'child-name',
    CHILD_BIRTH_DATE: 'child-birth-date',
    WIDGET_LAYOUT: 'widget-dashboard-layout',
    BOOK_BOOKMARKS: 'book-bookmarks',
    BOOK_AUDIO_PROGRESS: 'book-audio-progress',
    BOOK_LAST_PLAYED: 'book-last-played',
    DAILY_LOG_CACHE: 'daily-log-cache',
    CLOUD_FILES_CACHE: 'cloud-files-cache',
    WORSHIP_SONGS_CACHE: 'worship-songs-cache',
    BENCHMARK_CACHE: 'benchmark-cache',
    CHILDREN_CACHE: 'children-cache',
  },
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const mockGetDailyLogEntries = vi.fn().mockResolvedValue([]);
const mockGetUserFiles = vi.fn().mockResolvedValue([]);
const mockGetWorshipSongs = vi.fn().mockResolvedValue([]);
const mockGetBenchmarkSummary = vi.fn().mockResolvedValue(null);
const mockMigrateToMultiChild = vi.fn().mockResolvedValue(undefined);
const mockGetChildren = vi.fn().mockResolvedValue([]);

vi.mock('../lib/firebase', () => ({
  getDailyLogEntries: (...args: unknown[]) => mockGetDailyLogEntries(...args),
  getUserFiles: (...args: unknown[]) => mockGetUserFiles(...args),
  getWorshipSongs: (...args: unknown[]) => mockGetWorshipSongs(...args),
  getBenchmarkSummary: (...args: unknown[]) => mockGetBenchmarkSummary(...args),
  migrateToMultiChild: (...args: unknown[]) => mockMigrateToMultiChild(...args),
  getChildren: (...args: unknown[]) => mockGetChildren(...args),
}));

const makeProfile = (overrides = {}) => ({
  uid: 'user1',
  email: 'test@example.com',
  displayName: 'Test',
  photoURL: null,
  darkMode: false,
  recentCities: [],
  favoriteCities: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('restoreUserData', () => {
  it('returns empty cities when profile has none', () => {
    const result = restoreUserData(makeProfile() as any, 'user1');
    expect(result.recentCities).toEqual([]);
    expect(result.favoriteCities).toEqual([]);
  });

  it('returns cities from profile', () => {
    const cities = [{ id: '1', name: 'NYC', country: 'US', lat: 40, lon: -74, searchedAt: new Date() }];
    const favs = [{ id: '2', name: 'LA', country: 'US', lat: 34, lon: -118 }];
    const result = restoreUserData(makeProfile({ recentCities: cities, favoriteCities: favs }) as any, 'user1');
    expect(result.recentCities).toEqual(cities);
    expect(result.favoriteCities).toEqual(favs);
  });

  it('restores tempUnit to localStorage and dispatches event', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    restoreUserData(makeProfile({ tempUnit: 'F' }) as any, 'user1');
    expect(localStorage.getItem('tempUnit')).toBe('F');
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'units-changed' }));
  });

  it('restores speedUnit to localStorage', () => {
    restoreUserData(makeProfile({ speedUnit: 'mph' }) as any, 'user1');
    expect(localStorage.getItem('speedUnit')).toBe('mph');
  });

  it('restores stock watchlist to localStorage', () => {
    const watchlist = [{ symbol: 'AAPL', name: 'Apple' }];
    restoreUserData(makeProfile({ stockWatchlist: watchlist }) as any, 'user1');
    expect(JSON.parse(localStorage.getItem('stock-tracker-watchlist')!)).toEqual(watchlist);
  });

  it('skips empty stock watchlist', () => {
    restoreUserData(makeProfile({ stockWatchlist: [] }) as any, 'user1');
    expect(localStorage.getItem('stock-tracker-watchlist')).toBeNull();
  });

  it('restores podcast subscriptions', () => {
    const subs = ['pod1', 'pod2'];
    restoreUserData(makeProfile({ podcastSubscriptions: subs }) as any, 'user1');
    expect(JSON.parse(localStorage.getItem('podcast-subscriptions')!)).toEqual(subs);
  });

  it('restores baby due date', () => {
    restoreUserData(makeProfile({ babyDueDate: '2026-06-01' }) as any, 'user1');
    expect(localStorage.getItem('baby-due-date')).toBe('2026-06-01');
  });

  it('restores bottom nav order', () => {
    const order = ['weather', 'stocks'];
    restoreUserData(makeProfile({ bottomNavOrder: order }) as any, 'user1');
    expect(JSON.parse(localStorage.getItem('bottom-nav-order')!)).toEqual(order);
  });

  it('restores Bible bookmarks', () => {
    const bookmarks = [{ book: 'Gen', chapter: 1, label: 'Test', timestamp: 1000 }];
    restoreUserData(makeProfile({ bibleBookmarks: bookmarks }) as any, 'user1');
    expect(JSON.parse(localStorage.getItem('bible-bookmarks')!)).toEqual(bookmarks);
  });

  it('restores worship favorites', () => {
    const favs = ['song1', 'song2'];
    restoreUserData(makeProfile({ worshipFavorites: favs }) as any, 'user1');
    expect(JSON.parse(localStorage.getItem('worship-favorites')!)).toEqual(favs);
  });

  it('restores last-played podcast and merges progress', () => {
    const lastPlayed = {
      episode: { id: 'ep1', title: 'Test' },
      podcast: { id: 'pod1' },
      position: 120,
    };
    restoreUserData(makeProfile({ lastPlayed }) as any, 'user1');
    expect(JSON.parse(localStorage.getItem('podcast-last-played')!)).toEqual(lastPlayed);
    expect(JSON.parse(localStorage.getItem('podcast-now-playing')!)).toEqual({
      episode: lastPlayed.episode,
      podcast: lastPlayed.podcast,
    });
    const progress = JSON.parse(localStorage.getItem('podcast-progress')!);
    expect(progress['ep1']).toEqual({ position: 120, duration: 0 });
  });

  it('does not overwrite progress when existing position is further', () => {
    localStorage.setItem('podcast-progress', JSON.stringify({ ep1: { position: 200, duration: 300 } }));
    const lastPlayed = {
      episode: { id: 'ep1', title: 'Test' },
      podcast: { id: 'pod1' },
      position: 120,
    };
    restoreUserData(makeProfile({ lastPlayed }) as any, 'user1');
    const progress = JSON.parse(localStorage.getItem('podcast-progress')!);
    expect(progress['ep1'].position).toBe(200);
  });

  it('merges podcast played episodes with local', () => {
    localStorage.setItem('podcast-played-episodes', JSON.stringify(['ep1']));
    restoreUserData(makeProfile({ podcastPlayedEpisodes: ['ep2', 'ep1'] }) as any, 'user1');
    const merged = JSON.parse(localStorage.getItem('podcast-played-episodes')!);
    expect(merged).toContain('ep1');
    expect(merged).toContain('ep2');
    expect(merged).toHaveLength(2);
  });

  it('restores child name and encoded birth date', () => {
    restoreUserData(makeProfile({ childName: 'Alice', childBirthDate: '2024-01-15' }) as any, 'user1');
    expect(localStorage.getItem('child-name')).toBe('Alice');
    expect(atob(localStorage.getItem('child-birth-date')!)).toBe('2024-01-15');
  });

  it('decodes legacy btoa-encoded birth dates', () => {
    const encoded = btoa('2024-01-15');
    restoreUserData(makeProfile({ childBirthDate: encoded }) as any, 'user1');
    expect(atob(localStorage.getItem('child-birth-date')!)).toBe('2024-01-15');
  });

  it('restores widget layout only when local is empty', () => {
    const layout = { pinned: ['weather', 'stocks'], size: 'large' };
    restoreUserData(makeProfile({ widgetLayout: layout }) as any, 'user1');
    const stored = JSON.parse(localStorage.getItem('widget-dashboard-layout')!);
    expect(stored.pinned).toEqual(['weather', 'stocks']);
    expect(stored.size).toBe('large');
  });

  it('overwrites local widget layout with Firestore data on sign-in', () => {
    localStorage.setItem('widget-dashboard-layout', JSON.stringify({ pinned: ['stocks'], size: 'comfortable' }));
    restoreUserData(makeProfile({ widgetLayout: { pinned: ['weather'], size: 'comfortable' } }) as any, 'user1');
    const stored = JSON.parse(localStorage.getItem('widget-dashboard-layout')!);
    expect(stored.pinned).toEqual(['weather']);
  });

  it('ignores old array-format widget layout from Firestore', () => {
    const oldLayout = [{ id: 'weather', visible: true }];
    restoreUserData(makeProfile({ widgetLayout: oldLayout }) as any, 'user1');
    expect(localStorage.getItem('widget-dashboard-layout')).toBeNull();
  });

  it('restores book bookmarks', () => {
    const bookmarks = [{ bookId: 'b1', bookTitle: 'Test', cfi: 'c1', label: 'L1', createdAt: 1000 }];
    restoreUserData(makeProfile({ bookBookmarks: bookmarks }) as any, 'user1');
    expect(JSON.parse(localStorage.getItem('book-bookmarks')!)).toEqual(bookmarks);
  });

  it('restores book audio progress', () => {
    const progress = { b1: { position: 10, duration: 100, chapter: 1 } };
    restoreUserData(makeProfile({ bookAudioProgress: progress }) as any, 'user1');
    expect(JSON.parse(localStorage.getItem('book-audio-progress')!)).toEqual(progress);
  });

  it('restores book last played', () => {
    const bookLastPlayed = { bookId: 'b1', title: 'Test', position: 50 };
    restoreUserData(makeProfile({ bookLastPlayed }) as any, 'user1');
    expect(JSON.parse(localStorage.getItem('book-last-played')!)).toEqual(bookLastPlayed);
  });

  it('always dispatches NOTEBOOK_CHANGED', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    restoreUserData(makeProfile() as any, 'user1');
    const events = dispatchSpy.mock.calls.map(c => (c[0] as Event).type);
    expect(events).toContain('notebook-changed');
  });

  it('fires subcollection fetches', () => {
    restoreUserData(makeProfile() as any, 'user1');
    expect(mockGetDailyLogEntries).toHaveBeenCalledWith('user1');
    expect(mockGetUserFiles).toHaveBeenCalledWith('user1');
    expect(mockGetWorshipSongs).toHaveBeenCalled();
    expect(mockGetBenchmarkSummary).toHaveBeenCalledWith('user1');
  });

  it('stores daily log cache when entries returned', async () => {
    const entries = [{ id: '1', date: '2026-01-01' }];
    mockGetDailyLogEntries.mockResolvedValue(entries);
    restoreUserData(makeProfile() as any, 'user1');
    await vi.waitFor(() => {
      expect(JSON.parse(localStorage.getItem('daily-log-cache')!)).toEqual(entries);
    });
  });
});
