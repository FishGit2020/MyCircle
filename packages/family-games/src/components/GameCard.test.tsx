import { render, screen, fireEvent } from '@testing-library/react';
import GameCard from './GameCard';

// Mock useTranslation
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('GameCard', () => {
  it('renders title and description', () => {
    const onSelect = vi.fn();
    render(
      <GameCard
        type="trivia"
        titleKey="games.trivia"
        descKey="games.triviaDesc"
        color="purple"
        onSelect={onSelect}
        icon={<span data-testid="icon">?</span>}
      />
    );
    expect(screen.getByText('games.trivia')).toBeInTheDocument();
    expect(screen.getByText('games.triviaDesc')).toBeInTheDocument();
  });

  it('calls onSelect with game type when clicked', () => {
    const onSelect = vi.fn();
    render(
      <GameCard
        type="math"
        titleKey="games.mathChallenge"
        descKey="games.mathDesc"
        color="blue"
        onSelect={onSelect}
        icon={<span>+</span>}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('math');
  });

  it('renders the icon', () => {
    render(
      <GameCard
        type="memory"
        titleKey="games.memoryMatch"
        descKey="games.memoryDesc"
        color="orange"
        onSelect={vi.fn()}
        icon={<span data-testid="game-icon">M</span>}
      />
    );
    expect(screen.getByTestId('game-icon')).toBeInTheDocument();
  });
});
