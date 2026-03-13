import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FlashcardsWidget from './FlashcardsWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { FLASHCARD_PROGRESS: 'flashcard_progress' },
  WindowEvents: { FLASHCARD_PROGRESS_CHANGED: 'flashcard-progress-changed' },
}));

describe('FlashcardsWidget', () => {
  it('renders without crashing', () => {
    render(<FlashcardsWidget />);
    expect(screen.getByText('widgets.flashcards')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<FlashcardsWidget />);
    expect(screen.getByText('widgets.flashcardsDesc')).toBeInTheDocument();
  });

  it('shows no progress message when no data', () => {
    render(<FlashcardsWidget />);
    expect(screen.getByText('widgets.noFlashcardProgress')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<FlashcardsWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.flashcards');
  });
});
