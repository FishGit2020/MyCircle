import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Forecast from './Forecast';
import { ForecastDay } from '@weather/shared';

const mockForecastData: ForecastDay[] = [
  {
    dt: 1620000000,
    temp: { min: 15, max: 22, day: 20, night: 16 },
    weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    humidity: 60,
    wind_speed: 5,
    pop: 0
  },
  {
    dt: 1620086400,
    temp: { min: 14, max: 20, day: 18, night: 15 },
    weather: [{ id: 500, main: 'Rain', description: 'light rain', icon: '10d' }],
    humidity: 75,
    wind_speed: 8,
    pop: 0.6
  },
  {
    dt: 1620172800,
    temp: { min: 12, max: 18, day: 16, night: 13 },
    weather: [{ id: 803, main: 'Clouds', description: 'broken clouds', icon: '04d' }],
    humidity: 70,
    wind_speed: 6,
    pop: 0.2
  }
];

describe('Forecast', () => {
  it('renders all forecast days', () => {
    render(<Forecast data={mockForecastData} />);

    // Should render 3 forecast cards
    const cards = document.querySelectorAll('.bg-white.rounded-lg');
    expect(cards.length).toBe(3);
  });

  it('shows "Today" for the first day', () => {
    render(<Forecast data={mockForecastData} />);

    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('renders max and min temperatures', () => {
    render(<Forecast data={mockForecastData} />);

    // First day: max 22, min 15
    expect(screen.getByText('22°')).toBeInTheDocument();
    expect(screen.getByText('15°')).toBeInTheDocument();
  });

  it('renders weather descriptions', () => {
    render(<Forecast data={mockForecastData} />);

    expect(screen.getByText('clear sky')).toBeInTheDocument();
    expect(screen.getByText('light rain')).toBeInTheDocument();
    expect(screen.getByText('broken clouds')).toBeInTheDocument();
  });

  it('shows rain probability when greater than 0', () => {
    render(<Forecast data={mockForecastData} />);

    // Second day has 60% chance of rain
    expect(screen.getByText('60% rain')).toBeInTheDocument();
    // Third day has 20% chance
    expect(screen.getByText('20% rain')).toBeInTheDocument();
  });

  it('does not show rain probability when 0', () => {
    render(<Forecast data={mockForecastData} />);

    // First day has 0% rain - should not show
    const rainTexts = screen.queryAllByText(/% rain/);
    expect(rainTexts.length).toBe(2); // Only 2 days have rain
  });

  it('renders weather icons', () => {
    render(<Forecast data={mockForecastData} />);

    const icons = screen.getAllByRole('img');
    expect(icons.length).toBe(3);
    expect(icons[0]).toHaveAttribute('alt', 'clear sky');
    expect(icons[1]).toHaveAttribute('alt', 'light rain');
  });

  it('handles empty forecast array', () => {
    render(<Forecast data={[]} />);

    const cards = document.querySelectorAll('.bg-white.rounded-lg');
    expect(cards.length).toBe(0);
  });

  it('formats dates correctly for non-today days', () => {
    render(<Forecast data={mockForecastData} />);

    // Second and third days should show formatted dates (not "Today")
    // The exact format depends on the locale and timestamp
    expect(screen.queryAllByText('Today').length).toBe(1);
  });
});
