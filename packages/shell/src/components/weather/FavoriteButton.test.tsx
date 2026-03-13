import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FavoriteButton from './FavoriteButton';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const mockToggleFavorite = vi.fn();

vi.mock('react-router', () => ({
  useParams: () => ({ coords: '40.71,-74.0' }),
  useSearchParams: () => [new URLSearchParams('name=New%20York')],
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'u1' },
    favoriteCities: [{ id: '40.71,-74', name: 'New York', lat: 40.71, lon: -74 }],
    toggleFavorite: mockToggleFavorite,
  }),
}));

beforeEach(() => {
  mockToggleFavorite.mockClear();
});

describe('FavoriteButton', () => {
  it('renders the button', () => {
    render(<FavoriteButton />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('shows favorited state when city is in favorites', () => {
    render(<FavoriteButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'favorites.removeFromFavorites');
  });

  it('calls toggleFavorite on click', () => {
    render(<FavoriteButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockToggleFavorite).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '40.71,-74',
        name: 'New York',
        lat: 40.71,
        lon: -74,
      })
    );
  });
});
