import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HsaExpenses from './HsaExpenses';
import { HSAExpenseCategory, HSAExpenseStatus, type HSAExpense } from '../types';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  PageContent: ({ children }: { children: React.ReactNode }) => <div data-testid="page-content">{children}</div>,
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}));

const mockHook = {
  expenses: [] as HSAExpense[],
  loading: false,
  error: null as Error | null,
  adding: false,
  updating: false,
  deleting: false,
  uploadingReceipt: false,
  addExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
  markReimbursed: vi.fn(),
  uploadReceipt: vi.fn(),
  deleteReceipt: vi.fn(),
  refetch: vi.fn(),
};

vi.mock('../hooks/useHsaExpenses', () => ({
  useHsaExpenses: () => mockHook,
}));

const makeExpense = (overrides: Partial<HSAExpense> = {}): HSAExpense => ({
  id: 'exp-1',
  provider: 'Dr. Smith',
  dateOfService: '2024-06-15',
  amountCents: 15000,
  category: HSAExpenseCategory.MEDICAL,
  description: 'Annual checkup',
  status: HSAExpenseStatus.PENDING,
  receiptUrl: null,
  receiptContentType: null,
  createdAt: '2024-06-15T10:00:00Z',
  updatedAt: '2024-06-15T10:00:00Z',
  ...overrides,
});

describe('HsaExpenses', () => {
  const originalUid = window.__currentUid;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHook.expenses = [];
    mockHook.loading = false;
    mockHook.error = null;
    mockHook.adding = false;
    mockHook.updating = false;
    mockHook.deleting = false;
    mockHook.uploadingReceipt = false;
    window.__currentUid = 'test-user-123';
  });

  afterEach(() => {
    window.__currentUid = originalUid;
  });

  it('shows sign-in prompt when no uid is set', () => {
    window.__currentUid = undefined;
    render(<HsaExpenses />);
    expect(screen.getByText(/Sign in to track your HSA expenses/)).toBeInTheDocument();
    expect(screen.getByText('hsaExpenses.title')).toBeInTheDocument();
  });

  it('shows sign-in prompt when uid is null', () => {
    window.__currentUid = null;
    render(<HsaExpenses />);
    expect(screen.getByText(/Sign in to track your HSA expenses/)).toBeInTheDocument();
  });

  it('shows loading spinner when loading with no expenses', () => {
    mockHook.loading = true;
    mockHook.expenses = [];
    render(<HsaExpenses />);
    expect(screen.getByText('hsaExpenses.title')).toBeInTheDocument();
    // The spinner is an animated div — verify it exists via class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows empty state when authenticated with no expenses', () => {
    mockHook.expenses = [];
    render(<HsaExpenses />);
    expect(screen.getByText('hsaExpenses.noExpenses')).toBeInTheDocument();
  });

  it('renders expense cards when data exists', () => {
    mockHook.expenses = [
      makeExpense({ id: 'exp-1', provider: 'Dr. Smith', amountCents: 15000 }),
      makeExpense({ id: 'exp-2', provider: 'Eye Care Center', amountCents: 5000, category: HSAExpenseCategory.VISION }),
    ];
    render(<HsaExpenses />);
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Eye Care Center')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });

  it('shows add expense button that opens form', async () => {
    const user = userEvent.setup({ delay: null });
    mockHook.expenses = [makeExpense()];
    render(<HsaExpenses />);

    const addButton = screen.getByRole('button', { name: 'hsaExpenses.addExpense' });
    expect(addButton).toBeInTheDocument();

    await user.click(addButton);

    // The form modal should now be visible
    expect(screen.getByRole('dialog', { name: 'hsaExpenses.addExpense' })).toBeInTheDocument();
  });

  it('displays error message when error exists', () => {
    mockHook.error = new Error('Network failure');
    mockHook.expenses = [makeExpense()];
    render(<HsaExpenses />);
    expect(screen.getByText('Network failure')).toBeInTheDocument();
  });

  it('renders search filter bar when authenticated', () => {
    mockHook.expenses = [makeExpense()];
    render(<HsaExpenses />);
    expect(screen.getByRole('textbox', { name: 'hsaExpenses.searchPlaceholder' })).toBeInTheDocument();
  });

  it('renders summary section when expenses exist', () => {
    mockHook.expenses = [makeExpense({ amountCents: 10000 })];
    render(<HsaExpenses />);
    expect(screen.getByText('hsaExpenses.summary')).toBeInTheDocument();
  });

  it('opens edit form when edit button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    mockHook.expenses = [makeExpense({ id: 'exp-1', provider: 'Dr. Smith' })];
    render(<HsaExpenses />);

    const editButton = screen.getByRole('button', { name: 'hsaExpenses.editExpense' });
    await user.click(editButton);

    // The form modal should be in edit mode
    expect(screen.getByRole('dialog', { name: 'hsaExpenses.editExpense' })).toBeInTheDocument();
  });

  it('opens delete confirmation when delete button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    mockHook.expenses = [makeExpense()];
    render(<HsaExpenses />);

    const deleteButton = screen.getByRole('button', { name: 'hsaExpenses.deleteExpense' });
    await user.click(deleteButton);

    expect(screen.getByText('hsaExpenses.deleteConfirm')).toBeInTheDocument();
  });

  it('wraps content in PageContent', () => {
    render(<HsaExpenses />);
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
  });
});
