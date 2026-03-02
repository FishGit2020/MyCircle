import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddCardModal from './AddCardModal';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('AddCardModal', () => {
  const onAdd = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders add mode with empty fields', () => {
    render(<AddCardModal onAdd={onAdd} onClose={onClose} />);
    expect(screen.getByText('flashcards.addCustomCard')).toBeInTheDocument();
    expect(screen.getByLabelText('flashcards.front')).toHaveValue('');
    expect(screen.getByLabelText('flashcards.back')).toHaveValue('');
  });

  it('renders edit mode with pre-filled values', () => {
    const onEdit = vi.fn();
    render(<AddCardModal onEdit={onEdit} initialValues={{ front: 'Hello', back: 'World', category: 'test' }} onClose={onClose} />);
    expect(screen.getByText('flashcards.editCard')).toBeInTheDocument();
    expect(screen.getByLabelText('flashcards.front')).toHaveValue('Hello');
    expect(screen.getByLabelText('flashcards.back')).toHaveValue('World');
  });

  it('calls onAdd with trimmed data on submit', () => {
    render(<AddCardModal onAdd={onAdd} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('flashcards.front'), { target: { value: '  Front  ' } });
    fireEvent.change(screen.getByLabelText('flashcards.back'), { target: { value: '  Back  ' } });
    fireEvent.submit(screen.getByRole('button', { name: 'flashcards.save' }));
    expect(onAdd).toHaveBeenCalledWith({ front: 'Front', back: 'Back', category: 'custom' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onEdit in edit mode', () => {
    const onEdit = vi.fn();
    render(<AddCardModal onEdit={onEdit} initialValues={{ front: 'A', back: 'B', category: 'c' }} onClose={onClose} />);
    fireEvent.submit(screen.getByRole('button', { name: 'flashcards.save' }));
    expect(onEdit).toHaveBeenCalledWith({ front: 'A', back: 'B', category: 'c' });
  });

  it('does not submit when front is empty', () => {
    render(<AddCardModal onAdd={onAdd} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('flashcards.back'), { target: { value: 'Back' } });
    expect(screen.getByRole('button', { name: 'flashcards.save' })).toBeDisabled();
  });

  it('does not submit when back is empty', () => {
    render(<AddCardModal onAdd={onAdd} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('flashcards.front'), { target: { value: 'Front' } });
    expect(screen.getByRole('button', { name: 'flashcards.save' })).toBeDisabled();
  });

  it('calls onClose when cancel clicked', () => {
    render(<AddCardModal onAdd={onAdd} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'flashcards.cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('allows setting custom category', () => {
    render(<AddCardModal onAdd={onAdd} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('flashcards.front'), { target: { value: 'F' } });
    fireEvent.change(screen.getByLabelText('flashcards.back'), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText('flashcards.category'), { target: { value: 'mycat' } });
    fireEvent.submit(screen.getByRole('button', { name: 'flashcards.save' }));
    expect(onAdd).toHaveBeenCalledWith({ front: 'F', back: 'B', category: 'mycat' });
  });
});
