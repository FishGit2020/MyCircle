import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NoteEditor from './NoteEditor';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockNote = {
  id: 'note-1',
  title: 'Test Note',
  content: 'Test content',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('NoteEditor', () => {
  const onSave = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  const onDelete = vi.fn();
  const onPublish = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    window.__logAnalyticsEvent = vi.fn();
  });

  it('renders empty form for new note', () => {
    render(<NoteEditor note={null} onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByLabelText('notebook.noteTitle')).toHaveValue('');
    expect(screen.getByLabelText('notebook.content')).toHaveValue('');
  });

  it('renders form pre-filled for existing note', () => {
    render(<NoteEditor note={mockNote} onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByLabelText('notebook.noteTitle')).toHaveValue('Test Note');
    expect(screen.getByLabelText('notebook.content')).toHaveValue('Test content');
  });

  it('calls onSave with trimmed data on submit', async () => {
    render(<NoteEditor note={null} onSave={onSave} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText('notebook.noteTitle'), { target: { value: '  My Title  ' } });
    fireEvent.change(screen.getByLabelText('notebook.content'), { target: { value: '  My Content  ' } });
    fireEvent.submit(screen.getByRole('button', { name: 'notebook.save' }));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(null, { title: 'My Title', content: 'My Content' });
    });
  });

  it('calls onSave with note id for existing note', async () => {
    render(<NoteEditor note={mockNote} onSave={onSave} onCancel={onCancel} />);
    fireEvent.submit(screen.getByRole('button', { name: 'notebook.save' }));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('note-1', expect.objectContaining({ title: 'Test Note' }));
    });
  });

  it('does not save when both title and content are empty', async () => {
    render(<NoteEditor note={null} onSave={onSave} onCancel={onCancel} />);
    // Submit button should be disabled
    expect(screen.getByRole('button', { name: 'notebook.save' })).toBeDisabled();
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<NoteEditor note={null} onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'notebook.cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onDelete when delete button clicked', () => {
    render(<NoteEditor note={mockNote} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: 'notebook.deleteNote' }));
    expect(onDelete).toHaveBeenCalledWith('note-1');
  });

  it('does not show delete button for new notes', () => {
    render(<NoteEditor note={null} onSave={onSave} onCancel={onCancel} onDelete={onDelete} />);
    expect(screen.queryByRole('button', { name: 'notebook.deleteNote' })).not.toBeInTheDocument();
  });

  it('shows publish button when onPublish provided', () => {
    render(<NoteEditor note={null} onSave={onSave} onCancel={onCancel} onPublish={onPublish} />);
    expect(screen.getByRole('button', { name: 'notebook.publish' })).toBeInTheDocument();
  });

  it('does not show publish button when onPublish not provided', () => {
    render(<NoteEditor note={null} onSave={onSave} onCancel={onCancel} />);
    expect(screen.queryByRole('button', { name: 'notebook.publish' })).not.toBeInTheDocument();
  });

  it('calls onPublish after confirm dialog', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<NoteEditor note={mockNote} onSave={onSave} onCancel={onCancel} onPublish={onPublish} />);
    fireEvent.click(screen.getByRole('button', { name: 'notebook.publish' }));
    await waitFor(() => {
      expect(onPublish).toHaveBeenCalledWith({ title: 'Test Note', content: 'Test content' });
    });
  });

  it('does not publish when confirm is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<NoteEditor note={mockNote} onSave={onSave} onCancel={onCancel} onPublish={onPublish} />);
    fireEvent.click(screen.getByRole('button', { name: 'notebook.publish' }));
    expect(onPublish).not.toHaveBeenCalled();
  });

  it('disables save button while saving', async () => {
    let resolvePromise: () => void;
    const slowSave = vi.fn(() => new Promise<void>(r => { resolvePromise = r; }));
    render(<NoteEditor note={mockNote} onSave={slowSave} onCancel={onCancel} />);
    fireEvent.submit(screen.getByRole('button', { name: 'notebook.save' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'notebook.saving' })).toBeDisabled();
    });
    resolvePromise!();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'notebook.save' })).not.toBeDisabled();
    });
  });

  it('logs analytics event on save', async () => {
    render(<NoteEditor note={null} onSave={onSave} onCancel={onCancel} />);
    fireEvent.change(screen.getByLabelText('notebook.noteTitle'), { target: { value: 'Title' } });
    fireEvent.submit(screen.getByRole('button', { name: 'notebook.save' }));
    await waitFor(() => {
      expect(window.__logAnalyticsEvent).toHaveBeenCalledWith('note_save', { is_new: true });
    });
  });
});
