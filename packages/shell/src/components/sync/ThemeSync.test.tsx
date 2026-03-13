import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ThemeSync from './ThemeSync';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    profile: null,
    loading: false,
  }),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    setThemeFromProfile: vi.fn(),
  }),
}));

describe('ThemeSync', () => {
  it('renders nothing (returns null)', () => {
    const { container } = render(<ThemeSync />);
    expect(container.innerHTML).toBe('');
  });
});
