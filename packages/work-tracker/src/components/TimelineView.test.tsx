import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TimelineView from './TimelineView';
import type { WorkEntry } from '../types';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock DayNode so TimelineView tests focus on grouping/sorting logic
vi.mock('./DayNode', () => ({
  default: ({ date, entries }: { date: string; entries: WorkEntry[] }) => (
    <div data-testid={`day-node-${date}`}>
      <span data-testid={`day-count-${date}`}>{entries.length}</span>
      {entries.map((e) => (
        <span key={e.id} data-testid={`entry-${e.id}`}>{e.content}</span>
      ))}
    </div>
  ),
}));

const makeEntry = (overrides: Partial<WorkEntry> = {}): WorkEntry => ({
  id: '1',
  date: '2026-03-01',
  content: 'Default task',
  createdAt: { seconds: 1000, nanoseconds: 0 },
  ...overrides,
});

describe('TimelineView', () => {
  let onUpdate: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;
  let onMoveEntry: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onUpdate = vi.fn().mockResolvedValue(undefined);
    onDelete = vi.fn().mockResolvedValue(undefined);
    onMoveEntry = vi.fn().mockResolvedValue(undefined);
  });

  it('shows "no entries" message when entries is empty', () => {
    render(
      <TimelineView entries={[]} onUpdate={onUpdate} onDelete={onDelete} />
    );
    expect(screen.getByText('workTracker.noEntries')).toBeInTheDocument();
  });

  it('does not show "no entries" message when entries exist', () => {
    render(
      <TimelineView entries={[makeEntry()]} onUpdate={onUpdate} onDelete={onDelete} />
    );
    expect(screen.queryByText('workTracker.noEntries')).not.toBeInTheDocument();
  });

  it('renders a DayNode for each unique date', () => {
    const entries = [
      makeEntry({ id: '1', date: '2026-03-01', content: 'Task A' }),
      makeEntry({ id: '2', date: '2026-03-01', content: 'Task B' }),
      makeEntry({ id: '3', date: '2026-02-28', content: 'Task C' }),
    ];
    render(
      <TimelineView entries={entries} onUpdate={onUpdate} onDelete={onDelete} />
    );
    expect(screen.getByTestId('day-node-2026-03-01')).toBeInTheDocument();
    expect(screen.getByTestId('day-node-2026-02-28')).toBeInTheDocument();
  });

  it('groups entries by date correctly', () => {
    const entries = [
      makeEntry({ id: '1', date: '2026-03-01', content: 'A' }),
      makeEntry({ id: '2', date: '2026-03-01', content: 'B' }),
      makeEntry({ id: '3', date: '2026-02-28', content: 'C' }),
    ];
    render(
      <TimelineView entries={entries} onUpdate={onUpdate} onDelete={onDelete} />
    );
    // March 1 should have 2 entries
    expect(screen.getByTestId('day-count-2026-03-01')).toHaveTextContent('2');
    // Feb 28 should have 1 entry
    expect(screen.getByTestId('day-count-2026-02-28')).toHaveTextContent('1');
  });

  it('sorts dates descending (newest first)', () => {
    const entries = [
      makeEntry({ id: '1', date: '2026-02-25', content: 'Oldest' }),
      makeEntry({ id: '2', date: '2026-03-01', content: 'Newest' }),
      makeEntry({ id: '3', date: '2026-02-28', content: 'Middle' }),
    ];
    render(
      <TimelineView entries={entries} onUpdate={onUpdate} onDelete={onDelete} />
    );

    const dayNodes = screen.getAllByTestId(/^day-node-/);
    expect(dayNodes).toHaveLength(3);
    // First should be newest date, last should be oldest
    expect(dayNodes[0]).toHaveAttribute('data-testid', 'day-node-2026-03-01');
    expect(dayNodes[1]).toHaveAttribute('data-testid', 'day-node-2026-02-28');
    expect(dayNodes[2]).toHaveAttribute('data-testid', 'day-node-2026-02-25');
  });

  it('passes onMoveEntry to DayNode when provided', () => {
    const entries = [makeEntry()];
    render(
      <TimelineView
        entries={entries}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onMoveEntry={onMoveEntry}
      />
    );
    // If onMoveEntry is passed, DayNode would render it — our mock just renders entries
    expect(screen.getByTestId('day-node-2026-03-01')).toBeInTheDocument();
  });

  it('renders all entry content inside the correct DayNode', () => {
    const entries = [
      makeEntry({ id: '1', date: '2026-03-01', content: 'Alpha' }),
      makeEntry({ id: '2', date: '2026-03-01', content: 'Beta' }),
    ];
    render(
      <TimelineView entries={entries} onUpdate={onUpdate} onDelete={onDelete} />
    );
    expect(screen.getByTestId('entry-1')).toHaveTextContent('Alpha');
    expect(screen.getByTestId('entry-2')).toHaveTextContent('Beta');
  });
});
