import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PollSystem from './PollSystem';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  PageContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  WindowEvents: { POLL_SYSTEM_CHANGED: 'poll-system-changed' },
  StorageKeys: {},
  createLogger: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() }),
}));

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/polls' }),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

beforeEach(() => {
  vi.clearAllMocks();
  (window as any).__pollSystem = undefined;
});

describe('PollSystem', () => {
  it('renders the title and new poll button', async () => {
    render(<PollSystem />);
    await vi.waitFor(() => {
      expect(screen.getByText('pollSystem.title')).toBeInTheDocument();
    }, { timeout: 3000 });
    expect(screen.getByText('pollSystem.newPoll')).toBeInTheDocument();
  });

  it('shows empty state when no polls', async () => {
    render(<PollSystem />);
    await vi.waitFor(() => {
      expect(screen.getByText('pollSystem.noPolls')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
