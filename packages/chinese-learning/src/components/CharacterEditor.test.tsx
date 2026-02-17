import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CharacterEditor from './CharacterEditor';

describe('CharacterEditor', () => {
  const onSave = vi.fn();
  const onCancel = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders add mode when no character provided', () => {
    render(<CharacterEditor onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByText('Add Character')).toBeInTheDocument();
    expect(screen.getByTestId('editor-character-input')).toHaveValue('');
    expect(screen.getByTestId('editor-pinyin-input')).toHaveValue('');
    expect(screen.getByTestId('editor-meaning-input')).toHaveValue('');
  });

  it('renders edit mode with pre-filled values', () => {
    const char = { id: '1', character: '\u5988\u5988', pinyin: 'm\u0101ma', meaning: 'mom', category: 'family' as const };
    render(<CharacterEditor character={char} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />);
    expect(screen.getByText('Edit Character')).toBeInTheDocument();
    expect(screen.getByTestId('editor-character-input')).toHaveValue('\u5988\u5988');
    expect(screen.getByTestId('editor-pinyin-input')).toHaveValue('m\u0101ma');
    expect(screen.getByTestId('editor-meaning-input')).toHaveValue('mom');
  });

  it('calls onSave with form data on submit', async () => {
    const user = userEvent.setup();
    render(<CharacterEditor onSave={onSave} onCancel={onCancel} />);

    await user.type(screen.getByTestId('editor-character-input'), '\u6c34');
    await user.type(screen.getByTestId('editor-pinyin-input'), 'shu\u01d0');
    await user.type(screen.getByTestId('editor-meaning-input'), 'water');

    await user.click(screen.getByTestId('editor-save-btn'));
    expect(onSave).toHaveBeenCalledWith({
      character: '\u6c34',
      pinyin: 'shu\u01d0',
      meaning: 'water',
      category: 'phrases', // default
    });
  });

  it('calls onCancel when cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<CharacterEditor onSave={onSave} onCancel={onCancel} />);
    await user.click(screen.getByTestId('editor-cancel-btn'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('save button is disabled when fields are empty', () => {
    render(<CharacterEditor onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByTestId('editor-save-btn')).toBeDisabled();
  });

  it('shows delete button in edit mode', () => {
    const char = { id: '1', character: '\u5988\u5988', pinyin: 'm\u0101ma', meaning: 'mom', category: 'family' as const };
    render(<CharacterEditor character={char} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />);
    expect(screen.getByTestId('editor-delete-btn')).toBeInTheDocument();
  });

  it('shows delete confirmation before actually deleting', async () => {
    const user = userEvent.setup();
    const char = { id: '1', character: '\u5988\u5988', pinyin: 'm\u0101ma', meaning: 'mom', category: 'family' as const };
    render(<CharacterEditor character={char} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />);

    await user.click(screen.getByTestId('editor-delete-btn'));
    // Confirmation text appears
    expect(screen.getByText(/This cannot be undone/)).toBeInTheDocument();

    await user.click(screen.getByTestId('editor-confirm-delete'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('can change category', async () => {
    const user = userEvent.setup();
    render(<CharacterEditor onSave={onSave} onCancel={onCancel} />);

    await user.type(screen.getByTestId('editor-character-input'), '\u72d7');
    await user.type(screen.getByTestId('editor-pinyin-input'), 'g\u01d2u');
    await user.type(screen.getByTestId('editor-meaning-input'), 'dog');
    await user.selectOptions(screen.getByTestId('editor-category-select'), 'nature');

    await user.click(screen.getByTestId('editor-save-btn'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ category: 'nature' }));
  });
});
