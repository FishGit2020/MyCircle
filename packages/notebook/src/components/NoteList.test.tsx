import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteList from './NoteList';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./NoteCard', () => ({
  default: ({ note, onClick, onDelete }: any) => (
    <div data-testid={`note-card-${note.id}`} onClick={onClick}>
      <span>{note.title}</span>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }}>delete</button>
    </div>
  ),
}));

const mockNotes = [
  { id: '1', title: 'First Note', content: 'Content one', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', title: 'Second Note', content: 'Content two', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', title: 'Third Note', content: 'Special content', createdAt: new Date(), updatedAt: new Date() },
];

describe('NoteList', () => {
  const onSelect = vi.fn();
  const onNew = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all notes', () => {
    render(<NoteList notes={mockNotes} onSelect={onSelect} onNew={onNew} onDelete={onDelete} />);
    expect(screen.getByTestId('note-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('note-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('note-card-3')).toBeInTheDocument();
  });

  it('shows note count', () => {
    render(<NoteList notes={mockNotes} onSelect={onSelect} onNew={onNew} onDelete={onDelete} />);
    expect(screen.getByText(/notebook.noteCount/)).toBeInTheDocument();
  });

  it('calls onSelect when note clicked', () => {
    render(<NoteList notes={mockNotes} onSelect={onSelect} onNew={onNew} onDelete={onDelete} />);
    fireEvent.click(screen.getByTestId('note-card-1'));
    expect(onSelect).toHaveBeenCalledWith(mockNotes[0]);
  });

  it('calls onNew when new button clicked', () => {
    render(<NoteList notes={mockNotes} onSelect={onSelect} onNew={onNew} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /notebook.newNote/ }));
    expect(onNew).toHaveBeenCalled();
  });

  it('filters notes by search text', () => {
    render(<NoteList notes={mockNotes} onSelect={onSelect} onNew={onNew} onDelete={onDelete} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Special' } });
    expect(screen.getByTestId('note-card-3')).toBeInTheDocument();
    expect(screen.queryByTestId('note-card-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('note-card-2')).not.toBeInTheDocument();
  });

  it('shows no results message when search matches nothing', () => {
    render(<NoteList notes={mockNotes} onSelect={onSelect} onNew={onNew} onDelete={onDelete} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'nonexistent' } });
    expect(screen.getByText('notebook.noResults')).toBeInTheDocument();
  });

  it('shows empty state when no notes exist', () => {
    render(<NoteList notes={[]} onSelect={onSelect} onNew={onNew} onDelete={onDelete} />);
    expect(screen.getByText('notebook.noNotes')).toBeInTheDocument();
  });

  it('shows public empty state in public view', () => {
    render(<NoteList notes={[]} onSelect={onSelect} onNew={onNew} onDelete={onDelete} isPublicView />);
    expect(screen.getByText('notebook.noPublicNotes')).toBeInTheDocument();
  });

  it('calls onDelete with confirm dialog', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<NoteList notes={mockNotes} onSelect={onSelect} onNew={onNew} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByRole('button', { name: 'delete' });
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('does not delete when confirm cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<NoteList notes={mockNotes} onSelect={onSelect} onNew={onNew} onDelete={onDelete} />);
    const deleteButtons = screen.getAllByRole('button', { name: 'delete' });
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('searches in content too', () => {
    render(<NoteList notes={mockNotes} onSelect={onSelect} onNew={onNew} onDelete={onDelete} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Content one' } });
    expect(screen.getByTestId('note-card-1')).toBeInTheDocument();
    expect(screen.queryByTestId('note-card-2')).not.toBeInTheDocument();
  });
});
