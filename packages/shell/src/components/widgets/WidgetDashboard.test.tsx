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
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
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

describe('WidgetDashboard', () => {
  it('renders the widgets title', () => {
    renderWidget();
    expect(screen.getByText('widgets.title')).toBeInTheDocument();
  });

  it('renders empty dashboard by default (all widgets hidden)', () => {
    renderWidget();
    // With default all-hidden layout, no widget tiles are shown in the grid
    // Customize button is always visible
    expect(screen.getByText('widgets.customize')).toBeInTheDocument();
    // No weather widget card in the grid
    expect(screen.queryByText('widgets.weather')).not.toBeInTheDocument();
  });

  it('renders customize button', () => {
    renderWidget();
    expect(screen.getByText('widgets.customize')).toBeInTheDocument();
  });

  it('enters editing mode when customize is clicked', () => {
    renderWidget();
    fireEvent.click(screen.getByText('widgets.customize'));
    // In editing mode, "Done" button replaces "Customize"
    expect(screen.getByText('widgets.done')).toBeInTheDocument();
    // Reset layout button appears
    expect(screen.getByText('widgets.reset')).toBeInTheDocument();
  });

  it('shows visibility toggles in editing mode', () => {
    renderWidget();
    fireEvent.click(screen.getByText('widgets.customize'));
    // All widgets default to hidden
    const hiddenButtons = screen.getAllByText('widgets.hidden');
    expect(hiddenButtons.length).toBe(18);
  });

  it('can toggle widget visibility', () => {
    renderWidget();
    fireEvent.click(screen.getByText('widgets.customize'));
    const hiddenButtons = screen.getAllByText('widgets.hidden');
    fireEvent.click(hiddenButtons[0]);
    // After toggling one from hidden, it should now show "Visible"
    expect(screen.getByText('widgets.visible')).toBeInTheDocument();
  });

  it('shows move up/down buttons in editing mode', () => {
    renderWidget();
    fireEvent.click(screen.getByText('widgets.customize'));
    const upButtons = screen.getAllByLabelText('widgets.moveUp');
    const downButtons = screen.getAllByLabelText('widgets.moveDown');
    expect(upButtons.length).toBe(18);
    expect(downButtons.length).toBe(18);
  });

  it('does not persist layout on initial mount (avoids Firestore write loop)', () => {
    renderWidget();
    // Layout should NOT be saved on initial mount — only after user-driven changes
    expect(setItemSpy).not.toHaveBeenCalledWith(
      'widget-dashboard-layout',
      expect.any(String)
    );
  });

  it('loads layout from localStorage', () => {
    const customLayout = JSON.stringify([
      { id: 'verse', visible: true },
      { id: 'weather', visible: true },
      { id: 'nowPlaying', visible: false },
    ]);
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'widget-dashboard-layout') return customLayout;
      return null;
    });
    renderWidget();
    // Enter editing mode to see hidden widget
    fireEvent.click(screen.getByText('widgets.customize'));
    // nowPlaying and other widgets should be hidden
    const hiddenToggles = screen.getAllByText('widgets.hidden');
    expect(hiddenToggles.length).toBeGreaterThan(0);
  });

  it('resets layout when reset button is clicked', () => {
    renderWidget();
    fireEvent.click(screen.getByText('widgets.customize'));
    // Toggle first widget from hidden to visible
    const hiddenButtons = screen.getAllByText('widgets.hidden');
    fireEvent.click(hiddenButtons[0]);
    expect(screen.getByText('widgets.visible')).toBeInTheDocument();
    // Click reset
    fireEvent.click(screen.getByText('widgets.reset'));
    // All should be hidden again (default)
    const allHidden = screen.getAllByText('widgets.hidden');
    expect(allHidden.length).toBe(18);
  });

  it('renders worship widget with song count', () => {
    const songs = [{ id: '1', title: 'Amazing Grace' }, { id: '2', title: 'Holy Holy Holy' }];
    const favs = ['1'];
    const layout = JSON.stringify([{ id: 'worship', visible: true }]);
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'widget-dashboard-layout') return layout;
      if (key === 'worship-songs-cache') return JSON.stringify(songs);
      if (key === 'worship-favorites') return JSON.stringify(favs);
      return null;
    });
    renderWidget();
    expect(screen.getByText('widgets.worship')).toBeInTheDocument();
  });

  it('has proper a11y labels on the section', () => {
    renderWidget();
    expect(screen.getByRole('region', { name: 'widgets.title' })).toBeInTheDocument();
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
    const layout = JSON.stringify([{ id: 'nowPlaying', visible: true }]);
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'widget-dashboard-layout') return layout;
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
    const layout = JSON.stringify([{ id: 'nowPlaying', visible: true }]);
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'widget-dashboard-layout') return layout;
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
    const layout = JSON.stringify([{ id: 'nowPlaying', visible: true }]);
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'widget-dashboard-layout') return layout;
      if (key === 'podcast-last-played') return JSON.stringify(lastPlayed);
      return null;
    });
    renderWidget();
    expect(screen.getByText('Restored Episode')).toBeInTheDocument();
    expect(screen.getByText('Restored Podcast')).toBeInTheDocument();
    expect(screen.getByText('widgets.continueListening')).toBeInTheDocument();
  });
});
