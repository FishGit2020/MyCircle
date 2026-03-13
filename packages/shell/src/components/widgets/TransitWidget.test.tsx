import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TransitWidget from './TransitWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { TRANSIT_FAVORITES: 'transit_favorites' },
  WindowEvents: { TRANSIT_FAVORITES_CHANGED: 'transit-favorites-changed' },
}));

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
}));

describe('TransitWidget', () => {
  it('renders without crashing', () => {
    render(<TransitWidget />);
    expect(screen.getByText('widgets.transit')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<TransitWidget />);
    expect(screen.getByText('widgets.transitDesc')).toBeInTheDocument();
  });

  it('shows no favorites message when no data', () => {
    render(<TransitWidget />);
    expect(screen.getByText('widgets.transitNoFavorites')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<TransitWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.transit');
  });
});
