import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BabyTracker from './BabyTracker';

const mockUseChildren = vi.fn(() => ({
  children: [],
  allChildren: [],
  selectedChild: null,
  selectedId: null,
  setSelectedId: vi.fn(),
  addChild: vi.fn(),
  updateChild: vi.fn(),
  deleteChild: vi.fn(),
  loading: false,
}));

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  PageContent: ({ children, className = '' }: any) => <div className={className}>{children}</div>,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  StorageKeys: {
    BABY_DUE_DATE: 'baby-due-date',
  },
  WindowEvents: {
    BABY_DUE_DATE_CHANGED: 'baby-due-date-changed',
  },
  useVerseOfDay: () => ({
    reference: 'Psalm 139:13-14',
    text: 'Test verse text',
    loading: false,
    shuffle: vi.fn(),
  }),
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
  parseVerseReference: (ref: string) => {
    const match = ref.replace(/[\u2013\u2014].*/g, '').trim().match(/^(.+?)\s+(\d+)(?::.*)?$/);
    if (!match) return null;
    return { book: match[1].trim(), chapter: parseInt(match[2], 10) };
  },
  useChildren: (...args: any[]) => mockUseChildren(...args),
  ChildSelector: ({ children: _c, onAdd }: any) => (
    <div data-testid="child-selector">
      {onAdd && <button type="button" onClick={onAdd} data-testid="child-selector-add">add-baby</button>}
    </div>
  ),
}));

vi.mock('react-router', () => ({
  Link: ({ to, children, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

describe('BabyTracker', () => {
  let originalGetItem: typeof Storage.prototype.getItem;
  let originalSetItem: typeof Storage.prototype.setItem;
  let originalRemoveItem: typeof Storage.prototype.removeItem;

  beforeEach(() => {
    originalGetItem = Storage.prototype.getItem;
    originalSetItem = Storage.prototype.setItem;
    originalRemoveItem = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});
    mockUseChildren.mockReset();
    mockUseChildren.mockReturnValue({
      children: [],
      allChildren: [],
      selectedChild: null,
      selectedId: null,
      setSelectedId: vi.fn(),
      addChild: vi.fn(),
      updateChild: vi.fn(),
      deleteChild: vi.fn(),
      loading: false,
    });
  });

  afterEach(() => {
    Storage.prototype.getItem = originalGetItem;
    Storage.prototype.setItem = originalSetItem;
    Storage.prototype.removeItem = originalRemoveItem;
    vi.restoreAllMocks();
  });

  it('renders the title and subtitle', () => {
    render(<BabyTracker />);
    expect(screen.getByText('baby.title')).toBeInTheDocument();
    expect(screen.getByText('baby.subtitle')).toBeInTheDocument();
  });

  it('renders the verse section with a verse', () => {
    render(<BabyTracker />);
    // Verse section should have a shuffle button
    expect(screen.getByRole('button', { name: 'baby.shuffleVerse' })).toBeInTheDocument();
  });

  it('renders due date input', () => {
    render(<BabyTracker />);
    expect(screen.getByLabelText('baby.dueDate')).toBeInTheDocument();
    expect(screen.getByText('baby.save')).toBeInTheDocument();
  });

  it('shows no-due-date message when no date is set', () => {
    render(<BabyTracker />);
    expect(screen.getByText('baby.noDueDate')).toBeInTheDocument();
  });

  it('saves due date to localStorage and dispatches event', async () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const user = userEvent.setup({ delay: null });

    render(<BabyTracker />);

    const dateInput = screen.getByLabelText('baby.dueDate');
    await user.clear(dateInput);
    // Set a date 20 weeks from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 140);
    const dateStr = futureDate.toISOString().split('T')[0];
    fireEvent.change(dateInput, { target: { value: dateStr } });

    await user.click(screen.getByText('baby.save'));

    expect(Storage.prototype.setItem).toHaveBeenCalledWith('baby-due-date', dateStr);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'baby-due-date-changed' }));

    dispatchSpy.mockRestore();
  });

  it('loads due date from localStorage on mount', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 140);
    const dateStr = futureDate.toISOString().split('T')[0];

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(dateStr);

    render(<BabyTracker />);

    // Should show growth data (week number), not the no-due-date message
    expect(screen.queryByText('baby.noDueDate')).not.toBeInTheDocument();
  });

  it('shows growth data when due date is set within 40 weeks', () => {
    // Set due date ~20 weeks from now (puts us at week 20)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 140);
    const dateStr = futureDate.toISOString().split('T')[0];

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(dateStr);

    render(<BabyTracker />);

    // Should show a progress bar
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    // Should show length and weight labels
    expect(screen.getByText('baby.length')).toBeInTheDocument();
    expect(screen.getByText('baby.weight')).toBeInTheDocument();
  });

  it('shows clear button when due date is set', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 140);
    const dateStr = futureDate.toISOString().split('T')[0];

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(dateStr);

    render(<BabyTracker />);

    expect(screen.getByText('baby.clear')).toBeInTheDocument();
  });

  it('clears due date when clear button is clicked', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 140);
    const dateStr = futureDate.toISOString().split('T')[0];

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(dateStr);
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const user = userEvent.setup({ delay: null });

    render(<BabyTracker />);

    await user.click(screen.getByText('baby.clear'));

    expect(Storage.prototype.removeItem).toHaveBeenCalledWith('baby-due-date');
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'baby-due-date-changed' }));

    dispatchSpy.mockRestore();
  });

  it('shows past-due message when due date has passed', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 14);
    const dateStr = pastDate.toISOString().split('T')[0];

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(dateStr);

    render(<BabyTracker />);

    expect(screen.getByText('baby.congratulations')).toBeInTheDocument();
  });

  it('shows not-pregnant-yet when due date is more than 40 weeks away', () => {
    const farFutureDate = new Date();
    farFutureDate.setDate(farFutureDate.getDate() + 300);
    const dateStr = farFutureDate.toISOString().split('T')[0];

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(dateStr);

    render(<BabyTracker />);

    expect(screen.getByText('baby.notPregnantYet')).toBeInTheDocument();
  });

  it('shuffles verse when shuffle button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<BabyTracker />);

    const shuffleBtn = screen.getByRole('button', { name: 'baby.shuffleVerse' });
    // Click multiple times - since it's random, just ensure it doesn't error
    await user.click(shuffleBtn);
    await user.click(shuffleBtn);

    expect(shuffleBtn).toBeInTheDocument();
  });

  it('has proper ARIA attributes on progress bar', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 140);
    const dateStr = futureDate.toISOString().split('T')[0];

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(dateStr);

    render(<BabyTracker />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-valuenow');
    expect(progressBar).toHaveAttribute('aria-label', 'baby.progress');
  });

  it('disables save button when no date is entered', () => {
    render(<BabyTracker />);

    const saveBtn = screen.getByText('baby.save');
    expect(saveBtn).toBeDisabled();
  });

  it('hides Add button in ChildSelector when one baby already exists', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 140);
    const dueDateStr = futureDate.toISOString().split('T')[0];
    const babyData = {
      children: [{ id: 'b1', name: 'Baby', birthDate: '2025-01-01', dueDate: dueDateStr }],
      allChildren: [{ id: 'b1', name: 'Baby', birthDate: '2025-01-01', dueDate: dueDateStr }],
      selectedChild: { id: 'b1', name: 'Baby', birthDate: '2025-01-01', dueDate: dueDateStr },
      selectedId: 'b1',
      setSelectedId: vi.fn(),
      addChild: vi.fn(),
      updateChild: vi.fn(),
      deleteChild: vi.fn(),
      loading: false,
    };
    // Use mockReturnValue (not Once) so re-renders also get baby data
    mockUseChildren.mockReturnValue(babyData);
    render(<BabyTracker />);
    // ChildSelector should render but without the add button (single-baby limit)
    expect(screen.getByTestId('child-selector')).toBeInTheDocument();
    expect(screen.queryByTestId('child-selector-add')).not.toBeInTheDocument();
  });

  it('responds to external BABY_DUE_DATE_CHANGED events', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 140);
    const dateStr = futureDate.toISOString().split('T')[0];

    render(<BabyTracker />);

    // Initially shows no due date
    expect(screen.getByText('baby.noDueDate')).toBeInTheDocument();

    // Simulate Firestore restore
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(dateStr);
    fireEvent(window, new Event('baby-due-date-changed'));

    // Should now show growth data
    expect(screen.queryByText('baby.noDueDate')).not.toBeInTheDocument();
  });
});
