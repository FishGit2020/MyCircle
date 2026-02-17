import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Layout from './Layout';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import { RemoteConfigProvider } from '../../context/RemoteConfigContext';

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
  updateStockWatchlist: vi.fn(),
  updatePodcastSubscriptions: vi.fn(),
  updateUserBabyDueDate: vi.fn(),
  updateUserTempUnit: vi.fn(),
  updateUserSpeedUnit: vi.fn(),
  clearRecentCities: vi.fn(),
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

  it('renders Home link and nav group labels', () => {
    renderWithRouter(<Layout />);

    expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Faith')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
    expect(screen.getByText('Learning')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });

  it('clicking Daily opens dropdown with Weather, Stocks, Podcasts links', () => {
    renderWithRouter(<Layout />);

    // Dropdown menu should not exist initially
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    // Click the Daily group button
    fireEvent.click(screen.getByText('Daily'));

    // Dropdown should now be open
    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();

    // Check for items inside the dropdown
    expect(screen.getByRole('menuitem', { name: /Weather/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Stocks/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Podcasts/i })).toBeInTheDocument();
  });

  it('clicking outside closes dropdown', () => {
    renderWithRouter(<Layout />);

    // Open the Daily dropdown
    fireEvent.click(screen.getByText('Daily'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Click outside (on the document body)
    fireEvent.mouseDown(document.body);

    // Dropdown should be closed
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('Escape key closes dropdown', () => {
    renderWithRouter(<Layout />);

    // Open the Daily dropdown
    fireEvent.click(screen.getByText('Daily'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: 'Escape' });

    // Dropdown should be closed
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('only one dropdown can be open at a time', () => {
    renderWithRouter(<Layout />);

    // Open Daily
    fireEvent.click(screen.getByText('Daily'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Weather/i })).toBeInTheDocument();

    // Click Faith — should close Daily and open Faith
    fireEvent.click(screen.getByText('Faith'));
    const menus = screen.getAllByRole('menu');
    expect(menus).toHaveLength(1);
    expect(screen.getByRole('menuitem', { name: /Bible/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Weather/i })).not.toBeInTheDocument();
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

  it('renders search buttons for both desktop and mobile', () => {
    renderWithRouter(<Layout />);

    const searchButtons = screen.getAllByRole('button', { name: /search/i });
    // Desktop search button + mobile search button
    expect(searchButtons.length).toBeGreaterThanOrEqual(2);
  });

});
