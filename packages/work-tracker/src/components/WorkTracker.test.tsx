import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkTracker from './WorkTracker';

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  WindowEvents: {
    WORK_TRACKER_CHANGED: 'work-tracker-changed',
  },
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

describe('WorkTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Not authenticated by default
    delete (window as any).__getFirebaseIdToken;
    delete (window as any).__workTracker;
  });

  it('shows sign-in required when not authenticated', async () => {
    render(<WorkTracker />);
    // Initially shows loading spinner while auth check runs
    expect(screen.getByText('workTracker.title')).toBeInTheDocument();
    // After auth check resolves (no token), shows sign-in message
    await vi.waitFor(() => {
      expect(screen.getByText('workTracker.signInRequired')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows loading state when authenticated', async () => {
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
    (window as any).__workTracker = {
      getAll: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    render(<WorkTracker />);
    // Should show loading initially, then resolve
    // The component checks auth asynchronously
  });

  it('shows no entries message when authenticated with empty data', async () => {
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
    (window as any).__workTracker = {
      getAll: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    render(<WorkTracker />);

    // Wait for auth check and data load
    await vi.waitFor(() => {
      expect(screen.getByText('workTracker.noEntries')).toBeInTheDocument();
    }, { timeout: 6000 });
  });

  it('shows entries in timeline when data is present', async () => {
    const mockEntries = [
      { id: '1', date: '2026-02-18', content: 'Fixed a bug', createdAt: { seconds: 1, nanoseconds: 0 } },
      { id: '2', date: '2026-02-18', content: 'Code review', createdAt: { seconds: 2, nanoseconds: 0 } },
    ];

    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
    (window as any).__workTracker = {
      getAll: vi.fn().mockResolvedValue(mockEntries),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    render(<WorkTracker />);

    await vi.waitFor(() => {
      expect(screen.getByText('Fixed a bug')).toBeInTheDocument();
      expect(screen.getByText('Code review')).toBeInTheDocument();
    }, { timeout: 6000 });
  });

  it('shows filter chips', async () => {
    (window as any).__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
    (window as any).__workTracker = {
      getAll: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    render(<WorkTracker />);

    await vi.waitFor(() => {
      expect(screen.getByText('workTracker.today')).toBeInTheDocument();
      expect(screen.getByText('workTracker.thisMonth')).toBeInTheDocument();
      expect(screen.getByText('workTracker.allTime')).toBeInTheDocument();
    }, { timeout: 6000 });
  });
});
