import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SpeedToggle from './SpeedToggle';

vi.mock('@mycircle/shared', () => ({
  eventBus: { publish: vi.fn() },
  MFEvents: { THEME_CHANGED: 'theme-changed' },
  WindowEvents: { UNITS_CHANGED: 'units-changed' },
  StorageKeys: { SPEED_UNIT: 'mycircle-speed-unit' },
  SpeedUnit: {},
}));

describe('SpeedToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders with default m/s unit', () => {
    render(<SpeedToggle />);
    expect(screen.getByText('m/s')).toBeInTheDocument();
  });

  it('reads initial unit from localStorage', () => {
    localStorage.setItem('mycircle-speed-unit', 'mph');
    render(<SpeedToggle />);
    expect(screen.getByText('mph')).toBeInTheDocument();
  });

  it('cycles through ms → kmh → mph → ms', () => {
    render(<SpeedToggle />);
    const btn = screen.getByRole('button');
    expect(screen.getByText('m/s')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(screen.getByText('km/h')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(screen.getByText('mph')).toBeInTheDocument();

    fireEvent.click(btn);
    expect(screen.getByText('m/s')).toBeInTheDocument();
  });

  it('saves to localStorage on toggle', () => {
    render(<SpeedToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(localStorage.getItem('mycircle-speed-unit')).toBe('kmh');
  });

  it('has accessible aria-label', () => {
    render(<SpeedToggle />);
    expect(screen.getByLabelText(/Speed unit/)).toBeInTheDocument();
  });

  it('dispatches UNITS_CHANGED window event', () => {
    const spy = vi.fn();
    window.addEventListener('units-changed', spy);
    render(<SpeedToggle />);
    fireEvent.click(screen.getByRole('button'));
    expect(spy).toHaveBeenCalled();
    window.removeEventListener('units-changed', spy);
  });
});
