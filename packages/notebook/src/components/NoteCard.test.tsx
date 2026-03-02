import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteCard from './NoteCard';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const baseNote = {
  id: 'n1',
  title: 'My Note',
  content: 'Some content here that is long enough to test truncation',
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

describe('NoteCard', () => {
  const onClick = vi.fn();
  const onDelete = vi.fn();

  it('renders note title and content preview', () => {
    render(<NoteCard note={baseNote} onClick={onClick} onDelete={onDelete} />);
    expect(screen.getByText('My Note')).toBeInTheDocument();
    expect(screen.getByText(/Some content/)).toBeInTheDocument();
  });

  it('calls onClick when card clicked', () => {
    render(<NoteCard note={baseNote} onClick={onClick} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /My Note/ }));
    expect(onClick).toHaveBeenCalled();
  });

  it('calls onClick on Enter key', () => {
    render(<NoteCard note={baseNote} onClick={onClick} onDelete={onDelete} />);
    fireEvent.keyDown(screen.getByRole('button', { name: /My Note/ }), { key: 'Enter' });
    expect(onClick).toHaveBeenCalled();
  });

  it('calls onClick on Space key', () => {
    render(<NoteCard note={baseNote} onClick={onClick} onDelete={onDelete} />);
    fireEvent.keyDown(screen.getByRole('button', { name: /My Note/ }), { key: ' ' });
    expect(onClick).toHaveBeenCalled();
  });

  it('calls onDelete when delete button clicked', () => {
    render(<NoteCard note={baseNote} onClick={onClick} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText('notebook.deleteNote'));
    expect(onDelete).toHaveBeenCalled();
  });

  it('shows public badge for public notes', () => {
    const publicNote = { ...baseNote, isPublic: true as const, createdBy: { uid: 'u1', displayName: 'Alice' } };
    render(<NoteCard note={publicNote} onClick={onClick} onDelete={onDelete} />);
    expect(screen.getByText('notebook.public')).toBeInTheDocument();
    // t() returns key, and replace('{name}', 'Alice') won't match since key has no {name}
    expect(screen.getByText('notebook.publishedBy')).toBeInTheDocument();
  });

  it('does not show public badge for private notes', () => {
    render(<NoteCard note={baseNote} onClick={onClick} onDelete={onDelete} />);
    expect(screen.queryByText('notebook.public')).not.toBeInTheDocument();
  });

  it('shows default title when note has no title', () => {
    const untitledNote = { ...baseNote, title: '' };
    render(<NoteCard note={untitledNote} onClick={onClick} onDelete={onDelete} />);
    expect(screen.getByText('notebook.noteTitle')).toBeInTheDocument();
  });

  it('handles Firestore timestamp objects', () => {
    const firestoreNote = { ...baseNote, updatedAt: { toDate: () => new Date('2024-06-01') } };
    render(<NoteCard note={firestoreNote} onClick={onClick} onDelete={onDelete} />);
    // The date is formatted via toLocaleDateString — just verify it renders without crashing
    expect(screen.getByText(/notebook.lastEdited/)).toBeInTheDocument();
  });
});
