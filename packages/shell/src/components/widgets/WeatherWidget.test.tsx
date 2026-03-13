import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WeatherWidget from './WeatherWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ favoriteCities: [] }),
}));

vi.mock('react-router', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

describe('WeatherWidget', () => {
  it('renders without crashing', () => {
    render(<WeatherWidget />);
    expect(screen.getByText('widgets.weather')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<WeatherWidget />);
    expect(screen.getByText('widgets.weatherDesc')).toBeInTheDocument();
  });

  it('shows no favorite city message when no data', () => {
    render(<WeatherWidget />);
    expect(screen.getByText('widgets.noFavoriteCity')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<WeatherWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.weather');
  });
});
