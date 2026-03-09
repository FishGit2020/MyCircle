import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RadioStation from './RadioStation';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  PageContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  WindowEvents: { RADIO_CHANGED: 'radio-changed' },
  StorageKeys: { RADIO_FAVORITES: 'radio-favorites' },
  MFEvents: { AUDIO_PLAY: 'mf:audio-play', AUDIO_CLOSE: 'mf:audio-close', AUDIO_TOGGLE_PLAY: 'mf:audio-toggle-play', AUDIO_PLAYBACK_STATE: 'mf:audio-playback-state' },
  eventBus: { publish: vi.fn() },
  subscribeToMFEvent: () => () => {},
  createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}));

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/radio' }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

// Mock fetch for the API call
const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  }),
);

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = mockFetch as any;
});

describe('RadioStation', () => {
  it('renders the title', async () => {
    render(<RadioStation />);
    await vi.waitFor(() => {
      expect(screen.getByText('radio.title')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows loading state initially', () => {
    // Make fetch never resolve to keep loading state
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));
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
