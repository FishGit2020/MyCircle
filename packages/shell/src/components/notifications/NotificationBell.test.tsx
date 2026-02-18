import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: {
    WEATHER_ALERTS: 'weather-alerts-enabled',
    ANNOUNCEMENT_ALERTS: 'announcement-alerts-enabled',
  },
  WindowEvents: {
    NOTIFICATION_ALERTS_CHANGED: 'notification-alerts-changed',
  },
}));

vi.mock('../../lib/firebase', () => ({ firebaseEnabled: true }));

let mockFavoriteCities: Array<{ lat: number; lon: number; name: string }> = [];

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ favoriteCities: mockFavoriteCities }),
}));

const mockRequestPermission = vi.fn().mockResolvedValue(null);
const mockOnForegroundMessage = vi.fn(() => () => {});
const mockSubscribeToWeatherAlerts = vi.fn().mockResolvedValue(true);
const mockUnsubscribeFromWeatherAlerts = vi.fn().mockResolvedValue(true);
const mockSubscribeToTopic = vi.fn().mockResolvedValue(true);
const mockUnsubscribeFromTopic = vi.fn().mockResolvedValue(true);

vi.mock('../../lib/messaging', () => ({
  requestNotificationPermission: () => mockRequestPermission(),
  onForegroundMessage: (...args: unknown[]) => mockOnForegroundMessage(...args),
  subscribeToWeatherAlerts: (...args: unknown[]) => mockSubscribeToWeatherAlerts(...args),
  unsubscribeFromWeatherAlerts: (...args: unknown[]) => mockUnsubscribeFromWeatherAlerts(...args),
  subscribeToTopic: (...args: unknown[]) => mockSubscribeToTopic(...args),
  unsubscribeFromTopic: (...args: unknown[]) => mockUnsubscribeFromTopic(...args),
}));

import NotificationBell from './NotificationBell';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function openPanel() {
  fireEvent.click(screen.getByRole('button', { name: 'notifications.preferences' }));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequestPermission.mockResolvedValue(null);
    localStorage.clear();
    mockFavoriteCities = [];
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'default', requestPermission: vi.fn() },
      writable: true,
      configurable: true,
    });
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders the bell button with aria-label', () => {
    render(<NotificationBell />);
    expect(screen.getByRole('button', { name: 'notifications.preferences' })).toBeInTheDocument();
  });

  it('bell button has aria-expanded=false initially', () => {
    render(<NotificationBell />);
    const btn = screen.getByRole('button', { name: 'notifications.preferences' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(btn).toHaveAttribute('aria-haspopup', 'true');
  });

  // ── Panel open / close ────────────────────────────────────────────────────

  it('opens preferences panel on bell click', () => {
    render(<NotificationBell />);
    openPanel();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('bell button has aria-expanded=true when panel is open', () => {
    render(<NotificationBell />);
    const btn = screen.getByRole('button', { name: 'notifications.preferences' });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes panel on Escape key', () => {
    render(<NotificationBell />);
    openPanel();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes panel on outside click', () => {
    render(<NotificationBell />);
    openPanel();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // ── Toggle switches ───────────────────────────────────────────────────────

  it('shows two notification toggle switches in the panel', () => {
    render(<NotificationBell />);
    openPanel();
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(2);
  });

  it('all toggles are off by default (aria-checked=false)', () => {
    render(<NotificationBell />);
    openPanel();
    screen.getAllByRole('switch').forEach(sw => {
      expect(sw).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('displays labels for each notification category', () => {
    render(<NotificationBell />);
    openPanel();
    expect(screen.getByText('notifications.weatherAlerts')).toBeInTheDocument();
    expect(screen.getByText('notifications.announcementAlerts')).toBeInTheDocument();
  });

  it('displays descriptions for each notification category', () => {
    render(<NotificationBell />);
    openPanel();
    expect(screen.getByText('notifications.weatherAlertsDesc')).toBeInTheDocument();
    expect(screen.getByText('notifications.announcementAlertsDesc')).toBeInTheDocument();
  });

  // ── Weather toggle ────────────────────────────────────────────────────────

  it('shows feedback when toggling weather with no favorite cities', async () => {
    render(<NotificationBell />);
    openPanel();
    fireEvent.click(screen.getAllByRole('switch')[0]);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('notifications.addFavoritesFirst');
    });
  });

  // ── Initial state from localStorage ───────────────────────────────────────

  it('reads initial enabled state from localStorage', () => {
    localStorage.setItem('weather-alerts-enabled', 'true');

    render(<NotificationBell />);
    openPanel();
    const switches = screen.getAllByRole('switch');
    expect(switches[0]).toHaveAttribute('aria-checked', 'true');  // weather
    expect(switches[1]).toHaveAttribute('aria-checked', 'false'); // announcement
  });

  // ── Active indicator ──────────────────────────────────────────────────────

  it('shows active indicator dot when any alert is enabled', () => {
    localStorage.setItem('weather-alerts-enabled', 'true');
    const { container } = render(<NotificationBell />);
    const dot = container.querySelector('.bg-blue-500.rounded-full');
    expect(dot).toBeInTheDocument();
  });

  it('does not show active indicator when no alerts are enabled', () => {
    render(<NotificationBell />);
    const bell = screen.getByRole('button', { name: 'notifications.preferences' });
    const dot = bell.querySelector('.bg-blue-500.rounded-full');
    expect(dot).not.toBeInTheDocument();
  });

  // ── Announcement toggle ────────────────────────────────────────────────

  it('enables announcement alerts and calls subscribeToTopic', async () => {
    mockRequestPermission.mockResolvedValue('fake-token');

    render(<NotificationBell />);
    openPanel();
    const announcementSwitch = screen.getAllByRole('switch')[1];
    await act(async () => { fireEvent.click(announcementSwitch); });

    await waitFor(() => {
      expect(announcementSwitch).toHaveAttribute('aria-checked', 'true');
      expect(mockSubscribeToTopic).toHaveBeenCalledWith('fake-token', 'announcements');
    });
  });

  it('persists announcement alert state to localStorage', async () => {
    mockRequestPermission.mockResolvedValue('fake-token');

    render(<NotificationBell />);
    openPanel();
    await act(async () => { fireEvent.click(screen.getAllByRole('switch')[1]); });

    await waitFor(() => {
      expect(localStorage.getItem('announcement-alerts-enabled')).toBe('true');
    });
  });

  it('disables announcement alerts and calls unsubscribeFromTopic', async () => {
    localStorage.setItem('announcement-alerts-enabled', 'true');
    mockRequestPermission.mockResolvedValue('fake-token');

    await act(async () => { render(<NotificationBell />); });
    openPanel();
    const announcementSwitch = screen.getAllByRole('switch')[1];
    expect(announcementSwitch).toHaveAttribute('aria-checked', 'true');

    await act(async () => { fireEvent.click(announcementSwitch); });

    await waitFor(() => {
      expect(announcementSwitch).toHaveAttribute('aria-checked', 'false');
      expect(localStorage.getItem('announcement-alerts-enabled')).toBe('false');
    });
  });

  it('reads initial announcement enabled state from localStorage', () => {
    localStorage.setItem('announcement-alerts-enabled', 'true');

    render(<NotificationBell />);
    openPanel();
    const switches = screen.getAllByRole('switch');
    expect(switches[1]).toHaveAttribute('aria-checked', 'true');
  });
});
