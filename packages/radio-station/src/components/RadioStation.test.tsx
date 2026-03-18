import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RadioStation from './RadioStation';

const mockUseQuery = vi.fn(() => ({ data: { radioStations: [], radioStationsByUuids: [] }, loading: false, error: undefined, refetch: vi.fn() }));

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  PageContent: ({ children, className }: any) => <div className={className}>{children}</div>, // eslint-disable-line @typescript-eslint/no-explicit-any
  WindowEvents: { RADIO_CHANGED: 'radio-changed' },
  StorageKeys: { RADIO_FAVORITES: 'radio-favorites' },
  MFEvents: { AUDIO_PLAY: 'mf:audio-play', AUDIO_CLOSE: 'mf:audio-close', AUDIO_TOGGLE_PLAY: 'mf:audio-toggle-play', AUDIO_PLAYBACK_STATE: 'mf:audio-playback-state' },
  eventBus: { publish: vi.fn() },
  subscribeToMFEvent: () => () => {},
  createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
  useQuery: (...args: any[]) => mockUseQuery(...args), // eslint-disable-line @typescript-eslint/no-explicit-any
  useLazyQuery: () => [vi.fn(), { loading: false }],
  GET_RADIO_STATIONS: {},
  GET_RADIO_STATIONS_BY_UUIDS: {},
}));

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/radio' }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUseQuery.mockReturnValue({ data: { radioStations: [], radioStationsByUuids: [] }, loading: false, error: undefined, refetch: vi.fn() });
});

describe('RadioStation', () => {
  it('renders the title', async () => {
    render(<RadioStation />);
    await vi.waitFor(() => {
      expect(screen.getByText('radio.title')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows loading state initially', () => {
    mockUseQuery.mockReturnValueOnce({ data: undefined, loading: true, error: undefined, refetch: vi.fn() });
    render(<RadioStation />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders browse and favorites tabs', async () => {
    render(<RadioStation />);
    await vi.waitFor(() => {
      expect(screen.getByText('radio.browse')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText('radio.favorites')).toBeInTheDocument();
  });

  it('renders search input and button', async () => {
    render(<RadioStation />);
    await vi.waitFor(() => {
      expect(screen.getByText('radio.search')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
