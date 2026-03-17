import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CardPractice from './CardPractice';
import type { FlashCard } from '../types';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./FlipCard', () => ({
  default: ({ front, back, flipped, onFlip }: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
    <div data-testid="flip-card" onClick={onFlip}>
      {flipped ? back : front}
    </div>
  ),
}));

vi.mock('./PracticeCanvas', () => ({
  default: ({ onBack }: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
    <div data-testid="practice-canvas">
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

const mockCards: FlashCard[] = [
  { id: 'c1', type: 'english', category: 'greetings', front: 'Hello', back: 'World' },
  { id: 'c2', type: 'english', category: 'greetings', front: 'Bye', back: 'Adios', meta: { pinyin: 'bái' } },
  { id: 'zh-1', type: 'chinese', category: 'family', front: '妈', back: 'Mom', meta: { pinyin: 'mā' } },
];

describe('CardPractice', () => {
  const onToggleMastered = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it('renders first card', () => {
    render(<CardPractice cards={mockCards} masteredIds={[]} onToggleMastered={onToggleMastered} onClose={onClose} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    // Progress text uses t('flashcards.progress') which returns the key
    expect(screen.getByText('flashcards.progress')).toBeInTheDocument();
  });

  it('navigates to next card', () => {
    render(<CardPractice cards={mockCards} masteredIds={[]} onToggleMastered={onToggleMastered} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('flashcards.next'));
    expect(screen.getByText('Bye')).toBeInTheDocument();
  });

  it('navigates to previous card', () => {
    render(<CardPractice cards={mockCards} masteredIds={[]} onToggleMastered={onToggleMastered} onClose={onClose} startIndex={1} />);
    fireEvent.click(screen.getByLabelText('flashcards.previous'));
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('disables previous on first card', () => {
    render(<CardPractice cards={mockCards} masteredIds={[]} onToggleMastered={onToggleMastered} onClose={onClose} />);
    expect(screen.getByLabelText('flashcards.previous')).toBeDisabled();
  });

  it('disables next on last card', () => {
    render(<CardPractice cards={mockCards} masteredIds={[]} onToggleMastered={onToggleMastered} onClose={onClose} startIndex={2} />);
    expect(screen.getByLabelText('flashcards.next')).toBeDisabled();
  });

  it('flips the card', () => {
    render(<CardPractice cards={mockCards} masteredIds={[]} onToggleMastered={onToggleMastered} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('flashcards.flip'));
    // After flip, FlipCard mock shows back content
    expect(screen.getByText('World')).toBeInTheDocument();
  });

  it('calls onClose when done button clicked', () => {
    render(<CardPractice cards={mockCards} masteredIds={[]} onToggleMastered={onToggleMastered} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('flashcards.done'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onToggleMastered', () => {
    render(<CardPractice cards={mockCards} masteredIds={[]} onToggleMastered={onToggleMastered} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('flashcards.markMastered'));
    expect(onToggleMastered).toHaveBeenCalledWith('c1');
  });

  it('shows unmark mastered for mastered cards', () => {
    render(<CardPractice cards={mockCards} masteredIds={['c1']} onToggleMastered={onToggleMastered} onClose={onClose} />);
    expect(screen.getByLabelText('flashcards.unmarkMastered')).toBeInTheDocument();
  });

  it('shows pinyin for cards with pinyin meta', () => {
    render(<CardPractice cards={mockCards} masteredIds={[]} onToggleMastered={onToggleMastered} onClose={onClose} startIndex={1} />);
    expect(screen.getByText('bái')).toBeInTheDocument();
  });

  it('shows practice button for Chinese cards', () => {
    render(<CardPractice cards={mockCards} masteredIds={[]} onToggleMastered={onToggleMastered} onClose={onClose} startIndex={2} />);
    expect(screen.getByLabelText('chinese.practice')).toBeInTheDocument();
  });

  it('returns null for empty cards', () => {
    const { container } = render(<CardPractice cards={[]} masteredIds={[]} onToggleMastered={onToggleMastered} onClose={onClose} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows reference in card back', () => {
    const cardsWithRef: FlashCard[] = [
      { id: 'b1', type: 'bible-full', category: 'Genesis', front: 'Gen 1:1', back: 'In the beginning...', meta: { reference: 'Genesis 1:1' } },
    ];
    render(<CardPractice cards={cardsWithRef} masteredIds={[]} onToggleMastered={onToggleMastered} onClose={onClose} />);
    expect(screen.getByText('Genesis 1:1')).toBeInTheDocument();
  });
});
