import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import FavoriteButton from './FavoriteButton';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router', () => ({
  useParams: () => ({ coords: undefined }),
  useSearchParams: () => [new URLSearchParams()],
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    favoriteCities: [],
    toggleFavorite: vi.fn(),
  }),
}));

describe('FavoriteButton', () => {
  it('renders nothing when user is null', () => {
    const { container } = render(<FavoriteButton />);
    expect(container.innerHTML).toBe('');
  });
});
