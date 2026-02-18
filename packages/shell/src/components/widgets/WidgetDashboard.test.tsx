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
    ENGLISH_PROGRESS_CHANGED: 'english-progress-changed',
    CHINESE_PROGRESS_CHANGED: 'chinese-progress-changed',
    BABY_DUE_DATE_CHANGED: 'baby-due-date-changed',
    BIBLE_BOOKMARKS_CHANGED: 'bible-bookmarks-changed',
    WORSHIP_SONGS_CHANGED: 'worship-songs-changed',
  },
  StorageKeys: {
    STOCK_WATCHLIST: 'stock-tracker-watchlist',
    PODCAST_SUBSCRIPTIONS: 'podcast-subscriptions',
    WIDGET_LAYOUT: 'widget-dashboard-layout',
    WORSHIP_SONGS_CACHE: 'worship-songs-cache',
    WORSHIP_FAVORITES: 'worship-favorites',
    NOTEBOOK_CACHE: 'notebook-cache',
    BABY_DUE_DATE: 'baby-due-date',
    ENGLISH_LEARNING_PROGRESS: 'english-learning-progress',
    CHINESE_LEARNING_PROGRESS: 'chinese-learning-progress',
    CHILD_NAME: 'child-name',
    CHILD_BIRTH_DATE: 'child-birth-date',
    BIBLE_BOOKMARKS: 'bible-bookmarks',
  },
  MFEvents: {
    PODCAST_PLAY_EPISODE: 'mf:podcast-play-episode',
    PODCAST_CLOSE_PLAYER: 'mf:podcast-close-player',
  },
  subscribeToMFEvent: () => () => {},
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

  it('renders all default widgets', () => {
    renderWidget();
    expect(screen.getByText('widgets.weather')).toBeInTheDocument();
    expect(screen.getByText('widgets.stocks')).toBeInTheDocument();
    expect(screen.getByText('widgets.bible')).toBeInTheDocument();
    expect(screen.getByText('widgets.notebook')).toBeInTheDocument();
    expect(screen.getByText('widgets.babyTracker')).toBeInTheDocument();
    expect(screen.getByText('widgets.childDev')).toBeInTheDocument();
    expect(screen.getByText('widgets.english')).toBeInTheDocument();
    expect(screen.getByText('widgets.chinese')).toBeInTheDocument();
    expect(screen.getByText('widgets.worship')).toBeInTheDocument();
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
    // All 8 widgets should show "Visible" toggle (stocks removed)
    const visibleButtons = screen.getAllByText('widgets.visible');
    expect(visibleButtons.length).toBe(10);
  });

  it('can toggle widget visibility', () => {
    renderWidget();
    fireEvent.click(screen.getByText('widgets.customize'));
    const visibleButtons = screen.getAllByText('widgets.visible');
    fireEvent.click(visibleButtons[0]);
    // After toggling, one should now show "Hidden"
    expect(screen.getByText('widgets.hidden')).toBeInTheDocument();
  });

  it('shows move up/down buttons in editing mode', () => {
    renderWidget();
    fireEvent.click(screen.getByText('widgets.customize'));
    const upButtons = screen.getAllByLabelText('widgets.moveUp');
    const downButtons = screen.getAllByLabelText('widgets.moveDown');
    expect(upButtons.length).toBe(10);
    expect(downButtons.length).toBe(10);
  });

  it('persists layout to localStorage', () => {
    renderWidget();
    // Layout is saved on mount
    expect(setItemSpy).toHaveBeenCalledWith(
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
    // nowPlaying widget should be hidden
    expect(screen.getByText('widgets.hidden')).toBeInTheDocument();
  });

  it('resets layout when reset button is clicked', () => {
    renderWidget();
    fireEvent.click(screen.getByText('widgets.customize'));
    // Toggle first widget to hidden
    const visibleButtons = screen.getAllByText('widgets.visible');
    fireEvent.click(visibleButtons[0]);
    expect(screen.getByText('widgets.hidden')).toBeInTheDocument();
    // Click reset
    fireEvent.click(screen.getByText('widgets.reset'));
    // All should be visible again
    const allVisible = screen.getAllByText('widgets.visible');
    expect(allVisible.length).toBe(10);
  });

  it('renders worship widget with song count', () => {
    const songs = [{ id: '1', title: 'Amazing Grace' }, { id: '2', title: 'Holy Holy Holy' }];
    const favs = ['1'];
    getItemSpy.mockImplementation((key: string) => {
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
});
