import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import WhatsNewButton from './WhatsNewButton';

const mockMarkAllSeen = vi.fn();
const mockNavigate = vi.fn();
const mockAnnouncements = [
  { id: 'ann-1', title: 'Test Feature', description: 'A new feature', icon: 'feature', createdAt: new Date() },
  { id: 'ann-2', title: 'Bug Fix', description: 'Fixed a bug', icon: 'fix', createdAt: new Date() },
];

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../hooks/useAnnouncements', () => ({
  useAnnouncements: () => ({
    announcements: mockAnnouncements,
    loading: false,
    hasUnread: true,
    markAllSeen: mockMarkAllSeen,
    lastSeenId: null,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

const renderButton = () => render(
  <MemoryRouter>
    <WhatsNewButton />
  </MemoryRouter>
);

describe('WhatsNewButton', () => {
  it('renders sparkle button with aria-label', () => {
    renderButton();
    expect(screen.getByTestId('whats-new-button')).toBeInTheDocument();
  });

  it('shows unread badge when hasUnread is true', () => {
    renderButton();
    expect(screen.getByTestId('unread-badge')).toBeInTheDocument();
  });

  it('navigates to /whats-new on click and marks all as seen', () => {
    renderButton();
    fireEvent.click(screen.getByTestId('whats-new-button'));
    expect(mockMarkAllSeen).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/whats-new');
  });

  it('auto-shows popup after 1.5s for unread announcements', () => {
    vi.useFakeTimers();
    renderButton();

    expect(screen.queryByTestId('announcement-popup')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByTestId('announcement-popup')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('does not re-popup after localStorage flag is set', () => {
    localStorage.setItem('announcement-popup-shown-ann-1', '1');
    vi.useFakeTimers();
    renderButton();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByTestId('announcement-popup')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('dismisses popup and marks as seen', () => {
    vi.useFakeTimers();
    renderButton();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.getByTestId('announcement-popup')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('popup-dismiss'));
    expect(screen.queryByTestId('announcement-popup')).not.toBeInTheDocument();
    expect(mockMarkAllSeen).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('popup View All navigates to /whats-new', () => {
    vi.useFakeTimers();
    renderButton();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    fireEvent.click(screen.getByTestId('popup-view-all'));
    expect(mockNavigate).toHaveBeenCalledWith('/whats-new');
    expect(mockMarkAllSeen).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
