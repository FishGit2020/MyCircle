import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SetlistPresenter from './SetlistPresenter';
import type { Setlist, WorshipSong } from '../types';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./SongViewer', () => ({
  default: ({ song }: { song: WorshipSong }) => <div data-testid="song-viewer">{song.title}</div>,
}));

const makeSetlist = (entries: Setlist['entries']): Setlist => ({
  id: 'sl-1',
  name: 'Sunday Service',
  serviceDate: '2026-03-20',
  entries,
  createdAt: '',
  updatedAt: '',
  createdBy: 'u1',
});

const makeSong = (id: string, title: string): WorshipSong => ({
  id,
  title,
  artist: 'Test Artist',
  originalKey: 'G',
  content: '[G]Hello',
  format: 'chordpro',
  bpm: 120,
  notes: '',
  tags: [],
  isFavorite: false,
  createdAt: '',
  updatedAt: '',
  createdBy: 'u1',
});

describe('SetlistPresenter', () => {
  let onExit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onExit = vi.fn();
  });

  const entries = [
    { songId: 's1', position: 0, snapshotTitle: 'Song One', snapshotKey: 'G' },
    { songId: 's2', position: 1, snapshotTitle: 'Song Two', snapshotKey: 'A' },
    { songId: 's3', position: 2, snapshotTitle: 'Song Three', snapshotKey: 'C' },
  ];
  const songs: Record<string, WorshipSong | null> = {
    s1: makeSong('s1', 'Song One'),
    s2: makeSong('s2', 'Song Two'),
    s3: makeSong('s3', 'Song Three'),
  };

  it('renders first song and progress label', () => {
    const setlist = makeSetlist(entries);
    render(<SetlistPresenter setlist={setlist} songs={songs} onExit={onExit} />);
    expect(screen.getByTestId('song-viewer')).toHaveTextContent('Song One');
    // t('worship.songOfTotal') returns the key string with placeholders replaced
    expect(screen.getByText('worship.songOfTotal')).toBeInTheDocument();
  });

  it('previous button is disabled on first song', () => {
    const setlist = makeSetlist(entries);
    render(<SetlistPresenter setlist={setlist} songs={songs} onExit={onExit} />);
    expect(screen.getByRole('button', { name: /previous song/i })).toBeDisabled();
  });

  it('navigates to next song on Next click', () => {
    const setlist = makeSetlist(entries);
    render(<SetlistPresenter setlist={setlist} songs={songs} onExit={onExit} />);
    fireEvent.click(screen.getByRole('button', { name: /next song/i }));
    expect(screen.getByTestId('song-viewer')).toHaveTextContent('Song Two');
  });

  it('navigates back to previous song on Prev click', () => {
    const setlist = makeSetlist(entries);
    render(<SetlistPresenter setlist={setlist} songs={songs} onExit={onExit} />);
    fireEvent.click(screen.getByRole('button', { name: /next song/i }));
    fireEvent.click(screen.getByRole('button', { name: /previous song/i }));
    expect(screen.getByTestId('song-viewer')).toHaveTextContent('Song One');
  });

  it('next button is disabled on last song', () => {
    const setlist = makeSetlist(entries);
    render(<SetlistPresenter setlist={setlist} songs={songs} onExit={onExit} />);
    fireEvent.click(screen.getByRole('button', { name: /next song/i }));
    fireEvent.click(screen.getByRole('button', { name: /next song/i }));
    expect(screen.getByRole('button', { name: /next song/i })).toBeDisabled();
  });

  it('shows end of setlist notice on last song', () => {
    const setlist = makeSetlist(entries);
    render(<SetlistPresenter setlist={setlist} songs={songs} onExit={onExit} />);
    fireEvent.click(screen.getByRole('button', { name: /next song/i }));
    fireEvent.click(screen.getByRole('button', { name: /next song/i }));
    expect(screen.getByText('worship.endOfSetlist')).toBeInTheDocument();
  });

  it('shows song not found when song is null', () => {
    const setlist = makeSetlist([{ songId: 'missing', position: 0, snapshotTitle: 'Lost Song', snapshotKey: 'D' }]);
    render(<SetlistPresenter setlist={setlist} songs={{ missing: null }} onExit={onExit} />);
    expect(screen.getByText('worship.songNotFound')).toBeInTheDocument();
    expect(screen.getByText(/Lost Song/)).toBeInTheDocument();
  });

  it('calls onExit when exit button clicked', () => {
    const setlist = makeSetlist(entries);
    render(<SetlistPresenter setlist={setlist} songs={songs} onExit={onExit} />);
    fireEvent.click(screen.getByRole('button', { name: /exit service mode/i }));
    expect(onExit).toHaveBeenCalled();
  });
});
