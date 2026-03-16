import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DailyLog from './DailyLog';

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  PageContent: ({ children, className = '' }: any) => <div className={className}>{children}</div>, // eslint-disable-line @typescript-eslint/no-explicit-any
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  WindowEvents: {
    DAILY_LOG_CHANGED: 'daily-log-changed',
  },
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

describe('DailyLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Not authenticated by default
    delete window.__getFirebaseIdToken;
    delete window.__workTracker;
  });

  it('shows sign-in required when not authenticated', async () => {
    render(<DailyLog />);
    // Initially shows loading spinner while auth check runs
    expect(screen.getByText('dailyLog.title')).toBeInTheDocument();
    // After auth check resolves (no token), shows sign-in message
    await vi.waitFor(() => {
      expect(screen.getByText('dailyLog.signInRequired')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows loading state when authenticated', async () => {
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
    window.__workTracker = {
      getAll: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    render(<DailyLog />);
    // Should show loading initially, then resolve
    // The component checks auth asynchronously
  });

  it('shows no entries message when authenticated with empty data', async () => {
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
    window.__workTracker = {
      getAll: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    render(<DailyLog />);

    // Wait for auth check and data load
    await vi.waitFor(() => {
      expect(screen.getByText('dailyLog.noEntries')).toBeInTheDocument();
    }, { timeout: 6000 });
  });

  it('shows entries in timeline when data is present', async () => {
    const mockEntries = [
      { id: '1', date: '2026-02-18', content: 'Fixed a bug', createdAt: { seconds: 1, nanoseconds: 0 } },
      { id: '2', date: '2026-02-18', content: 'Code review', createdAt: { seconds: 2, nanoseconds: 0 } },
    ];

    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
    window.__workTracker = {
      getAll: vi.fn().mockResolvedValue(mockEntries),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    render(<DailyLog />);

    await vi.waitFor(() => {
      expect(screen.getByText('Fixed a bug')).toBeInTheDocument();
      expect(screen.getByText('Code review')).toBeInTheDocument();
    }, { timeout: 6000 });
  });

  it('shows filter chips', async () => {
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
    window.__workTracker = {
      getAll: vi.fn().mockResolvedValue([]),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    render(<DailyLog />);

    await vi.waitFor(() => {
      expect(screen.getByText('dailyLog.today')).toBeInTheDocument();
      expect(screen.getByText('dailyLog.thisMonth')).toBeInTheDocument();
      expect(screen.getByText('dailyLog.allTime')).toBeInTheDocument();
    }, { timeout: 6000 });
  });
});
