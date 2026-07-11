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

let arrivalsHookState: {
  arrivals: unknown[];
  stop: unknown;
  loading: boolean;
  error: string | null;
  refreshError: string | null;
  refresh: ReturnType<typeof vi.fn>;
  lastUpdated: number | null;
} = {
  arrivals: [],
  stop: null,
  loading: false,
  error: null,
  refreshError: null,
  refresh: vi.fn(),
  lastUpdated: null,
};

vi.mock('../hooks/useTransitArrivals', () => ({
  useTransitArrivals: () => arrivalsHookState,
}));

vi.mock('../hooks/useNearbyStops', () => ({
  useNearbyStops: () => ({
    stops: [],
    loading: false,
    error: null,
    permission: 'unknown',
    findNearby: vi.fn(),
  }),
}));

describe('TransitTracker', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    arrivalsHookState = {
      arrivals: [],
      stop: null,
      loading: false,
      error: null,
      refreshError: null,
      refresh: vi.fn(),
      lastUpdated: null,
    };
  });

  it('renders the title and search form', () => {
    render(<TransitTracker />);
    expect(screen.getByText('transit.title')).toBeInTheDocument();
    expect(screen.getByText('transit.subtitle')).toBeInTheDocument();
  });

  it('renders the stop ID input', () => {
    render(<TransitTracker />);
    const input = screen.getByRole('textbox', { name: /transit\.stopSearchPlaceholder/i });
    expect(input).toBeInTheDocument();
  });

  it('renders the find nearby button', () => {
    render(<TransitTracker />);
    expect(screen.getByRole('button', { name: /transit\.findNearby/i })).toBeInTheDocument();
  });

  it('selects a stop when form is submitted', () => {
    render(<TransitTracker />);
    const input = screen.getByRole('textbox', { name: /transit\.stopSearchPlaceholder/i });
    fireEvent.change(input, { target: { value: '1_75403' } });
    fireEvent.submit(input.closest('form')!);
    // After selecting a stop, the back button should appear
    expect(screen.getByRole('button', { name: /transit\.back/i })).toBeInTheDocument();
    // Should navigate to stop URL
    expect(mockNavigate).toHaveBeenCalledWith('/transit/1_75403', { replace: true });
  });

  it('shows recent stops after selecting one and going back', () => {
    render(<TransitTracker />);
    const input = screen.getByRole('textbox', { name: /transit\.stopSearchPlaceholder/i });
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
    const input = screen.getByRole('textbox', { name: /transit\.stopSearchPlaceholder/i });
    fireEvent.change(input, { target: { value: '1_75403' } });
    fireEvent.submit(input.closest('form')!);
    // Favorite button should be present when logged in
    expect(screen.getByRole('button', { name: /transit\.favorite/i })).toBeInTheDocument();
    window.__currentUid = undefined;
  });

  it('hides favorite toggle button when not logged in', () => {
    window.__currentUid = undefined;
    render(<TransitTracker />);
    const input = screen.getByRole('textbox', { name: /transit\.stopSearchPlaceholder/i });
    fireEvent.change(input, { target: { value: '1_75403' } });
    fireEvent.submit(input.closest('form')!);
    // Favorite button should NOT be present when not logged in
    expect(screen.queryByRole('button', { name: /transit\.favorite/i })).not.toBeInTheDocument();
  });

  it('persists a recent-stops entry in V1 cache shape on stop selection', () => {
    render(<TransitTracker />);
    const input = screen.getByRole('textbox', { name: /transit\.stopSearchPlaceholder/i });
    fireEvent.change(input, { target: { value: '1_75403' } });
    fireEvent.submit(input.closest('form')!);

    const raw = localStorage.getItem('transit-recent-stops');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed).toMatchObject({ version: 1 });
    expect(parsed.entries[0].stopId).toBe('1_75403');
  });

  it('hydrates recent stops from V1 cache on mount and renders metadata', () => {
    localStorage.setItem(
      'transit-recent-stops',
      JSON.stringify({
        version: 1,
        entries: [
          {
            stopId: '1_29248',
            name: 'Pine St & 5th Ave',
            direction: 'Eastbound',
            routeIds: ['1_44'],
            lastSeenAt: 1_700_000_000_000,
          },
        ],
      }),
    );
    render(<TransitTracker />);
    expect(screen.getByText('Pine St & 5th Ave')).toBeInTheDocument();
    expect(screen.getByText('Eastbound')).toBeInTheDocument();
    expect(screen.getByText('44')).toBeInTheDocument();
  });

  it('discards legacy string[] cache (renders empty recent list)', () => {
    localStorage.setItem('transit-recent-stops', JSON.stringify(['1_29248', '1_75403']));
    render(<TransitTracker />);
    expect(screen.queryByText('transit.recentStops')).not.toBeInTheDocument();
  });

  it('shows stop-not-found banner with a remove button when fetch returns null stop', () => {
    localStorage.setItem(
      'transit-recent-stops',
      JSON.stringify({
        version: 1,
        entries: [
          { stopId: '1_dead', name: 'Old', direction: '', routeIds: [], lastSeenAt: 0 },
        ],
      }),
    );
    render(<TransitTracker />);
    // Click the recent entry to open it
    fireEvent.click(screen.getByText('Old'));
    expect(screen.getByText('transit.stopNotFound')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /transit\.removeFromRecent/i })).toBeInTheDocument();
  });

  it('renders refresh-failure banner with prior arrivals still visible when refreshError is set', () => {
    const now = Date.now();
    arrivalsHookState = {
      arrivals: [
        {
          routeId: '1_44',
          routeShortName: '44',
          routeLongName: '',
          tripHeadsign: 'UDistrict',
          predictedArrivalTime: now + 5 * 60_000,
          scheduledArrivalTime: now + 5 * 60_000,
          predicted: true,
          status: '',
          vehicleId: 'v1',
          distanceFromStop: 0,
        },
      ],
      stop: { id: '1_29248', name: 'Pine St', direction: '', lat: 0, lon: 0, routeIds: ['1_44'] },
      loading: false,
      error: null,
      refreshError: 'NetworkError',
      refresh: vi.fn(),
      lastUpdated: now,
    };
    render(<TransitTracker />);
    const input = screen.getByRole('textbox', { name: /transit\.stopSearchPlaceholder/i });
    fireEvent.change(input, { target: { value: '1_29248' } });
    fireEvent.submit(input.closest('form')!);

    expect(screen.getByText('transit.refreshFailed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /transit\.retry/i })).toBeInTheDocument();
    // Prior arrival is still rendered.
    expect(screen.getByText('UDistrict')).toBeInTheDocument();
  });

  it('removes the recent entry when "remove from recent" is clicked', () => {
    localStorage.setItem(
      'transit-recent-stops',
      JSON.stringify({
        version: 1,
        entries: [
          { stopId: '1_dead', name: 'Old', direction: '', routeIds: [], lastSeenAt: 0 },
        ],
      }),
    );
    render(<TransitTracker />);
    fireEvent.click(screen.getByText('Old'));
    fireEvent.click(screen.getByRole('button', { name: /transit\.removeFromRecent/i }));
    const raw = localStorage.getItem('transit-recent-stops');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).entries).toEqual([]);
  });
});
