import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RadioWidget from './RadioWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { RADIO_FAVORITES: 'radio_favorites' },
  WindowEvents: {
    RADIO_CHANGED: 'radio-changed',
    AUTH_STATE_CHANGED: 'auth-state-changed',
  },
}));

describe('RadioWidget', () => {
  it('renders without crashing', () => {
    render(<RadioWidget />);
    expect(screen.getByText('widgets.radio')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<RadioWidget />);
    expect(screen.getByText('widgets.radioDesc')).toBeInTheDocument();
  });

  it('shows no favorites message when no data', () => {
    render(<RadioWidget />);
    expect(screen.getByText('widgets.radioNoFavorites')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<RadioWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.radio');
  });
});
