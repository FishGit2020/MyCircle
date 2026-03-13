import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import WeatherWidget from './WeatherWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    favoriteCities: [
      { id: '40.71,-74', name: 'New York', lat: 40.71, lon: -74, country: 'US' },
      { id: '51.5,-0.12', name: 'London', lat: 51.5, lon: -0.12, country: 'UK' },
    ],
  }),
}));

describe('WeatherWidget', () => {
  it('renders weather title', () => {
    render(<MemoryRouter><WeatherWidget /></MemoryRouter>);
    expect(screen.getByText('widgets.weather')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<MemoryRouter><WeatherWidget /></MemoryRouter>);
    expect(screen.getByText('widgets.weatherDesc')).toBeInTheDocument();
  });

  it('renders favorite city links', () => {
    render(<MemoryRouter><WeatherWidget /></MemoryRouter>);
    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
  });

  it('renders links with correct paths', () => {
    render(<MemoryRouter><WeatherWidget /></MemoryRouter>);
    const nyLink = screen.getByText('New York').closest('a');
    expect(nyLink).toHaveAttribute('href', expect.stringContaining('/weather/40.71,-74'));
  });
});
