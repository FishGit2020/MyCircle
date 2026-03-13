import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FamilyGames from './FamilyGames';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  PageContent: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
  WindowEvents: { BREADCRUMB_DETAIL: 'breadcrumb-detail' },
}));

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
}));

// Mock lazy-loaded game components
vi.mock('./TriviaGame', () => ({ default: () => <div>TriviaGame</div> }));
vi.mock('./MathGame', () => ({ default: () => <div>MathGame</div> }));
vi.mock('./WordGame', () => ({ default: () => <div>WordGame</div> }));
vi.mock('./MemoryGame', () => ({ default: () => <div>MemoryGame</div> }));
vi.mock('./HeadsUpGame', () => ({ default: () => <div>HeadsUpGame</div> }));
vi.mock('./ReactionGame', () => ({ default: () => <div>ReactionGame</div> }));
vi.mock('./SimonGame', () => ({ default: () => <div>SimonGame</div> }));
vi.mock('./SequenceGame', () => ({ default: () => <div>SequenceGame</div> }));
vi.mock('./ColorMatchGame', () => ({ default: () => <div>ColorMatchGame</div> }));
vi.mock('./MazeGame', () => ({ default: () => <div>MazeGame</div> }));
vi.mock('./AnagramGame', () => ({ default: () => <div>AnagramGame</div> }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FamilyGames', () => {
  it('renders the title and subtitle', () => {
    render(<FamilyGames />);
    expect(screen.getByText('games.title')).toBeInTheDocument();
    expect(screen.getByText('games.subtitle')).toBeInTheDocument();
  });

  it('renders game cards for all game types', () => {
    render(<FamilyGames />);
    // Text appears in both GameCard title and Scoreboard, so use getAllByText
    expect(screen.getAllByText('games.trivia').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('games.mathChallenge').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('games.wordGame').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('games.memoryMatch').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('games.headsUp').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the scoreboard section', () => {
    render(<FamilyGames />);
    expect(screen.getByText('games.scoreboard')).toBeInTheDocument();
  });
});
