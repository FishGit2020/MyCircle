import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UnitToggle from './UnitToggle';

const mockUpdateTempUnit = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'u1' },
    updateTempUnit: mockUpdateTempUnit,
  }),
}));

vi.mock('@mycircle/shared', () => ({
  eventBus: { publish: vi.fn() },
  MFEvents: { THEME_CHANGED: 'theme-changed' },
  WindowEvents: { UNITS_CHANGED: 'units-changed' },
  StorageKeys: { TEMP_UNIT: 'mycircle-temp-unit' },
}));

describe('UnitToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders with default C unit', () => {
    render(<UnitToggle />);
    expect(screen.getByText('°C')).toBeInTheDocument();
  });

  it('reads initial unit from localStorage', () => {
    localStorage.setItem('mycircle-temp-unit', 'F');
    render(<UnitToggle />);
    expect(screen.getByText('°F')).toBeInTheDocument();
  });

  it('toggles from C to F on click', () => {
    render(<UnitToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('°F')).toBeInTheDocument();
    expect(localStorage.getItem('mycircle-temp-unit')).toBe('F');
  });

  it('toggles from F to C on click', () => {
    localStorage.setItem('mycircle-temp-unit', 'F');
    render(<UnitToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('°C')).toBeInTheDocument();
  });

  it('persists to Firestore when signed in', () => {
    render(<UnitToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockUpdateTempUnit).toHaveBeenCalledWith('F');
  });

  it('dispatches UNITS_CHANGED window event', () => {
    const spy = vi.fn();
    window.addEventListener('units-changed', spy);
    render(<UnitToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(spy).toHaveBeenCalled();
    window.removeEventListener('units-changed', spy);
  });
});
