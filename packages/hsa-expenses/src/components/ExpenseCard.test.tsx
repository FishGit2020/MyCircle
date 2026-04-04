import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpenseCard from './ExpenseCard';
import { HSAExpenseCategory, HSAExpenseStatus, type HSAExpense } from '../types';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const makeExpense = (overrides: Partial<HSAExpense> = {}): HSAExpense => ({
  id: 'exp-1',
  provider: 'Dr. Smith',
  dateOfService: '2024-06-15',
  amountCents: 15000,
  category: HSAExpenseCategory.MEDICAL,
  description: 'Annual physical exam',
  status: HSAExpenseStatus.PENDING,
  receiptUrl: null,
  receiptContentType: null,
  createdAt: '2024-06-15T10:00:00Z',
  updatedAt: '2024-06-15T10:00:00Z',
  ...overrides,
});

describe('ExpenseCard', () => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onMarkReimbursed = vi.fn();
  const onViewDetail = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the formatted amount', () => {
    render(
      <ExpenseCard
        expense={makeExpense({ amountCents: 15000 })}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkReimbursed={onMarkReimbursed}
        onViewDetail={onViewDetail}
      />
    );
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });

  it('renders the provider name', () => {
    render(
      <ExpenseCard
        expense={makeExpense({ provider: 'Eye Care Center' })}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkReimbursed={onMarkReimbursed}
        onViewDetail={onViewDetail}
      />
    );
    expect(screen.getByText('Eye Care Center')).toBeInTheDocument();
  });

  it('renders the category badge', () => {
    render(
      <ExpenseCard
        expense={makeExpense({ category: HSAExpenseCategory.DENTAL })}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkReimbursed={onMarkReimbursed}
        onViewDetail={onViewDetail}
      />
    );
    expect(screen.getByText('hsaExpenses.dental')).toBeInTheDocument();
  });

  it('renders the date of service', () => {
    render(
      <ExpenseCard
        expense={makeExpense({ dateOfService: '2024-03-20' })}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkReimbursed={onMarkReimbursed}
        onViewDetail={onViewDetail}
      />
    );
    expect(screen.getByText('2024-03-20')).toBeInTheDocument();
  });

  it('shows pending status badge for PENDING expenses', () => {
    render(
      <ExpenseCard
        expense={makeExpense({ status: HSAExpenseStatus.PENDING })}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkReimbursed={onMarkReimbursed}
        onViewDetail={onViewDetail}
      />
    );
    expect(screen.getByText('hsaExpenses.pending')).toBeInTheDocument();
  });

  it('shows reimbursed status badge for REIMBURSED expenses', () => {
    render(
      <ExpenseCard
        expense={makeExpense({ status: HSAExpenseStatus.REIMBURSED })}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkReimbursed={onMarkReimbursed}
        onViewDetail={onViewDetail}
      />
    );
    expect(screen.getByText('hsaExpenses.reimbursed')).toBeInTheDocument();
  });

  it('renders description when present', () => {
    render(
      <ExpenseCard
        expense={makeExpense({ description: 'Root canal treatment' })}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkReimbursed={onMarkReimbursed}
        onViewDetail={onViewDetail}
      />
    );
    expect(screen.getByText('Root canal treatment')).toBeInTheDocument();
  });

  it('does not render description when null', () => {
    render(
      <ExpenseCard
        expense={makeExpense({ description: null })}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkReimbursed={onMarkReimbursed}
        onViewDetail={onViewDetail}
      />
    );
    expect(screen.queryByText('Annual physical exam')).not.toBeInTheDocument();
  });

  it('shows receipt indicator when receiptUrl is present', () => {
    render(
      <ExpenseCard
        expense={makeExpense({ receiptUrl: 'https://example.com/receipt.pdf' })}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkReimbursed={onMarkReimbursed}
        onViewDetail={onViewDetail}
      />
    );
    expect(screen.getByText('hsaExpenses.receipt')).toBeInTheDocument();
    expect(screen.getByTitle('hsaExpenses.receiptAttached')).toBeInTheDocument();
  });

  it('does not show receipt indicator when receiptUrl is null', () => {
    render(
      <ExpenseCard
        expense={makeExpense({ receiptUrl: null })}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkReimbursed={onMarkReimbursed}
        onViewDetail={onViewDetail}
      />
    );
    expect(screen.queryByText('hsaExpenses.receipt')).not.toBeInTheDocument();
  });

  it('calls onViewDetail when view button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const expense = makeExpense();
    render(
      <ExpenseCard
        expense={expense}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkReimbursed={onMarkReimbursed}
        onViewDetail={onViewDetail}
      />
    );

    await user.click(screen.getByRole('button', { name: 'hsaExpenses.viewReceipt' }));
    expect(onViewDetail).toHaveBeenCalledWith(expense);
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const expense = makeExpense();
    render(
      <ExpenseCard
        expense={expense}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkReimbursed={onMarkReimbursed}
        onViewDetail={onViewDetail}
      />
    );

    await user.click(screen.getByRole('button', { name: 'hsaExpenses.editExpense' }));
    expect(onEdit).toHaveBeenCalledWith(expense);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const expense = makeExpense();
    render(
      <ExpenseCard
        expense={expense}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkReimbursed={onMarkReimbursed}
        onViewDetail={onViewDetail}
      />
    );

    await user.click(screen.getByRole('button', { name: 'hsaExpenses.deleteExpense' }));
    expect(onDelete).toHaveBeenCalledWith(expense);
  });

  it('calls onMarkReimbursed when mark button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const expense = makeExpense({ status: HSAExpenseStatus.PENDING });
    render(
      <ExpenseCard
        expense={expense}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkReimbursed={onMarkReimbursed}
        onViewDetail={onViewDetail}
      />
    );

    await user.click(screen.getByRole('button', { name: 'hsaExpenses.markReimbursed' }));
    expect(onMarkReimbursed).toHaveBeenCalledWith(expense);
  });

  it('shows markPending label when expense is already reimbursed', () => {
    render(
      <ExpenseCard
        expense={makeExpense({ status: HSAExpenseStatus.REIMBURSED })}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkReimbursed={onMarkReimbursed}
        onViewDetail={onViewDetail}
      />
    );
    expect(screen.getByRole('button', { name: 'hsaExpenses.markPending' })).toBeInTheDocument();
  });

  it('renders all four action buttons', () => {
    render(
      <ExpenseCard
        expense={makeExpense()}
        onEdit={onEdit}
        onDelete={onDelete}
        onMarkReimbursed={onMarkReimbursed}
        onViewDetail={onViewDetail}
      />
    );

    expect(screen.getByRole('button', { name: 'hsaExpenses.viewReceipt' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'hsaExpenses.markReimbursed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'hsaExpenses.editExpense' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'hsaExpenses.deleteExpense' })).toBeInTheDocument();
  });
});
