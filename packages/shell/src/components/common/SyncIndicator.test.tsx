import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import SyncIndicator from './SyncIndicator';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(),
}));

import { useOnlineStatus } from '../../hooks/useOnlineStatus';
const mockUseOnlineStatus = vi.mocked(useOnlineStatus);

afterEach(() => {
  vi.clearAllMocks();
});

describe('SyncIndicator', () => {
  it('renders nothing when online and never was offline', () => {
    mockUseOnlineStatus.mockReturnValue({ isOnline: true });
    const { container } = render(<SyncIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('shows offline message when offline', () => {
    mockUseOnlineStatus.mockReturnValue({ isOnline: false });
    render(<SyncIndicator />);
    expect(screen.getByText('sync.offline')).toBeInTheDocument();
  });

  it('shows synced message briefly after coming back online', () => {
    vi.useFakeTimers();
    // Start offline
    mockUseOnlineStatus.mockReturnValue({ isOnline: false });
    const { rerender } = render(<SyncIndicator />);
    expect(screen.getByText('sync.offline')).toBeInTheDocument();

    // Go online
    mockUseOnlineStatus.mockReturnValue({ isOnline: true });
    rerender(<SyncIndicator />);
    expect(screen.getByText('sync.synced')).toBeInTheDocument();

    // After 3 seconds, synced message disappears
    act(() => { vi.advanceTimersByTime(3100); });
    rerender(<SyncIndicator />);
    expect(screen.queryByText('sync.synced')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('has role="status" for accessibility', () => {
    mockUseOnlineStatus.mockReturnValue({ isOnline: false });
    render(<SyncIndicator />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
