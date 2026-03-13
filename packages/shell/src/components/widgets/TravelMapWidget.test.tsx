import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Widget from './TravelMapWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
  WindowEvents: {},
  StorageKeys: {},
  useQuery: () => ({ data: undefined, loading: false }),
  GET_WORSHIP_SONGS_LIST: {},
  subscribeToMFEvent: () => () => {},
  MFEvents: {},
  eventBus: { publish: vi.fn() },
  createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}));
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ favoriteCities: [] }),
}));

describe('TravelMapWidget', () => {
  it('renders without crashing', () => {
    render(<Widget />);
  });

  it('shows widget title', () => {
    render(<Widget />);
    expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
  });
});
