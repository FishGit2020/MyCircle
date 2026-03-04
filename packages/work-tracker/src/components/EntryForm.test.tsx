import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EntryForm from './EntryForm';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('EntryForm', () => {
  let onSubmit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    onSubmit = vi.fn().mockResolvedValue(undefined);
  });

  it('renders input and submit button', () => {
    render(<EntryForm onSubmit={onSubmit} />);
    expect(screen.getByPlaceholderText('workTracker.placeholder')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'workTracker.save' })).toBeInTheDocument();
  });

  it('submit button is disabled when input is empty', () => {
    render(<EntryForm onSubmit={onSubmit} />);
    expect(screen.getByRole('button', { name: 'workTracker.save' })).toBeDisabled();
  });

  it('submit button is disabled when input is only whitespace', () => {
    render(<EntryForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByPlaceholderText('workTracker.placeholder'), { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: 'workTracker.save' })).toBeDisabled();
  });

  it('enables submit button when content is entered', () => {
    render(<EntryForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByPlaceholderText('workTracker.placeholder'), { target: { value: 'New task' } });
    expect(screen.getByRole('button', { name: 'workTracker.save' })).toBeEnabled();
  });

  it('calls onSubmit with trimmed content on form submission', async () => {
    const user = userEvent.setup();
    render(<EntryForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByPlaceholderText('workTracker.placeholder'), { target: { value: '  Fix bug  ' } });
    await user.click(screen.getByRole('button', { name: 'workTracker.save' }));
    expect(onSubmit).toHaveBeenCalledWith('Fix bug');
  });

  it('clears input after successful submit (no initialValue)', async () => {
    const user = userEvent.setup();
    render(<EntryForm onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText('workTracker.placeholder');
    fireEvent.change(input, { target: { value: 'New task' } });
    await user.click(screen.getByRole('button', { name: 'workTracker.save' }));
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('does not clear input after submit when initialValue is provided (edit mode)', async () => {
    const user = userEvent.setup();
    render(<EntryForm onSubmit={onSubmit} initialValue="Existing work" />);
    const input = screen.getByPlaceholderText('workTracker.placeholder');
    expect(input).toHaveValue('Existing work');
    await user.click(screen.getByRole('button', { name: 'workTracker.save' }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('Existing work');
    });
    // Should NOT clear since initialValue was provided
    expect(input).toHaveValue('Existing work');
  });

  it('does not show cancel button when onCancel is not provided', () => {
    render(<EntryForm onSubmit={onSubmit} />);
    expect(screen.queryByRole('button', { name: 'workTracker.cancel' })).not.toBeInTheDocument();
  });

  it('shows cancel button and calls onCancel when clicked', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(<EntryForm onSubmit={onSubmit} onCancel={onCancel} />);
    const cancelBtn = screen.getByRole('button', { name: 'workTracker.cancel' });
    expect(cancelBtn).toBeInTheDocument();
    await user.click(cancelBtn);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not submit when empty', async () => {
    const user = userEvent.setup();
    render(<EntryForm onSubmit={onSubmit} />);
    // Try submitting via Enter key on empty input
    const input = screen.getByPlaceholderText('workTracker.placeholder');
    await user.type(input, '{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables button during submission', async () => {
    let resolveSubmit: () => void;
    const slowSubmit = vi.fn().mockImplementation(
      () => new Promise<void>((resolve) => { resolveSubmit = resolve; })
    );
    const user = userEvent.setup();
    render(<EntryForm onSubmit={slowSubmit} />);
    fireEvent.change(screen.getByPlaceholderText('workTracker.placeholder'), { target: { value: 'Task' } });
    await user.click(screen.getByRole('button', { name: 'workTracker.save' }));
    // While submitting, button should be disabled
    expect(screen.getByRole('button', { name: 'workTracker.save' })).toBeDisabled();
    // Resolve the submission
    resolveSubmit!();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'workTracker.save' })).toBeDisabled();
    });
  });

  it('handles onSubmit error gracefully', async () => {
    const failSubmit = vi.fn().mockRejectedValue(new Error('fail'));
    const user = userEvent.setup();
    render(<EntryForm onSubmit={failSubmit} />);
    fireEvent.change(screen.getByPlaceholderText('workTracker.placeholder'), { target: { value: 'Task' } });
    await user.click(screen.getByRole('button', { name: 'workTracker.save' }));
    await waitFor(() => {
      // After error, submitting state should be reset
      expect(screen.getByRole('button', { name: 'workTracker.save' })).toBeEnabled();
    });
  });
});
