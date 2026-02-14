import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import DashboardPage from './DashboardPage';

// Mock @mycircle/shared — useTranslation (identity) + Apollo hooks for useDailyVerse + daily verse utils
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  // useDailyVerse calls useQuery(GET_BIBLE_VOTD) to fetch the verse of the day
  useQuery: () => ({ data: null, loading: false, error: null }),
  GET_BIBLE_VOTD: { kind: 'Document', definitions: [] },
  getAllDailyVerses: () => [{ text: 'Test verse', reference: 'Test 1:1' }],
  StorageKeys: {
    STOCK_WATCHLIST: 'stock-watchlist',
    PODCAST_SUBSCRIPTIONS: 'podcast-subscriptions',
    WORSHIP_SONGS_CACHE: 'worship-songs-cache',
  },
}));

// Mock useAuth — unauthenticated user with no cities
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    favoriteCities: [],
    recentCities: [],
  }),
}));

// Mock child components with simple placeholders
vi.mock('../components/WidgetDashboard', () => ({
  default: () => <div data-testid="widget-dashboard">WidgetDashboard</div>,
}));

vi.mock('../components/UseMyLocation', () => ({
  default: () => <div data-testid="use-my-location">UseMyLocation</div>,
}));

vi.mock('../components/CitySearchWrapper', () => ({
  default: () => <div data-testid="city-search-wrapper">CitySearchWrapper</div>,
}));

vi.mock('../components/FavoriteCities', () => ({
  default: () => <div data-testid="favorite-cities">FavoriteCities</div>,
}));

// Mock localStorage.getItem to return null (no watchlist, no subscriptions)
const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

afterEach(() => {
  getItemSpy.mockClear();
});

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );

describe('DashboardPage', () => {
  it('renders the welcome heading "Welcome to MyCircle"', () => {
    renderDashboard();

    // The translation mock returns the key itself: 'home.title'
    expect(screen.getByText('home.title')).toBeInTheDocument();
  });

  it('renders quick access cards (Weather, Stocks, Podcasts, AI Assistant)', () => {
    renderDashboard();

    // Translation keys for the four feature card titles
    expect(screen.getByText('dashboard.weather')).toBeInTheDocument();
    expect(screen.getByText('dashboard.stocks')).toBeInTheDocument();
    expect(screen.getByText('dashboard.podcasts')).toBeInTheDocument();
    expect(screen.getByText('dashboard.ai')).toBeInTheDocument();
  });

  it('renders the feature cards grid with correct responsive classes', () => {
    const { container } = renderDashboard();

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('sm:grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-6');
  });

  it('does not render recent searches when recentCities is empty', () => {
    renderDashboard();

    // The "Recent Searches" heading uses key 'dashboard.recentSearches'.
    // When recentCities is empty the section should not be rendered.
    expect(screen.queryByText('dashboard.recentSearches')).not.toBeInTheDocument();
  });
});
