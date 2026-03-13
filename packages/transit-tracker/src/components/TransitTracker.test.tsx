import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransitTracker from './TransitTracker';

const mockNavigate = vi.fn();

vi.mock('react-router', () => ({
  useParams: () => ({}),
  useNavigate: () => mockNavigate,
}));

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  PageContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  StorageKeys: { TRANSIT_FAVORITES: 'transit-favorites' },
  WindowEvents: { TRANSIT_FAVORITES_CHANGED: 'transit-favorites-changed' },
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
  useQuery: vi.fn(() => ({ data: null, loading: false, error: null, refetch: vi.fn() })),
  useLazyQuery: vi.fn(() => [vi.fn(), { data: null, loading: false, error: null }]),
  GET_TRANSIT_ARRIVALS: {},
  GET_TRANSIT_STOP: {},
  GET_TRANSIT_NEARBY_STOPS: {},
}));

vi.mock('../hooks/useTransitArrivals', () => ({
  useTransitArrivals: () => ({
    arrivals: [],
    stop: null,
    loading: false,
    error: null,
    refresh: vi.fn(),
    lastUpdated: null,
  }),
}));

vi.mock('../hooks/useNearbyStops', () => ({
  useNearbyStops: () => ({
    stops: [],
    loading: false,
    error: null,
    findNearby: vi.fn(),
  }),
}));

describe('TransitTracker', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
  });

  it('renders the title and search form', () => {
    render(<TransitTracker />);
    expect(screen.getByText('transit.title')).toBeInTheDocument();
    expect(screen.getByText('transit.subtitle')).toBeInTheDocument();
  });

  it('renders the stop ID input', () => {
    render(<TransitTracker />);
    const input = screen.getByRole('textbox', { name: /transit\.stopIdPlaceholder/i });
    expect(input).toBeInTheDocument();
  });

  it('renders the find nearby button', () => {
    render(<TransitTracker />);
    expect(screen.getByRole('button', { name: /transit\.findNearby/i })).toBeInTheDocument();
  });

  it('selects a stop when form is submitted', () => {
    render(<TransitTracker />);
    const input = screen.getByRole('textbox', { name: /transit\.stopIdPlaceholder/i });
    fireEvent.change(input, { target: { value: '1_75403' } });
    fireEvent.submit(input.closest('form')!);
    // After selecting a stop, the back button should appear
    expect(screen.getByRole('button', { name: /transit\.back/i })).toBeInTheDocument();
    // Should navigate to stop URL
    expect(mockNavigate).toHaveBeenCalledWith('/transit/1_75403', { replace: true });
  });

  it('shows recent stops after selecting one and going back', () => {
    render(<TransitTracker />);
    const input = screen.getByRole('textbox', { name: /transit\.stopIdPlaceholder/i });
    fireEvent.change(input, { target: { value: '1_75403' } });
    fireEvent.submit(input.closest('form')!);

    // Go back
    fireEvent.click(screen.getByRole('button', { name: /transit\.back/i }));

    // Recent stops should show the ID
    expect(screen.getByText('1_75403')).toBeInTheDocument();
  });

  it('shows favorite toggle button when viewing a stop while logged in', () => {
    window.__currentUid = 'test-user-123';
    render(<TransitTracker />);
    const input = screen.getByRole('textbox', { name: /transit\.stopIdPlaceholder/i });
    fireEvent.change(input, { target: { value: '1_75403' } });
    fireEvent.submit(input.closest('form')!);
    // Favorite button should be present when logged in
    expect(screen.getByRole('button', { name: /transit\.favorite/i })).toBeInTheDocument();
    window.__currentUid = undefined;
  });

  it('hides favorite toggle button when not logged in', () => {
    window.__currentUid = undefined;
    render(<TransitTracker />);
    const input = screen.getByRole('textbox', { name: /transit\.stopIdPlaceholder/i });
    fireEvent.change(input, { target: { value: '1_75403' } });
    fireEvent.submit(input.closest('form')!);
    // Favorite button should NOT be present when not logged in
    expect(screen.queryByRole('button', { name: /transit\.favorite/i })).not.toBeInTheDocument();
  });
});
