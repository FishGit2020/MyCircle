import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import WidgetDashboard from './WidgetDashboard';

vi.mock('../../lib/firebase', () => ({ logEvent: vi.fn() }));

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  WindowEvents: {
    WATCHLIST_CHANGED: 'watchlist-changed',
    SUBSCRIPTIONS_CHANGED: 'subscriptions-changed',
    NOTEBOOK_CHANGED: 'notebook-changed',
    CHILD_DATA_CHANGED: 'child-data-changed',
    BABY_DUE_DATE_CHANGED: 'baby-due-date-changed',
    BIBLE_BOOKMARKS_CHANGED: 'bible-bookmarks-changed',
    WORSHIP_SONGS_CHANGED: 'worship-songs-changed',
    LAST_PLAYED_CHANGED: 'last-played-changed',
    BOOK_LAST_PLAYED_CHANGED: 'book-last-played-changed',
    BOOK_BOOKMARKS_CHANGED: 'book-bookmarks-changed',
    WIDGET_LAYOUT_CHANGED: 'widget-layout-changed',
  },
  StorageKeys: {
    STOCK_WATCHLIST: 'stock-tracker-watchlist',
    PODCAST_SUBSCRIPTIONS: 'podcast-subscriptions',
    PODCAST_NOW_PLAYING: 'podcast-now-playing',
    PODCAST_LAST_PLAYED: 'podcast-last-played',
    PODCAST_PLAYED_EPISODES: 'podcast-played-episodes',
    WIDGET_LAYOUT: 'widget-dashboard-layout',
    WORSHIP_SONGS_CACHE: 'worship-songs-cache',
    WORSHIP_FAVORITES: 'worship-favorites',
    NOTEBOOK_CACHE: 'notebook-cache',
    BABY_DUE_DATE: 'baby-due-date',
    CHILD_NAME: 'child-name',
    CHILD_BIRTH_DATE: 'child-birth-date',
    BIBLE_BOOKMARKS: 'bible-bookmarks',
    FLASHCARD_PROGRESS: 'flashcard-progress',
    DAILY_LOG_CACHE: 'daily-log-cache',
    BOOK_LAST_PLAYED: 'book-last-played',
    BOOK_AUDIO_PROGRESS: 'book-audio-progress',
    BOOK_BOOKMARKS: 'book-bookmarks',
  },
  MFEvents: {
    PODCAST_PLAY_EPISODE: 'mf:podcast-play-episode',
    PODCAST_CLOSE_PLAYER: 'mf:podcast-close-player',
    AUDIO_PLAY: 'mf:audio-play',
    AUDIO_CLOSE: 'mf:audio-close',
  },
  subscribeToMFEvent: () => () => {},
  eventBus: { publish: vi.fn(), subscribe: vi.fn(() => () => {}) },
  useQuery: () => ({ data: undefined, loading: false }),
  GET_WORSHIP_SONGS_LIST: {},
  WORSHIP_FAVORITES_CHANGED: 'worship-favorites-changed',
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    favoriteCities: [],
    recentCities: [],
  }),
}));

const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

beforeEach(() => {
  getItemSpy.mockReturnValue(null);
  setItemSpy.mockClear();
});

const renderWidget = () =>
  render(
    <MemoryRouter>
      <WidgetDashboard />
    </MemoryRouter>
  );

// Renders with at least one widget visible so the section is not hidden
const renderWidgetWithPinned = () => {
  getItemSpy.mockImplementation((key: string) => {
    if (key === 'widget-dashboard-layout') return JSON.stringify({ pinned: ['weather'], size: 'comfortable' });
    return null;
  });
  return render(<MemoryRouter><WidgetDashboard /></MemoryRouter>);
};

describe('WidgetDashboard', () => {
  it('renders the widgets title', () => {
    renderWidgetWithPinned();
    expect(screen.getByText('widgets.title')).toBeInTheDocument();
  });

  it('renders nothing when no widgets are pinned', () => {
    const { container } = renderWidget();
    expect(container.querySelector('section')).toBeNull();
  });

  it('has proper a11y labels on the section', () => {
    renderWidgetWithPinned();
    expect(screen.getByRole('region', { name: 'widgets.title' })).toBeInTheDocument();
  });

  it('renders Comfortable/Tight size toggle buttons', () => {
    renderWidgetWithPinned();
    expect(screen.getByRole('button', { name: 'widgets.sizeComfortable' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'widgets.sizeTight' })).toBeInTheDocument();
  });

  it('does not persist layout on initial mount', () => {
    renderWidget();
    expect(setItemSpy).not.toHaveBeenCalledWith(
      'widget-dashboard-layout',
      expect.any(String)
    );
  });

  it('renders worship widget with song count', () => {
    const songs = [{ id: '1', title: 'Amazing Grace' }, { id: '2', title: 'Holy Holy Holy' }];
    const favs = ['1'];
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'widget-dashboard-layout') return JSON.stringify({ pinned: ['worship'], size: 'comfortable' });
      if (key === 'worship-songs-cache') return JSON.stringify(songs);
      if (key === 'worship-favorites') return JSON.stringify(favs);
      return null;
    });
    renderWidget();
    expect(screen.getByText('widgets.worship')).toBeInTheDocument();
  });

  it('hydrates NowPlayingWidget from persisted localStorage', () => {
    const nowPlaying = {
      episode: {
        id: 42,
        title: 'Persisted Episode',
        description: 'Stored in localStorage',
        datePublished: 1700000000,
        duration: 1800,
        enclosureUrl: 'https://example.com/ep.mp3',
        enclosureType: 'audio/mpeg',
        image: '',
        feedId: 10,
      },
      podcast: { id: 10, title: 'Persisted Podcast', author: '', artwork: '', description: '', feedUrl: '', episodeCount: 1, categories: {} },
    };
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'widget-dashboard-layout') return JSON.stringify({ pinned: ['nowPlaying'], size: 'comfortable' });
      if (key === 'podcast-now-playing') return JSON.stringify(nowPlaying);
      return null;
    });
    renderWidget();
    expect(screen.getByText('Persisted Episode')).toBeInTheDocument();
    expect(screen.getByText('Persisted Podcast')).toBeInTheDocument();
  });

  it('shows Continue button when podcast data is available', () => {
    const nowPlaying = {
      episode: {
        id: 42,
        title: 'Persisted Episode',
        description: '',
        datePublished: 1700000000,
        duration: 1800,
        enclosureUrl: 'https://example.com/ep.mp3',
        enclosureType: 'audio/mpeg',
        image: '',
        feedId: 10,
      },
      podcast: { id: 10, title: 'Persisted Podcast', author: '', artwork: '', description: '', feedUrl: '', episodeCount: 1, categories: {} },
    };
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'widget-dashboard-layout') return JSON.stringify({ pinned: ['nowPlaying'], size: 'comfortable' });
      if (key === 'podcast-now-playing') return JSON.stringify(nowPlaying);
      return null;
    });
    renderWidget();
    expect(screen.getByText('widgets.continueListening')).toBeInTheDocument();
  });

  it('hydrates from PODCAST_LAST_PLAYED when PODCAST_NOW_PLAYING is absent', () => {
    const lastPlayed = {
      episode: { id: 99, title: 'Restored Episode', enclosureUrl: 'https://example.com/ep.mp3', image: '' },
      podcast: { id: 20, title: 'Restored Podcast', artwork: '' },
      position: 120,
      savedAt: Date.now(),
    };
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'widget-dashboard-layout') return JSON.stringify({ pinned: ['nowPlaying'], size: 'comfortable' });
      if (key === 'podcast-last-played') return JSON.stringify(lastPlayed);
      return null;
    });
    renderWidget();
    expect(screen.getByText('Restored Episode')).toBeInTheDocument();
    expect(screen.getByText('Restored Podcast')).toBeInTheDocument();
    expect(screen.getByText('widgets.continueListening')).toBeInTheDocument();
  });

  it('size toggle calls saveWidgetLayout with new size', () => {
    renderWidgetWithPinned();
    fireEvent.click(screen.getByRole('button', { name: 'widgets.sizeTight' }));
    expect(setItemSpy).toHaveBeenCalledWith(
      'widget-dashboard-layout',
      expect.stringContaining('"size":"tight"')
    );
  });
});
