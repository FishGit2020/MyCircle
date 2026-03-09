import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TripPlanner from './TripPlanner';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  PageContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  WindowEvents: { TRIP_PLANNER_CHANGED: 'trip-planner-changed' },
  StorageKeys: {},
  createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}));

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/trips' }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

beforeEach(() => {
  vi.clearAllMocks();
  (window as any).__tripPlanner = undefined;
});

describe('TripPlanner', () => {
  it('renders the title and new trip button', async () => {
    render(<TripPlanner />);
    await vi.waitFor(() => {
      expect(screen.getByText('tripPlanner.title')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText('tripPlanner.newTrip')).toBeInTheDocument();
  });

  it('shows empty state when no trips', async () => {
    render(<TripPlanner />);
    await vi.waitFor(() => {
      expect(screen.getByText('tripPlanner.noTrips')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
