import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ThemeToggle from './ThemeToggle';

const mockToggleTheme = vi.fn();
const mockUpdateDarkMode = vi.fn().mockResolvedValue(undefined);

vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: mockToggleTheme,
  }),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: '123' },
    updateDarkMode: mockUpdateDarkMode,
  }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe('ThemeToggle', () => {
  it('renders with accessible label', () => {
    render(<ThemeToggle />);
    expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
  });

  it('calls toggleTheme when clicked', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockToggleTheme).toHaveBeenCalledOnce();
  });

  it('saves dark mode preference for signed-in user', async () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockUpdateDarkMode).toHaveBeenCalledWith(true);
    });
  });

  it('handles save error gracefully', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockUpdateDarkMode.mockRejectedValueOnce(new Error('save failed'));

    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });
    errorSpy.mockRestore();
  });
});
