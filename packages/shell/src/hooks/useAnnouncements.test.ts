import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAnnouncements } from './useAnnouncements';

const mockGetAnnouncements = vi.fn();
const mockUpdateLastSeenAnnouncement = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@mycircle/shared', () => ({
  StorageKeys: { LAST_SEEN_ANNOUNCEMENT: 'last-seen-announcement' },
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('../lib/firebase', () => ({
  getAnnouncements: (...args: unknown[]) => mockGetAnnouncements(...args),
  updateLastSeenAnnouncement: (...args: unknown[]) => mockUpdateLastSeenAnnouncement(...args),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const fakeAnnouncements = [
  {
    id: 'ann-1',
    title: 'New Feature',
    description: 'A great new feature.',
    icon: 'feature',
    createdAt: new Date('2026-02-15'),
  },
  {
    id: 'ann-2',
    title: 'Bug Fix',
    description: 'Fixed a bug.',
    icon: 'fix',
    createdAt: new Date('2026-02-10'),
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockUseAuth.mockReturnValue({ user: null, profile: null });
  mockGetAnnouncements.mockResolvedValue(fakeAnnouncements);
  mockUpdateLastSeenAnnouncement.mockResolvedValue(undefined);
});

describe('useAnnouncements', () => {
  it('fetches announcements on mount', async () => {
    const { result } = renderHook(() => useAnnouncements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockGetAnnouncements).toHaveBeenCalledTimes(1);
    expect(result.current.announcements).toEqual(fakeAnnouncements);
  });

  it('sets hasUnread = true when latest announcement differs from lastSeenId', async () => {
    // localStorage has a different id than the latest announcement
    localStorage.setItem('last-seen-announcement', 'ann-old');

    const { result } = renderHook(() => useAnnouncements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasUnread).toBe(true);
  });

  it('sets hasUnread = false when latest matches lastSeenId', async () => {
    // localStorage matches the latest announcement id
    localStorage.setItem('last-seen-announcement', 'ann-1');

    const { result } = renderHook(() => useAnnouncements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasUnread).toBe(false);
  });

  it('markAllSeen() updates localStorage and calls Firestore for signed-in user', async () => {
    const fakeUser = { uid: 'user-123' };
    mockUseAuth.mockReturnValue({ user: fakeUser, profile: null });

    const { result } = renderHook(() => useAnnouncements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.markAllSeen();
    });

    // Should persist to localStorage
    expect(localStorage.getItem('last-seen-announcement')).toBe('ann-1');

    // Should call Firestore update for signed-in user
    expect(mockUpdateLastSeenAnnouncement).toHaveBeenCalledWith('user-123', 'ann-1');

    // hasUnread should now be false
    expect(result.current.hasUnread).toBe(false);
  });

  it('handles fetch failure gracefully (no crash)', async () => {
    mockGetAnnouncements.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAnnouncements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.announcements).toEqual([]);
    expect(result.current.hasUnread).toBe(false);
  });

  it('works for anonymous users (localStorage only, no Firestore)', async () => {
    // Anonymous user — no user object
    mockUseAuth.mockReturnValue({ user: null, profile: null });

    const { result } = renderHook(() => useAnnouncements());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have unread since no lastSeenId set
    expect(result.current.hasUnread).toBe(true);

    await act(async () => {
      await result.current.markAllSeen();
    });

    // Should persist to localStorage
    expect(localStorage.getItem('last-seen-announcement')).toBe('ann-1');

    // Should NOT call Firestore for anonymous user
    expect(mockUpdateLastSeenAnnouncement).not.toHaveBeenCalled();

    // hasUnread should be false after marking seen
    expect(result.current.hasUnread).toBe(false);
  });
});
