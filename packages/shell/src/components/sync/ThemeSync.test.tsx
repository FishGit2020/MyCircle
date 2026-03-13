import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ThemeSync from './ThemeSync';

const mockSetThemeFromProfile = vi.fn();

vi.mock('@mycircle/shared', () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    profile: { darkMode: true, theme: 'system' },
    loading: false,
  }),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    setThemeFromProfile: mockSetThemeFromProfile,
  }),
}));

describe('ThemeSync', () => {
  it('renders nothing (returns null)', () => {
    const { container } = render(<ThemeSync />);
    expect(container.innerHTML).toBe('');
  });

  it('calls setThemeFromProfile when profile is available', () => {
    render(<ThemeSync />);
    expect(mockSetThemeFromProfile).toHaveBeenCalledWith(true, 'system');
  });
});
