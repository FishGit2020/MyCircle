import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FlashcardView from './FlashcardView';
import type { ChineseCharacter } from '../data/characters';

const mockCharacters: ChineseCharacter[] = [
  { id: 'f01', character: '妈妈', pinyin: 'māma', meaning: 'mom', category: 'family' },
  { id: 'f02', character: '爸爸', pinyin: 'bàba', meaning: 'dad', category: 'family' },
  { id: 'f03', character: '哥哥', pinyin: 'gēge', meaning: 'older brother', category: 'family' },
];

describe('FlashcardView', () => {
  const defaultProps = {
    characters: mockCharacters,
    masteredIds: new Set<string>(),
    onToggleMastered: vi.fn(),
    onPractice: vi.fn(),
  };

  it('shows the first character', () => {
    render(<FlashcardView {...defaultProps} />);
    expect(screen.getByTestId('flashcard-character')).toHaveTextContent('妈妈');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('flips the card on click to show pinyin and meaning', async () => {
    const user = userEvent.setup();
    render(<FlashcardView {...defaultProps} />);

    await user.click(screen.getByTestId('flashcard'));
    expect(screen.getByTestId('flashcard-pinyin')).toHaveTextContent('māma');
    expect(screen.getByTestId('flashcard-meaning')).toHaveTextContent('mom');
  });

  it('navigates to next character', async () => {
    const user = userEvent.setup();
    render(<FlashcardView {...defaultProps} />);

    await user.click(screen.getByText('Next'));
    expect(screen.getByTestId('flashcard-character')).toHaveTextContent('爸爸');
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('navigates to previous character (wraps around)', async () => {
    const user = userEvent.setup();
    render(<FlashcardView {...defaultProps} />);

    await user.click(screen.getByText('Previous'));
    expect(screen.getByTestId('flashcard-character')).toHaveTextContent('哥哥');
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('calls onToggleMastered when mark button is clicked', async () => {
    const onToggleMastered = vi.fn();
    const user = userEvent.setup();
    render(<FlashcardView {...defaultProps} onToggleMastered={onToggleMastered} />);

    await user.click(screen.getByTestId('toggle-mastered'));
    expect(onToggleMastered).toHaveBeenCalledWith('f01');
  });

  it('shows mastered state for a character', () => {
    render(<FlashcardView {...defaultProps} masteredIds={new Set(['f01'])} />);
    expect(screen.getByTestId('toggle-mastered')).toHaveTextContent('Unmark');
  });

  it('calls onPractice when practice button is clicked', async () => {
    const onPractice = vi.fn();
    const user = userEvent.setup();
    render(<FlashcardView {...defaultProps} onPractice={onPractice} />);

    await user.click(screen.getByText('Practice Writing'));
    expect(onPractice).toHaveBeenCalledWith(mockCharacters[0]);
  });
});
