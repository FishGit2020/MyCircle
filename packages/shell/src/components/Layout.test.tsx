import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Layout from './Layout';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { RemoteConfigProvider } from '../context/RemoteConfigContext';

// Mock the firebase lib so AuthProvider doesn't need real Firebase
vi.mock('../lib/firebase', () => ({
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

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <AuthProvider>
        <RemoteConfigProvider>
          <MemoryRouter>
            {ui}
          </MemoryRouter>
        </RemoteConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

describe('Layout', () => {
  it('renders header with app title', () => {
    renderWithRouter(<Layout />);

    expect(screen.getByText('MyCircle')).toBeInTheDocument();
  });

  it('renders navigation links for Home, Stocks, Podcasts, AI', () => {
    renderWithRouter(<Layout />);

    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Stocks').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Podcasts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('AI').length).toBeGreaterThan(0);
  });

  it('renders footer with OpenWeatherMap attribution', () => {
    renderWithRouter(<Layout />);

    expect(screen.getByText('OpenWeatherMap')).toBeInTheDocument();
  });

  it('renders footer with Finnhub and PodcastIndex attribution', () => {
    renderWithRouter(<Layout />);

    expect(screen.getByText('Finnhub')).toBeInTheDocument();
    expect(screen.getByText('PodcastIndex')).toBeInTheDocument();
  });

  it('renders footer with tech stack info', () => {
    renderWithRouter(<Layout />);

    expect(screen.getByText(/Built with React, Vite, and Micro Frontend Architecture/)).toBeInTheDocument();
  });

  it('header logo links to home', () => {
    renderWithRouter(<Layout />);

    const logoLink = screen.getByRole('link', { name: /MyCircle/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('OpenWeatherMap link opens in new tab', () => {
    renderWithRouter(<Layout />);

    const owmLink = screen.getByRole('link', { name: 'OpenWeatherMap' });
    expect(owmLink).toHaveAttribute('target', '_blank');
    expect(owmLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

});
