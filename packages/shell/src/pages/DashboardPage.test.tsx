import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import DashboardPage from './DashboardPage';

// Mock @mycircle/shared — only useTranslation needed by DashboardPage now
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock useDailyVerse hook — returns API verse with text by default
const mockUseDailyVerse = vi.fn().mockReturnValue({
  verse: { text: 'Test verse from API', reference: 'Test 1:1 (NIV)', copyright: null },
  loading: false,
});
vi.mock('../hooks/useDailyVerse', () => ({
  useDailyVerse: () => mockUseDailyVerse(),
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
vi.mock('../components/widgets', () => ({
  WidgetDashboard: () => <div data-testid="widget-dashboard">WidgetDashboard</div>,
}));

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );

describe('DashboardPage', () => {
  it('renders the welcome heading', () => {
    renderDashboard();
    expect(screen.getByText('home.title')).toBeInTheDocument();
  });

  it('renders the widget dashboard', () => {
    renderDashboard();
    expect(screen.getByTestId('widget-dashboard')).toBeInTheDocument();
  });

  it('renders the daily verse from API', () => {
    renderDashboard();
    expect(screen.getByText(/Test verse from API/)).toBeInTheDocument();
    expect(screen.getByText(/Test 1:1/)).toBeInTheDocument();
  });

  it('renders reference-only fallback when API text is unavailable', () => {
    mockUseDailyVerse.mockReturnValueOnce({
      verse: { reference: 'Psalm 23:1 (NIV)' },
      loading: false,
    });
    renderDashboard();
    expect(screen.getByText(/Psalm 23:1/)).toBeInTheDocument();
    // No verse text should be rendered
    expect(screen.queryByText(/\u201c/)).not.toBeInTheDocument();
  });
});
