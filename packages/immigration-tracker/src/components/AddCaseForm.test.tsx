import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import AddCaseForm from './AddCaseForm';

describe('AddCaseForm', () => {
  const onAdd = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields', () => {
    render(<AddCaseForm onAdd={onAdd} onCancel={onCancel} />);
    expect(screen.getByLabelText('immigration.receiptNumber')).toBeInTheDocument();
    expect(screen.getByLabelText('immigration.formType')).toBeInTheDocument();
    expect(screen.getByLabelText('immigration.nickname')).toBeInTheDocument();
  });

  it('validates receipt number format', async () => {
    render(<AddCaseForm onAdd={onAdd} onCancel={onCancel} />);
    const input = screen.getByLabelText('immigration.receiptNumber');
    const submit = screen.getByText('immigration.addCase');

    await userEvent.type(input, 'INVALID');
    fireEvent.click(submit);

    expect(screen.getByText('immigration.invalidReceipt')).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('accepts valid receipt number', async () => {
    onAdd.mockResolvedValue(undefined);
    render(<AddCaseForm onAdd={onAdd} onCancel={onCancel} />);
    const input = screen.getByLabelText('immigration.receiptNumber');
    const submit = screen.getByText('immigration.addCase');

    await userEvent.type(input, 'IOE0912345678');
    fireEvent.click(submit);

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith({
        receiptNumber: 'IOE0912345678',
        formType: 'I-485',
        nickname: '',
      });
    });
  });

  it('calls onCancel when cancel clicked', () => {
    render(<AddCaseForm onAdd={onAdd} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('immigration.cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('uppercases receipt number input', async () => {
    onAdd.mockResolvedValue(undefined);
    render(<AddCaseForm onAdd={onAdd} onCancel={onCancel} />);
    const input = screen.getByLabelText('immigration.receiptNumber');

    await userEvent.type(input, 'ioe0912345678');
    fireEvent.click(screen.getByText('immigration.addCase'));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ receiptNumber: 'IOE0912345678' })
      );
    });
  });
});
