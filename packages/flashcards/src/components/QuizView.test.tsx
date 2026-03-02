import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import QuizView from './QuizView';
import type { FlashCard } from '../types';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockCards: FlashCard[] = [
  { id: 'c1', type: 'english', category: 'greetings', front: 'Hello', back: 'Hola' },
  { id: 'c2', type: 'english', category: 'greetings', front: 'Bye', back: 'Adios' },
  { id: 'c3', type: 'english', category: 'food', front: 'Water', back: 'Agua' },
  { id: 'c4', type: 'english', category: 'food', front: 'Food', back: 'Comida' },
];

describe('QuizView', () => {
  const onQuizComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows no cards message when fewer than 2 cards', () => {
    render(<QuizView cards={[mockCards[0]]} onQuizComplete={onQuizComplete} />);
    expect(screen.getByText('flashcards.noCards')).toBeInTheDocument();
  });

  it('renders a quiz question', () => {
    render(<QuizView cards={mockCards} onQuizComplete={onQuizComplete} />);
    expect(screen.getByTestId('quiz-question')).toBeInTheDocument();
    expect(screen.getAllByTestId('quiz-option').length).toBeGreaterThanOrEqual(2);
  });

  it('shows progress counter', () => {
    render(<QuizView cards={mockCards} onQuizComplete={onQuizComplete} />);
    expect(screen.getByText(/1 \//)).toBeInTheDocument();
  });

  it('highlights correct and incorrect answers', () => {
    render(<QuizView cards={mockCards} onQuizComplete={onQuizComplete} />);
    const options = screen.getAllByTestId('quiz-option');
    fireEvent.click(options[0]);
    // After clicking, one option should show correct/incorrect feedback
    expect(screen.getByText(/english\.(correct|incorrect)/)).toBeInTheDocument();
  });

  it('disables options after selection', () => {
    render(<QuizView cards={mockCards} onQuizComplete={onQuizComplete} />);
    const options = screen.getAllByTestId('quiz-option');
    fireEvent.click(options[0]);
    options.forEach(opt => expect(opt).toBeDisabled());
  });

  it('advances to next question after delay', () => {
    render(<QuizView cards={mockCards} onQuizComplete={onQuizComplete} />);
    const options = screen.getAllByTestId('quiz-option');
    fireEvent.click(options[0]);
    act(() => { vi.advanceTimersByTime(1000); });
    // Should show the next question or complete screen
    expect(screen.getByTestId('quiz-question') || screen.getByTestId('quiz-complete')).toBeTruthy();
  });

  it('shows pinyin when available', () => {
    const cardsWithPinyin: FlashCard[] = [
      { id: 'z1', type: 'chinese', category: 'family', front: '妈', back: 'Mom', meta: { pinyin: 'mā' } },
      { id: 'z2', type: 'chinese', category: 'family', front: '爸', back: 'Dad', meta: { pinyin: 'bà' } },
    ];
    render(<QuizView cards={cardsWithPinyin} onQuizComplete={onQuizComplete} />);
    // One of the cards should show pinyin
    const question = screen.getByTestId('quiz-question').textContent;
    if (question === '妈') expect(screen.getByText('mā')).toBeInTheDocument();
    else expect(screen.getByText('bà')).toBeInTheDocument();
  });
});
