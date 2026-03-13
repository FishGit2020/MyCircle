import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FamilyGamesWidget from './FamilyGamesWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('FamilyGamesWidget', () => {
  it('renders without crashing', () => {
    render(<FamilyGamesWidget />);
    expect(screen.getByText('widgets.familyGames')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<FamilyGamesWidget />);
    expect(screen.getByText('widgets.familyGamesDesc')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<FamilyGamesWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.familyGames');
  });
});
