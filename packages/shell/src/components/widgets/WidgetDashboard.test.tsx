import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import WidgetDashboard from './WidgetDashboard';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  useUnits: () => ({ tempUnit: 'C', speedUnit: 'ms', setTempUnit: vi.fn(), setSpeedUnit: vi.fn() }),
  formatTemperature: (temp: number, unit?: string) => unit === 'F' ? `${Math.round(temp * 9/5 + 32)}°F` : `${Math.round(temp)}°C`,
  StorageKeys: {
    STOCK_WATCHLIST: 'stock-tracker-watchlist',
    PODCAST_SUBSCRIPTIONS: 'podcast-subscriptions',
    WIDGET_LAYOUT: 'widget-dashboard-layout',
    WORSHIP_SONGS_CACHE: 'worship-songs-cache',
    NOTEBOOK_CACHE: 'notebook-cache',
    BABY_DUE_DATE: 'baby-due-date',
    BABY_COMPARE_CATEGORY: 'baby-compare-category',
    ENGLISH_LEARNING_PROGRESS: 'english-learning-progress',
    CHINESE_LEARNING_PROGRESS: 'chinese-learning-progress',
    CHILD_NAME: 'child-name',
    CHILD_BIRTH_DATE: 'child-birth-date',
  },
  MFEvents: {
    PODCAST_PLAY_EPISODE: 'mf:podcast-play-episode',
    PODCAST_CLOSE_PLAYER: 'mf:podcast-close-player',
  },
  subscribeToMFEvent: () => () => {},
  useQuery: () => ({ data: null, loading: false, error: null }),
  useLazyQuery: () => [vi.fn(), { data: null, loading: false }],
  GET_BIBLE_VOTD_API: { kind: 'Document', definitions: [] },
  GET_CURRENT_WEATHER: { kind: 'Document', definitions: [] },
  REVERSE_GEOCODE: { kind: 'Document', definitions: [] },
  getDailyVerse: () => ({ usfm: 'TST.1.1', reference: 'Test 1:1', text: 'Test verse text' }),
  getAllDailyVerses: () => [{ usfm: 'TST.1.1', reference: 'Test 1:1', text: 'Test verse text' }],
  NIV_COPYRIGHT: 'NIV Copyright',
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

  it('renders default widgets (podcast hidden without subscriptions)', () => {
    renderWidget();
    expect(screen.getByText('widgets.weather')).toBeInTheDocument();
    expect(screen.getByText('widgets.stocks')).toBeInTheDocument();
    expect(screen.getByText('widgets.verse')).toBeInTheDocument();
    expect(screen.getByText('widgets.notebook')).toBeInTheDocument();
    expect(screen.getByText('widgets.babyTracker')).toBeInTheDocument();
    expect(screen.getByText('widgets.childDev')).toBeInTheDocument();
    expect(screen.getByText('widgets.english')).toBeInTheDocument();
    expect(screen.getByText('widgets.chinese')).toBeInTheDocument();
    // Podcast widget hidden — no subscriptions and nothing playing
    expect(screen.queryByText('widgets.nowPlaying')).not.toBeInTheDocument();
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
    // All nine widgets should show "Visible" toggle
    const visibleButtons = screen.getAllByText('widgets.visible');
    expect(visibleButtons.length).toBe(9);
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
    expect(upButtons.length).toBe(9);
    expect(downButtons.length).toBe(9);
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
      { id: 'stocks', visible: false },
      { id: 'nowPlaying', visible: true },
    ]);
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'widget-dashboard-layout') return customLayout;
      return null;
    });
    renderWidget();
    // Enter editing mode to see hidden widget
    fireEvent.click(screen.getByText('widgets.customize'));
    // stocks widget should be hidden
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
    expect(allVisible.length).toBe(9);
  });

  it('has proper a11y labels on the section', () => {
    renderWidget();
    expect(screen.getByRole('region', { name: 'widgets.title' })).toBeInTheDocument();
  });
});
