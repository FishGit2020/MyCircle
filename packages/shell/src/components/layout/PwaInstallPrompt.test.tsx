import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PwaInstallPrompt from './PwaInstallPrompt';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  isNativePlatform: () => false,
}));

let getItemSpy: ReturnType<typeof vi.spyOn>;
let setItemSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
  setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
});

afterEach(() => {
  getItemSpy.mockRestore();
  setItemSpy.mockRestore();
});

function fireBeforeInstallPrompt() {
  const promptMock = vi.fn().mockResolvedValue(undefined);
  const event = new Event('beforeinstallprompt') as any;
  event.prompt = promptMock;
  event.userChoice = Promise.resolve({ outcome: 'accepted' as const });
  window.dispatchEvent(event);
  return { promptMock, event };
}

describe('PwaInstallPrompt', () => {
  it('renders nothing when no beforeinstallprompt event fires', () => {
    const { container } = render(<PwaInstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('shows banner when beforeinstallprompt event fires', () => {
    render(<PwaInstallPrompt />);
    act(() => { fireBeforeInstallPrompt(); });
    expect(screen.getByText('pwa.installTitle')).toBeInTheDocument();
    expect(screen.getByText('pwa.installMessage')).toBeInTheDocument();
  });

  it('shows install and dismiss buttons', () => {
    render(<PwaInstallPrompt />);
    act(() => { fireBeforeInstallPrompt(); });
    expect(screen.getByText('pwa.install')).toBeInTheDocument();
    expect(screen.getByText('pwa.notNow')).toBeInTheDocument();
  });

  it('calls prompt() when install button is clicked', async () => {
    render(<PwaInstallPrompt />);
    act(() => { fireBeforeInstallPrompt(); });
    const installBtn = screen.getByText('pwa.install');
    await act(async () => {
      fireEvent.click(installBtn);
    });
  });

  it('hides banner when dismiss button is clicked', () => {
    render(<PwaInstallPrompt />);
    act(() => { fireBeforeInstallPrompt(); });
    fireEvent.click(screen.getByText('pwa.notNow'));
    expect(screen.queryByText('pwa.installTitle')).not.toBeInTheDocument();
  });

  it('saves dismiss timestamp to localStorage', () => {
    render(<PwaInstallPrompt />);
    act(() => { fireBeforeInstallPrompt(); });
    fireEvent.click(screen.getByText('pwa.notNow'));
    expect(setItemSpy).toHaveBeenCalledWith('pwa-install-dismissed', expect.any(String));
  });

  it('does not show banner if previously dismissed within 7 days', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'pwa-install-dismissed') return String(Date.now());
      return null;
    });
    render(<PwaInstallPrompt />);
    act(() => { fireBeforeInstallPrompt(); });
    expect(screen.queryByText('pwa.installTitle')).not.toBeInTheDocument();
  });

  it('closes on Escape key', () => {
    render(<PwaInstallPrompt />);
    act(() => { fireBeforeInstallPrompt(); });
    expect(screen.getByText('pwa.installTitle')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('pwa.installTitle')).not.toBeInTheDocument();
  });

  it('has proper aria attributes for alertdialog', () => {
    render(<PwaInstallPrompt />);
    act(() => { fireBeforeInstallPrompt(); });
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'pwa-install-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'pwa-install-desc');
  });

  it('shows success message on appinstalled event', () => {
    render(<PwaInstallPrompt />);
    act(() => { fireBeforeInstallPrompt(); });
    act(() => { window.dispatchEvent(new Event('appinstalled')); });
    expect(screen.getByText('pwa.installed')).toBeInTheDocument();
  });

  it('auto-dismisses success message after 3 seconds', () => {
    vi.useFakeTimers();
    render(<PwaInstallPrompt />);
    act(() => { fireBeforeInstallPrompt(); });
    act(() => { window.dispatchEvent(new Event('appinstalled')); });
    expect(screen.getByText('pwa.installed')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(3000); });
    expect(screen.queryByText('pwa.installed')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
