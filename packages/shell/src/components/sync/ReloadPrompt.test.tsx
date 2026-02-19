import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ReloadPrompt from './ReloadPrompt';

// Track the hook options so we can trigger needRefresh from tests
let hookOptions: any = {};
const mockSetNeedRefresh = vi.fn();
let mockNeedRefresh = false;

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (opts: any) => {
    hookOptions = opts;
    return {
      needRefresh: [mockNeedRefresh, mockSetNeedRefresh],
      updateServiceWorker: vi.fn(),
    };
  },
}));

const { mockWarn } = vi.hoisted(() => ({ mockWarn: vi.fn() }));
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: mockWarn, error: vi.fn() }),
  isNativePlatform: () => false,
}));

const mockUnregister = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  mockNeedRefresh = false;
  mockSetNeedRefresh.mockClear();
  mockUnregister.mockClear();

  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      getRegistration: vi.fn().mockResolvedValue({ unregister: mockUnregister }),
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

  it('unregisters SW and reloads when reload button is clicked', async () => {
    mockNeedRefresh = true;
    render(<ReloadPrompt />);
    await act(async () => {
      fireEvent.click(screen.getByText('pwa.reload'));
    });
    expect(mockUnregister).toHaveBeenCalled();
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

  it('logs warning when SW registration fails', () => {
    render(<ReloadPrompt />);
    const error = new TypeError('Script https://mycircle-dash.web.app/sw.js load failed');
    hookOptions.onRegisterError(error);
    expect(mockWarn).toHaveBeenCalledWith('Service worker registration failed', error);
  });

  it('still reloads even if unregister fails', async () => {
    mockNeedRefresh = true;
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        getRegistration: vi.fn().mockRejectedValue(new Error('SW error')),
      },
      writable: true,
      configurable: true,
    });
    render(<ReloadPrompt />);
    await act(async () => {
      fireEvent.click(screen.getByText('pwa.reload'));
    });
    expect(window.location.reload).toHaveBeenCalled();
  });
});
