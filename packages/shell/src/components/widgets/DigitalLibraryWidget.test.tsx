import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DigitalLibraryWidget from './DigitalLibraryWidget';

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: {
    BOOK_BOOKMARKS: 'book_bookmarks',
    BOOK_LAST_PLAYED: 'book_last_played',
    BOOK_AUDIO_PROGRESS: 'book_audio_progress',
  },
  WindowEvents: {
    BOOK_BOOKMARKS_CHANGED: 'book-bookmarks-changed',
    BOOK_LAST_PLAYED_CHANGED: 'book-last-played-changed',
  },
  subscribeToMFEvent: () => () => {},
  MFEvents: { AUDIO_PLAY: 'audio-play' },
}));

describe('DigitalLibraryWidget', () => {
  it('renders without crashing', () => {
    render(<DigitalLibraryWidget />);
    expect(screen.getByText('widgets.digitalLibrary')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<DigitalLibraryWidget />);
    expect(screen.getByText('widgets.digitalLibraryDesc')).toBeInTheDocument();
  });

  it('shows no audiobook message when no data', () => {
    render(<DigitalLibraryWidget />);
    expect(screen.getByText('widgets.noAudiobook')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<DigitalLibraryWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.digitalLibrary');
  });
});
