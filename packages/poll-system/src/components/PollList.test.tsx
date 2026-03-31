import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PollList from './PollList';
import type { Poll } from '../types';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const now = Date.now();

const activePoll: Poll = {
  id: 'p1',
  question: 'Best fruit?',
  options: [{ id: 'o1', text: 'Apple', votes: 3 }],
  createdBy: 'user-me',
  isPublic: true,
  expiresAt: null,
  createdAt: now - 1000,
  updatedAt: now - 1000,
};

const expiredPoll: Poll = {
  id: 'p2',
  question: 'Favourite season?',
  options: [{ id: 'o2', text: 'Summer', votes: 1 }],
  createdBy: 'user-other',
  isPublic: true,
  expiresAt: new Date(now - 5000).toISOString(),
  createdAt: now - 2000,
  updatedAt: now - 2000,
};

const anotherActivePoll: Poll = {
  id: 'p3',
  question: 'Best vegetable?',
  options: [{ id: 'o3', text: 'Carrot', votes: 2 }],
  createdBy: 'user-other',
  isPublic: false,
  expiresAt: null,
  createdAt: now - 3000,
  updatedAt: now - 3000,
};

const polls = [activePoll, expiredPoll, anotherActivePoll];

const handlers = { onSelect: vi.fn(), onDelete: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  (window as any).__currentUid = 'user-me'; // eslint-disable-line @typescript-eslint/no-explicit-any
});

describe('PollList — US2: Search and filter', () => {
  it('shows all polls when no search or filter active', () => {
    render(<PollList polls={polls} {...handlers} />);
    expect(screen.getByText('Best fruit?')).toBeInTheDocument();
    expect(screen.getByText('Favourite season?')).toBeInTheDocument();
    expect(screen.getByText('Best vegetable?')).toBeInTheDocument();
  });

  it('filters polls by keyword case-insensitively', () => {
    render(<PollList polls={polls} {...handlers} />);
    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'FRUIT' } });
    expect(screen.getByText('Best fruit?')).toBeInTheDocument();
    expect(screen.queryByText('Favourite season?')).not.toBeInTheDocument();
    expect(screen.queryByText('Best vegetable?')).not.toBeInTheDocument();
  });

  it('Active filter hides expired polls', () => {
    render(<PollList polls={polls} {...handlers} />);
    fireEvent.click(screen.getByRole('button', { name: 'pollSystem.filterActive' }));
    expect(screen.getByText('Best fruit?')).toBeInTheDocument();
    expect(screen.getByText('Best vegetable?')).toBeInTheDocument();
    expect(screen.queryByText('Favourite season?')).not.toBeInTheDocument();
  });

  it('Expired filter shows only expired polls', () => {
    render(<PollList polls={polls} {...handlers} />);
    fireEvent.click(screen.getByRole('button', { name: 'pollSystem.filterExpired' }));
    expect(screen.getByText('Favourite season?')).toBeInTheDocument();
    expect(screen.queryByText('Best fruit?')).not.toBeInTheDocument();
    expect(screen.queryByText('Best vegetable?')).not.toBeInTheDocument();
  });

  it('My Polls filter shows only polls created by current user', () => {
    render(<PollList polls={polls} {...handlers} />);
    fireEvent.click(screen.getByRole('button', { name: 'pollSystem.filterMine' }));
    expect(screen.getByText('Best fruit?')).toBeInTheDocument();
    expect(screen.queryByText('Favourite season?')).not.toBeInTheDocument();
    expect(screen.queryByText('Best vegetable?')).not.toBeInTheDocument();
  });

  it('shows no-results message when search and filter produce no matches', () => {
    render(<PollList polls={polls} {...handlers} />);
    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'zzznomatch' } });
    expect(screen.getByText('pollSystem.noResults')).toBeInTheDocument();
  });

  it('applies search and filter simultaneously (AND logic)', () => {
    render(<PollList polls={polls} {...handlers} />);
    // Filter: active, Search: "best"
    fireEvent.click(screen.getByRole('button', { name: 'pollSystem.filterActive' }));
    const searchInput = screen.getByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'best' } });
    // "Best fruit?" (active, matches) and "Best vegetable?" (active, matches) should show
    expect(screen.getByText('Best fruit?')).toBeInTheDocument();
    expect(screen.getByText('Best vegetable?')).toBeInTheDocument();
    // "Favourite season?" (expired) should not show even though it doesn't match "best"
    expect(screen.queryByText('Favourite season?')).not.toBeInTheDocument();
  });
});
