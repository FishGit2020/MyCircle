import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SetlistEditor from './SetlistEditor';
import type { WorshipSongListItem } from '../types';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockSongs: WorshipSongListItem[] = [
  { id: 's1', title: 'Amazing Grace', artist: 'Hymn', originalKey: 'G', tags: [], format: 'chordpro', isFavorite: false },
  { id: 's2', title: 'How Great Thou Art', artist: 'Classic', originalKey: 'A', tags: [], format: 'chordpro', isFavorite: false },
];

describe('SetlistEditor', () => {
  let onSave: ReturnType<typeof vi.fn>;
  let onCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSave = vi.fn().mockResolvedValue(undefined);
    onCancel = vi.fn();
  });

  it('renders new setlist form with empty name', () => {
    render(<SetlistEditor allSongs={mockSongs} songsLoading={false} onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByText('worship.newSetlist')).toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: /worship.setlistName/i });
    expect(input).toHaveValue('');
  });

  it('shows name required error when saving without a name', async () => {
    render(<SetlistEditor allSongs={mockSongs} songsLoading={false} onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('worship.save'));
    expect(await screen.findByText('worship.setlistNameRequired')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with name and entries when valid', async () => {
    render(<SetlistEditor allSongs={mockSongs} songsLoading={false} onSave={onSave} onCancel={onCancel} />);
    fireEvent.change(screen.getByRole('textbox', { name: /worship.setlistName/i }), {
      target: { value: 'Sunday Service' },
    });
    fireEvent.click(screen.getByText('worship.save'));
    await vi.waitFor(() => expect(onSave).toHaveBeenCalledWith({
      name: 'Sunday Service',
      serviceDate: undefined,
      entries: [],
    }));
  });

  it('adds a song to the entry list', () => {
    render(<SetlistEditor allSongs={mockSongs} songsLoading={false} onSave={onSave} onCancel={onCancel} />);
    // Before adding: song only appears in the search list (1 instance)
    expect(screen.getAllByText('Amazing Grace')).toHaveLength(1);
    fireEvent.click(screen.getAllByText('worship.addSongToSetlist')[0]);
    // After adding: song appears in entries AND search list (2 instances)
    expect(screen.getAllByText('Amazing Grace')).toHaveLength(2);
  });

  it('removes a song from the entry list', () => {
    render(<SetlistEditor allSongs={mockSongs} songsLoading={false} onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getAllByText('worship.addSongToSetlist')[0]);
    const removeButton = screen.getByRole('button', { name: /remove from setlist/i });
    fireEvent.click(removeButton);
    expect(screen.getByText('worship.emptySetlist')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', () => {
    render(<SetlistEditor allSongs={mockSongs} songsLoading={false} onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('worship.cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows edit title when setlist prop is provided', () => {
    const existingSetlist = {
      id: 'sl-1', name: 'Existing', serviceDate: null, entries: [], createdAt: '', updatedAt: '', createdBy: 'u1',
    };
    render(<SetlistEditor setlist={existingSetlist} allSongs={mockSongs} songsLoading={false} onSave={onSave} onCancel={onCancel} />);
    expect(screen.getByText('worship.editSetlist')).toBeInTheDocument();
  });

  it('shows delete button when onDelete is provided', () => {
    const existingSetlist = {
      id: 'sl-1', name: 'Existing', serviceDate: null, entries: [], createdAt: '', updatedAt: '', createdBy: 'u1',
    };
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(
      <SetlistEditor setlist={existingSetlist} allSongs={mockSongs} songsLoading={false} onSave={onSave} onDelete={onDelete} onCancel={onCancel} />,
    );
    expect(screen.getByText('worship.deleteSetlist')).toBeInTheDocument();
  });

  it('filters songs by search query', () => {
    render(<SetlistEditor allSongs={mockSongs} songsLoading={false} onSave={onSave} onCancel={onCancel} />);
    fireEvent.change(screen.getByRole('textbox', { name: /worship.search/i }), {
      target: { value: 'Amazing' },
    });
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
    expect(screen.queryByText('How Great Thou Art')).not.toBeInTheDocument();
  });
});
