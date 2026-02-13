import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import SongViewer from './SongViewer';
import type { WorshipSong } from '../types';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  StorageKeys: {
    WORSHIP_SCROLL_SPEED: 'worship-scroll-speed',
  },
}));

vi.mock('../utils/transpose', () => ({
  transposeContent: (content: string) => content,
  transposeChord: (chord: string) => chord,
}));

const baseSong: WorshipSong = {
  id: '1',
  title: 'Amazing Grace',
  artist: 'John Newton',
  originalKey: 'G',
  format: 'chordpro',
  content: '[G]Amazing [C]grace',
  notes: 'Play softly',
  tags: ['hymn'],
  createdAt: { seconds: 1700000000, nanoseconds: 0 },
  updatedAt: { seconds: 1700000000, nanoseconds: 0 },
};

describe('SongViewer', () => {
  const onEdit = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('does not show YouTube button when song has no YouTube URL', () => {
    render(<SongViewer song={baseSong} isAuthenticated onEdit={onEdit} onBack={onBack} />);
    expect(screen.queryByText('worship.watchOnYoutube')).not.toBeInTheDocument();
  });

  it('shows YouTube button when song has a YouTube URL', () => {
    const songWithYoutube = { ...baseSong, youtubeUrl: 'https://youtube.com/watch?v=abc123' };
    render(<SongViewer song={songWithYoutube} isAuthenticated onEdit={onEdit} onBack={onBack} />);

    const link = screen.getByText('worship.watchOnYoutube');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', 'https://youtube.com/watch?v=abc123');
    expect(link.closest('a')).toHaveAttribute('target', '_blank');
    expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders song title and artist', () => {
    render(<SongViewer song={baseSong} isAuthenticated onEdit={onEdit} onBack={onBack} />);
    expect(screen.getByText('Amazing Grace')).toBeInTheDocument();
    expect(screen.getByText('John Newton')).toBeInTheDocument();
  });

  it('renders the edit button when authenticated', () => {
    render(<SongViewer song={baseSong} isAuthenticated onEdit={onEdit} onBack={onBack} />);
    expect(screen.getByText('worship.editSong')).toBeInTheDocument();
  });

  it('hides edit button when not authenticated', () => {
    render(<SongViewer song={baseSong} isAuthenticated={false} onEdit={onEdit} onBack={onBack} />);
    expect(screen.queryByText('worship.editSong')).not.toBeInTheDocument();
  });
});
