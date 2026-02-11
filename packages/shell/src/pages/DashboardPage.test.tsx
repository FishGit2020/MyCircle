import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import DashboardPage from './DashboardPage';

// Mock @weather/shared useTranslation — identity function
vi.mock('@weather/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
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

  it('does not render recent searches when recentCities is empty', () => {
    renderDashboard();

    // The "Recent Searches" heading uses key 'dashboard.recentSearches'.
    // When recentCities is empty the section should not be rendered.
    expect(screen.queryByText('dashboard.recentSearches')).not.toBeInTheDocument();
  });
});
