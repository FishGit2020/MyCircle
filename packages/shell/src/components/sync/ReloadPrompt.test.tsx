import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ReloadPrompt from './ReloadPrompt';

// Track the hook options so we can trigger needRefresh from tests
let hookOptions: any = {};
const mockUpdateServiceWorker = vi.fn().mockResolvedValue(undefined);
const mockSetNeedRefresh = vi.fn();
let mockNeedRefresh = false;

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (opts: any) => {
    hookOptions = opts;
    return {
      needRefresh: [mockNeedRefresh, mockSetNeedRefresh],
      updateServiceWorker: mockUpdateServiceWorker,
    };
  },
}));

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock navigator.serviceWorker
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  mockNeedRefresh = false;
  mockUpdateServiceWorker.mockResolvedValue(undefined);
  mockSetNeedRefresh.mockClear();
  mockAddEventListener.mockClear();
  mockRemoveEventListener.mockClear();

  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    },
    writable: true,
    configurable: true,
  });

  // Mock window.location.reload
  Object.defineProperty(window, 'location', {
    value: { ...window.location, reload: vi.fn() },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ReloadPrompt', () => {
  it('renders nothing when needRefresh is false', () => {
    mockNeedRefresh = false;
    const { container } = render(<ReloadPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('shows alert banner when needRefresh is true', () => {
    mockNeedRefresh = true;
    render(<ReloadPrompt />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('pwa.newVersion')).toBeInTheDocument();
    expect(screen.getByText('pwa.reload')).toBeInTheDocument();
  });

  it('calls updateServiceWorker(true) when reload button is clicked', async () => {
    mockNeedRefresh = true;
    render(<ReloadPrompt />);
    await act(async () => {
      fireEvent.click(screen.getByText('pwa.reload'));
    });
    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('sets a fallback reload timeout after clicking reload', async () => {
    mockNeedRefresh = true;
    render(<ReloadPrompt />);
    await act(async () => {
      fireEvent.click(screen.getByText('pwa.reload'));
    });
    // Fallback timer set for 3 seconds
    act(() => { vi.advanceTimersByTime(3000); });
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('shows reloading state and disables button after clicking reload', async () => {
    mockNeedRefresh = true;
    render(<ReloadPrompt />);
    await act(async () => {
      fireEvent.click(screen.getByText('pwa.reload'));
    });
    expect(screen.getByText('pwa.reloading')).toBeInTheDocument();
    expect(screen.getByText('pwa.reloading').closest('button')).toBeDisabled();
  });

  it('hides dismiss button while reloading', async () => {
    mockNeedRefresh = true;
    render(<ReloadPrompt />);
    expect(screen.getByLabelText('pwa.dismiss')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByText('pwa.reload'));
    });
    expect(screen.queryByLabelText('pwa.dismiss')).not.toBeInTheDocument();
  });

  it('calls setNeedRefresh(false) when dismiss button is clicked', () => {
    mockNeedRefresh = true;
    render(<ReloadPrompt />);
    fireEvent.click(screen.getByLabelText('pwa.dismiss'));
    expect(mockSetNeedRefresh).toHaveBeenCalledWith(false);
  });

  it('attaches controllerchange listener when needRefresh is true', () => {
    mockNeedRefresh = true;
    render(<ReloadPrompt />);
    expect(mockAddEventListener).toHaveBeenCalledWith('controllerchange', expect.any(Function));
  });

  it('does not attach controllerchange listener when needRefresh is false', () => {
    mockNeedRefresh = false;
    render(<ReloadPrompt />);
    expect(mockAddEventListener).not.toHaveBeenCalled();
  });

  it('cleans up controllerchange listener on unmount', () => {
    mockNeedRefresh = true;
    const { unmount } = render(<ReloadPrompt />);
    unmount();
    expect(mockRemoveEventListener).toHaveBeenCalledWith('controllerchange', expect.any(Function));
  });

  it('force-reloads if updateServiceWorker rejects', async () => {
    mockNeedRefresh = true;
    mockUpdateServiceWorker.mockRejectedValueOnce(new Error('SW error'));
    render(<ReloadPrompt />);
    await act(async () => {
      fireEvent.click(screen.getByText('pwa.reload'));
    });
    expect(window.location.reload).toHaveBeenCalled();
  });
});
