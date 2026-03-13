import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WorshipWidget from './WorshipWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { WORSHIP_FAVORITES: 'worship_favorites' },
  WindowEvents: { WORSHIP_FAVORITES_CHANGED: 'worship-favorites-changed' },
  useQuery: () => ({ data: null }),
  GET_WORSHIP_SONGS_LIST: 'GET_WORSHIP_SONGS_LIST',
}));

describe('WorshipWidget', () => {
  it('renders without crashing', () => {
    render(<WorshipWidget />);
    expect(screen.getByText('widgets.worship')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<WorshipWidget />);
    expect(screen.getByText('widgets.worshipDesc')).toBeInTheDocument();
  });

  it('shows no songs message when no data', () => {
    render(<WorshipWidget />);
    expect(screen.getByText('widgets.noWorshipSongs')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<WorshipWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.worship');
  });
});
