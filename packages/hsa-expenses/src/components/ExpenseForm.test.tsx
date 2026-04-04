import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpenseForm from './ExpenseForm';
import { HSAExpenseCategory, HSAExpenseStatus, type HSAExpense } from '../types';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const makeExpense = (overrides: Partial<HSAExpense> = {}): HSAExpense => ({
  id: 'exp-1',
  provider: 'Dr. Smith',
  dateOfService: '2024-06-15',
  amountCents: 4599,
  category: HSAExpenseCategory.DENTAL,
  description: 'Teeth cleaning',
  status: HSAExpenseStatus.PENDING,
  receiptUrl: null,
  receiptContentType: null,
  createdAt: '2024-06-15T10:00:00Z',
  updatedAt: '2024-06-15T10:00:00Z',
  ...overrides,
});

describe('ExpenseForm', () => {
  const onSubmit = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all required form fields', () => {
    render(<ExpenseForm onSubmit={onSubmit} onCancel={onCancel} />);

    expect(screen.getByRole('textbox', { name: 'hsaExpenses.provider' })).toBeInTheDocument();
    expect(screen.getByLabelText('hsaExpenses.dateOfService')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'hsaExpenses.amount' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'hsaExpenses.category' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'hsaExpenses.description' })).toBeInTheDocument();
  });

  it('shows add mode title when no expense prop', () => {
    render(<ExpenseForm onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByText('hsaExpenses.addExpense')).toBeInTheDocument();
  });

  it('shows edit mode title when expense prop is provided', () => {
    render(<ExpenseForm expense={makeExpense()} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByText('hsaExpenses.editExpense')).toBeInTheDocument();
  });

  it('pre-fills fields in edit mode', () => {
    const expense = makeExpense({
      provider: 'Dr. Jones',
      dateOfService: '2024-03-20',
      amountCents: 7500,
      category: HSAExpenseCategory.VISION,
      description: 'Eye exam',
    });
    render(<ExpenseForm expense={expense} onSubmit={onSubmit} onCancel={onCancel} />);

    expect(screen.getByRole('textbox', { name: 'hsaExpenses.provider' })).toHaveValue('Dr. Jones');
    expect(screen.getByLabelText('hsaExpenses.dateOfService')).toHaveValue('2024-03-20');
    expect(screen.getByRole('textbox', { name: 'hsaExpenses.amount' })).toHaveValue('75.00');
    expect(screen.getByRole('combobox', { name: 'hsaExpenses.category' })).toHaveValue('VISION');
    expect(screen.getByRole('textbox', { name: 'hsaExpenses.description' })).toHaveValue('Eye exam');
  });

  it('pre-fills empty description as empty string when null', () => {
    const expense = makeExpense({ description: null });
    render(<ExpenseForm expense={expense} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByRole('textbox', { name: 'hsaExpenses.description' })).toHaveValue('');
  });

  it('prevents submission with empty provider', () => {
    render(<ExpenseForm onSubmit={onSubmit} onCancel={onCancel} />);

    // Fill date and amount but leave provider empty
    fireEvent.change(screen.getByLabelText('hsaExpenses.dateOfService'), { target: { value: '2024-06-15' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'hsaExpenses.amount' }), { target: { value: '50.00' } });

    fireEvent.submit(screen.getByRole('button', { name: 'hsaExpenses.save' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('prevents submission with empty date', () => {
    render(<ExpenseForm onSubmit={onSubmit} onCancel={onCancel} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'hsaExpenses.provider' }), { target: { value: 'Dr. Smith' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'hsaExpenses.amount' }), { target: { value: '50.00' } });

    fireEvent.submit(screen.getByRole('button', { name: 'hsaExpenses.save' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('prevents submission with zero amount', () => {
    render(<ExpenseForm onSubmit={onSubmit} onCancel={onCancel} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'hsaExpenses.provider' }), { target: { value: 'Dr. Smith' } });
    fireEvent.change(screen.getByLabelText('hsaExpenses.dateOfService'), { target: { value: '2024-06-15' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'hsaExpenses.amount' }), { target: { value: '0' } });

    fireEvent.submit(screen.getByRole('button', { name: 'hsaExpenses.save' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('prevents submission with non-numeric amount', () => {
    render(<ExpenseForm onSubmit={onSubmit} onCancel={onCancel} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'hsaExpenses.provider' }), { target: { value: 'Dr. Smith' } });
    fireEvent.change(screen.getByLabelText('hsaExpenses.dateOfService'), { target: { value: '2024-06-15' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'hsaExpenses.amount' }), { target: { value: 'abc' } });

    fireEvent.submit(screen.getByRole('button', { name: 'hsaExpenses.save' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with correct data on valid submission', () => {
    render(<ExpenseForm onSubmit={onSubmit} onCancel={onCancel} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'hsaExpenses.provider' }), { target: { value: '  Dr. Smith  ' } });
    fireEvent.change(screen.getByLabelText('hsaExpenses.dateOfService'), { target: { value: '2024-06-15' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'hsaExpenses.amount' }), { target: { value: '45.99' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'hsaExpenses.category' }), { target: { value: 'DENTAL' } });

    fireEvent.submit(screen.getByRole('button', { name: 'hsaExpenses.save' }));

    expect(onSubmit).toHaveBeenCalledWith({
      provider: 'Dr. Smith',
      dateOfService: '2024-06-15',
      amountCents: 4599,
      category: HSAExpenseCategory.DENTAL,
    });
  });

  it('includes description when provided', () => {
    render(<ExpenseForm onSubmit={onSubmit} onCancel={onCancel} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'hsaExpenses.provider' }), { target: { value: 'Dr. Smith' } });
    fireEvent.change(screen.getByLabelText('hsaExpenses.dateOfService'), { target: { value: '2024-06-15' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'hsaExpenses.amount' }), { target: { value: '45.99' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'hsaExpenses.description' }), { target: { value: '  Annual checkup  ' } });

    fireEvent.submit(screen.getByRole('button', { name: 'hsaExpenses.save' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Annual checkup',
      })
    );
  });

  it('omits description when it is empty or whitespace-only', () => {
    render(<ExpenseForm onSubmit={onSubmit} onCancel={onCancel} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'hsaExpenses.provider' }), { target: { value: 'Dr. Smith' } });
    fireEvent.change(screen.getByLabelText('hsaExpenses.dateOfService'), { target: { value: '2024-06-15' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'hsaExpenses.amount' }), { target: { value: '50.00' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'hsaExpenses.description' }), { target: { value: '   ' } });

    fireEvent.submit(screen.getByRole('button', { name: 'hsaExpenses.save' }));

    const call = onSubmit.mock.calls[0][0];
    expect(call.description).toBeUndefined();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ExpenseForm onSubmit={onSubmit} onCancel={onCancel} />);

    await user.click(screen.getByRole('button', { name: 'hsaExpenses.cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when overlay is clicked', () => {
    render(<ExpenseForm onSubmit={onSubmit} onCancel={onCancel} />);

    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel when modal content is clicked', () => {
    render(<ExpenseForm onSubmit={onSubmit} onCancel={onCancel} />);

    // Click the form heading inside the modal (not the overlay itself)
    fireEvent.click(screen.getByText('hsaExpenses.addExpense'));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('disables save button when saving prop is true', () => {
    render(<ExpenseForm saving={true} onSubmit={onSubmit} onCancel={onCancel} />);
    const saveButton = screen.getByRole('button', { name: 'hsaExpenses.saving' });
    expect(saveButton).toBeDisabled();
  });

  it('shows saving text when saving prop is true', () => {
    render(<ExpenseForm saving={true} onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByText('hsaExpenses.saving')).toBeInTheDocument();
  });

  it('renders all 7 category options in the select', () => {
    render(<ExpenseForm onSubmit={onSubmit} onCancel={onCancel} />);
    const select = screen.getByRole('combobox', { name: 'hsaExpenses.category' });
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(7);
  });

  it('defaults category to MEDICAL', () => {
    render(<ExpenseForm onSubmit={onSubmit} onCancel={onCancel} />);
    expect(screen.getByRole('combobox', { name: 'hsaExpenses.category' })).toHaveValue('MEDICAL');
  });
});
