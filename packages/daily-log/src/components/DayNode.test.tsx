import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DayNode from './DayNode';
import type { WorkEntry } from '../types';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock getLocalDateString to control "today" / "yesterday" logic
// When called without args (isToday), returns today's date.
// When called with a Date (isYesterday), returns that date formatted.
vi.mock('../utils/localDate', () => ({
  getLocalDateString: vi.fn((d?: Date) => {
    if (!d) return '2026-03-01';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }),
}));

// Mock EntryForm to simplify DayNode tests
vi.mock('./EntryForm', () => ({
  default: ({ onSubmit, onCancel, initialValue }: any) => (
    <div data-testid="entry-form">
      <span data-testid="form-initial-value">{initialValue}</span>
      <button type="button" onClick={() => onSubmit('updated content')}>mock-save</button>
      <button type="button" onClick={onCancel}>mock-cancel</button>
    </div>
  ),
}));

const makeEntry = (overrides: Partial<WorkEntry> = {}): WorkEntry => ({
  id: '1',
  date: '2026-03-01',
  content: 'Fixed a bug',
  createdAt: { seconds: 1000, nanoseconds: 0 },
  ...overrides,
});

describe('DayNode', () => {
  let onUpdate: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;
  let onMoveEntry: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Freeze time to 2026-03-01 noon UTC so today/yesterday are deterministic
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-03-01T12:00:00Z'));
    onUpdate = vi.fn().mockResolvedValue(undefined);
    onDelete = vi.fn().mockResolvedValue(undefined);
    onMoveEntry = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders formatted date and entries', () => {
    const entries = [makeEntry()];
    render(<DayNode date="2026-03-01" entries={entries} onUpdate={onUpdate} onDelete={onDelete} />);
    expect(screen.getByText('Fixed a bug')).toBeInTheDocument();
  });

  it('shows "today" label for today\'s date', () => {
    render(
      <DayNode date="2026-03-01" entries={[makeEntry()]} onUpdate={onUpdate} onDelete={onDelete} />
    );
    expect(screen.getByText('dailyLog.today')).toBeInTheDocument();
  });

  it('shows "yesterday" label for yesterday\'s date', () => {
    render(
      <DayNode date="2026-02-28" entries={[makeEntry({ date: '2026-02-28' })]} onUpdate={onUpdate} onDelete={onDelete} />
    );
    expect(screen.getByText('dailyLog.yesterday')).toBeInTheDocument();
  });

  it('does not show day label for other dates', () => {
    render(
      <DayNode date="2026-02-20" entries={[makeEntry({ date: '2026-02-20' })]} onUpdate={onUpdate} onDelete={onDelete} />
    );
    expect(screen.queryByText('dailyLog.today')).not.toBeInTheDocument();
    expect(screen.queryByText('dailyLog.yesterday')).not.toBeInTheDocument();
  });

  it('renders multiple entries', () => {
    const entries = [
      makeEntry({ id: '1', content: 'Task one' }),
      makeEntry({ id: '2', content: 'Task two' }),
    ];
    render(<DayNode date="2026-03-01" entries={entries} onUpdate={onUpdate} onDelete={onDelete} />);
    expect(screen.getByText('Task one')).toBeInTheDocument();
    expect(screen.getByText('Task two')).toBeInTheDocument();
  });

  it('shows edit form when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DayNode date="2026-03-01" entries={[makeEntry()]} onUpdate={onUpdate} onDelete={onDelete} />
    );
    await user.click(screen.getByRole('button', { name: 'dailyLog.edit' }));
    expect(screen.getByTestId('entry-form')).toBeInTheDocument();
    expect(screen.getByTestId('form-initial-value')).toHaveTextContent('Fixed a bug');
  });

  it('calls onUpdate and exits edit mode on save', async () => {
    const user = userEvent.setup();
    render(
      <DayNode date="2026-03-01" entries={[makeEntry()]} onUpdate={onUpdate} onDelete={onDelete} />
    );
    await user.click(screen.getByRole('button', { name: 'dailyLog.edit' }));
    await user.click(screen.getByText('mock-save'));
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('1', 'updated content');
    });
    // Should exit edit mode
    await waitFor(() => {
      expect(screen.queryByTestId('entry-form')).not.toBeInTheDocument();
    });
  });

  it('exits edit mode on cancel', async () => {
    const user = userEvent.setup();
    render(
      <DayNode date="2026-03-01" entries={[makeEntry()]} onUpdate={onUpdate} onDelete={onDelete} />
    );
    await user.click(screen.getByRole('button', { name: 'dailyLog.edit' }));
    expect(screen.getByTestId('entry-form')).toBeInTheDocument();
    await user.click(screen.getByText('mock-cancel'));
    expect(screen.queryByTestId('entry-form')).not.toBeInTheDocument();
  });

  it('shows delete confirmation on delete button click', async () => {
    const user = userEvent.setup();
    render(
      <DayNode date="2026-03-01" entries={[makeEntry()]} onUpdate={onUpdate} onDelete={onDelete} />
    );
    await user.click(screen.getByRole('button', { name: 'dailyLog.delete' }));
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('calls onDelete on confirm', async () => {
    const user = userEvent.setup();
    render(
      <DayNode date="2026-03-01" entries={[makeEntry()]} onUpdate={onUpdate} onDelete={onDelete} />
    );
    await user.click(screen.getByRole('button', { name: 'dailyLog.delete' }));
    await user.click(screen.getByText('Confirm'));
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('1');
    });
  });

  it('does not show move button when onMoveEntry is not provided', () => {
    render(
      <DayNode date="2026-03-01" entries={[makeEntry()]} onUpdate={onUpdate} onDelete={onDelete} />
    );
    expect(screen.queryByRole('button', { name: 'dailyLog.moveDate' })).not.toBeInTheDocument();
  });

  it('shows move button when onMoveEntry is provided', () => {
    render(
      <DayNode
        date="2026-03-01"
        entries={[makeEntry()]}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onMoveEntry={onMoveEntry}
      />
    );
    expect(screen.getByRole('button', { name: 'dailyLog.moveDate' })).toBeInTheDocument();
  });

  it('shows date picker when move button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DayNode
        date="2026-03-01"
        entries={[makeEntry()]}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onMoveEntry={onMoveEntry}
      />
    );
    await user.click(screen.getByRole('button', { name: 'dailyLog.moveDate' }));
    expect(screen.getByLabelText('dailyLog.moveDatePicker')).toBeInTheDocument();
  });

  it('toggles move date picker off on second click', async () => {
    const user = userEvent.setup();
    render(
      <DayNode
        date="2026-03-01"
        entries={[makeEntry()]}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onMoveEntry={onMoveEntry}
      />
    );
    const moveBtn = screen.getByRole('button', { name: 'dailyLog.moveDate' });
    await user.click(moveBtn);
    expect(screen.getByLabelText('dailyLog.moveDatePicker')).toBeInTheDocument();
    await user.click(moveBtn);
    expect(screen.queryByLabelText('dailyLog.moveDatePicker')).not.toBeInTheDocument();
  });
});
