import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CharacterEditor from './CharacterEditor';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./PinyinKeyboard', () => ({
  default: () => <div data-testid="pinyin-keyboard" />,
}));

const mockCharacter = {
  id: 'ch1',
  character: '妈',
  pinyin: 'mā',
  meaning: 'Mom',
  category: 'family' as const,
};

describe('CharacterEditor', () => {
  const onSave = vi.fn();
  const onCancel = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders add mode with empty fields', () => {
    render(<CharacterEditor onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByText('chinese.addCharacter')).toBeInTheDocument();
    expect(screen.getByTestId('editor-character-input')).toHaveValue('');
  });

  it('renders edit mode with pre-filled values', () => {
    render(<CharacterEditor character={mockCharacter} onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByText('chinese.editCharacter')).toBeInTheDocument();
    expect(screen.getByTestId('editor-character-input')).toHaveValue('妈');
    expect(screen.getByTestId('editor-pinyin-input')).toHaveValue('mā');
    expect(screen.getByTestId('editor-meaning-input')).toHaveValue('Mom');
  });

  it('calls onSave with form data on submit', () => {
    render(<CharacterEditor onSave={onSave} onCancel={onCancel} />);
    fireEvent.change(screen.getByTestId('editor-character-input'), { target: { value: '爸' } });
    fireEvent.change(screen.getByTestId('editor-pinyin-input'), { target: { value: 'bà' } });
    fireEvent.change(screen.getByTestId('editor-meaning-input'), { target: { value: 'Dad' } });
    fireEvent.submit(screen.getByTestId('editor-save-btn'));
    expect(onSave).toHaveBeenCalledWith({ character: '爸', pinyin: 'bà', meaning: 'Dad', category: 'phrases' });
  });

  it('disables save when fields are empty', () => {
    render(<CharacterEditor onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByTestId('editor-save-btn')).toBeDisabled();
  });

  it('does not submit when required fields are empty', () => {
    render(<CharacterEditor onSave={onSave} onCancel={onCancel} />);
    fireEvent.change(screen.getByTestId('editor-character-input'), { target: { value: '爸' } });
    // pinyin and meaning still empty
    fireEvent.submit(screen.getByTestId('editor-save-btn'));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel clicked', () => {
    render(<CharacterEditor onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId('editor-cancel-btn'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows delete button in edit mode', () => {
    render(<CharacterEditor character={mockCharacter} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />);
    expect(screen.getByTestId('editor-delete-btn')).toBeInTheDocument();
  });

  it('does not show delete button in add mode', () => {
    render(<CharacterEditor onSave={onSave} onCancel={onCancel} onDelete={onDelete} />);
    expect(screen.queryByTestId('editor-delete-btn')).not.toBeInTheDocument();
  });

  it('shows delete confirmation on delete click', () => {
    render(<CharacterEditor character={mockCharacter} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId('editor-delete-btn'));
    expect(screen.getByText('chinese.deleteConfirm')).toBeInTheDocument();
    expect(screen.getByTestId('editor-confirm-delete')).toBeInTheDocument();
  });

  it('calls onDelete after confirmation', () => {
    render(<CharacterEditor character={mockCharacter} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId('editor-delete-btn'));
    fireEvent.click(screen.getByTestId('editor-confirm-delete'));
    expect(onDelete).toHaveBeenCalledWith('ch1');
  });

  it('cancels delete confirmation', () => {
    render(<CharacterEditor character={mockCharacter} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId('editor-delete-btn'));
    // The delete confirmation shows a "chinese.cancel" button to dismiss
    // Find the cancel button within the delete confirmation area (not the main cancel)
    const cancelButtons = screen.getAllByText('chinese.cancel');
    // The first one is the inline cancel next to confirm-delete
    fireEvent.click(cancelButtons[0]);
    expect(screen.getByTestId('editor-delete-btn')).toBeInTheDocument();
  });

  it('allows category selection', () => {
    render(<CharacterEditor onSave={onSave} onCancel={onCancel} />);
    fireEvent.change(screen.getByTestId('editor-category-select'), { target: { value: 'family' } });
    fireEvent.change(screen.getByTestId('editor-character-input'), { target: { value: 'X' } });
    fireEvent.change(screen.getByTestId('editor-pinyin-input'), { target: { value: 'x' } });
    fireEvent.change(screen.getByTestId('editor-meaning-input'), { target: { value: 'test' } });
    fireEvent.submit(screen.getByTestId('editor-save-btn'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ category: 'family' }));
  });

  it('renders pinyin keyboard', () => {
    render(<CharacterEditor onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByTestId('pinyin-keyboard')).toBeInTheDocument();
  });

  it('closes on backdrop click', () => {
    render(<CharacterEditor onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('presentation'));
    expect(onCancel).toHaveBeenCalled();
  });
});
