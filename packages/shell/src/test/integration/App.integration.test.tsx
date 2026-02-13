import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { MockedProvider } from '@apollo/client/testing/react';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import App from '../../App';

// Mock the remote modules
vi.mock('citySearch/CitySearch', () => ({
  default: () => <div data-testid="city-search-mfe">City Search Module</div>,
}));

vi.mock('weatherDisplay/WeatherDisplay', () => ({
  default: () => <div data-testid="weather-display-mfe">Weather Display Module</div>,
}));

// Mock the firebase lib so AuthProvider doesn't need real Firebase
vi.mock('../../lib/firebase', () => ({
  firebaseEnabled: false,
  app: null,
  auth: null,
  db: null,
  perf: null,
  analytics: null,
  identifyUser: vi.fn(),
  clearUserIdentity: vi.fn(),
  logEvent: vi.fn(),
  subscribeToAuthChanges: (cb: (user: null) => void) => { cb(null); return () => {}; },
  signInWithGoogle: vi.fn(),
  logOut: vi.fn(),
  getUserProfile: vi.fn().mockResolvedValue(null),
  updateUserDarkMode: vi.fn(),
  updateUserLocale: vi.fn(),
  addRecentCity: vi.fn(),
  removeRecentCity: vi.fn(),
  getRecentCities: vi.fn().mockResolvedValue([]),
  toggleFavoriteCity: vi.fn().mockResolvedValue(false),
}));

const renderApp = (initialRoute = '/') => {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <MockedProvider mocks={[]} addTypename={false}>
            <App />
          </MockedProvider>
        </MemoryRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

describe('App Integration', () => {
  describe('Home Page', () => {
    it('renders the home page by default', async () => {
      renderApp('/');

      expect(screen.getByText('MyCircle')).toBeInTheDocument();
      expect(screen.getByText('Welcome to MyCircle')).toBeInTheDocument();
    });

    it('renders feature cards including weather', async () => {
      renderApp('/');

      // Translation keys resolve to English: t('home.quickWeatherDesc') → 'Check forecasts for any city'
      expect(screen.getByText('Check forecasts for any city')).toBeInTheDocument();
      expect(screen.getByText('Read scripture daily')).toBeInTheDocument();
    });
  });

  describe('Weather Landing Page', () => {
    it('renders Use My Location button', async () => {
      renderApp('/weather');

      expect(screen.getByText('Use my current location')).toBeInTheDocument();
    });

    it('loads city search micro frontend', async () => {
      renderApp('/weather');

      await waitFor(() => {
        expect(screen.getByTestId('city-search-mfe')).toBeInTheDocument();
      });
    });
  });

  describe('Weather Page', () => {
    it('renders weather display on /weather/:coords route', async () => {
      renderApp('/weather/51.5074,-0.1278');

      await waitFor(() => {
        expect(screen.getByTestId('weather-display-mfe')).toBeInTheDocument();
      });
    });
  });

  describe('404 Page', () => {
    it('renders 404 for unknown routes', () => {
      renderApp('/unknown-route');

      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Page not found')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('renders header and footer on all pages', () => {
      renderApp('/');
      expect(screen.getByText('MyCircle')).toBeInTheDocument();
      expect(screen.getByText('OpenWeatherMap')).toBeInTheDocument();
    });
  });
});
