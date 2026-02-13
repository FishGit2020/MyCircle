import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HistoricalWeather from './HistoricalWeather';
import type { CurrentWeather, HistoricalWeatherDay } from '@mycircle/shared';

const mockCurrent: CurrentWeather = {
  temp: 22,
  feels_like: 20,
  temp_min: 18,
  temp_max: 25,
  pressure: 1013,
  humidity: 65,
  weather: [
    { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
  ],
  wind: { speed: 5.5, deg: 180, gust: 8 },
  clouds: { all: 10 },
  dt: 1620000000,
  timezone: 0,
};

const mockHistorical: HistoricalWeatherDay = {
  date: '2024-02-12',
  temp_max: 20,
  temp_min: 12,
  precipitation: 2.5,
  wind_speed_max: 18,
  weather_description: 'Partly cloudy',
  weather_icon: '02d',
};

describe('HistoricalWeather', () => {
  it('renders the section title', () => {
    render(<HistoricalWeather current={mockCurrent} historical={mockHistorical} />);
    expect(screen.getByText('This Day Last Year')).toBeInTheDocument();
  });

  it('renders today and last year labels', () => {
    render(<HistoricalWeather current={mockCurrent} historical={mockHistorical} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Last Year')).toBeInTheDocument();
  });

  it('renders current weather description', () => {
    render(<HistoricalWeather current={mockCurrent} historical={mockHistorical} />);
    expect(screen.getByText('clear sky')).toBeInTheDocument();
  });

  it('renders historical weather description', () => {
    render(<HistoricalWeather current={mockCurrent} historical={mockHistorical} />);
    expect(screen.getByText('Partly cloudy')).toBeInTheDocument();
  });

  it('renders current temperatures', () => {
    render(<HistoricalWeather current={mockCurrent} historical={mockHistorical} />);
    // Today: High 25°C, Low 18°C
    expect(screen.getByText('25°C')).toBeInTheDocument();
    expect(screen.getByText('18°C')).toBeInTheDocument();
  });

  it('renders historical temperatures', () => {
    render(<HistoricalWeather current={mockCurrent} historical={mockHistorical} />);
    // Last year: High 20°C, Low 12°C
    expect(screen.getByText('20°C')).toBeInTheDocument();
    expect(screen.getByText('12°C')).toBeInTheDocument();
  });

  it('renders historical precipitation', () => {
    render(<HistoricalWeather current={mockCurrent} historical={mockHistorical} />);
    expect(screen.getByText('2.5 mm')).toBeInTheDocument();
  });

  it('shows temperature difference badge (warmer)', () => {
    render(<HistoricalWeather current={mockCurrent} historical={mockHistorical} />);
    // Diff = 25 - 20 = 5 → "5°C warmer"
    expect(screen.getByRole('status')).toHaveTextContent('5°C');
    expect(screen.getByRole('status')).toHaveTextContent('warmer');
  });

  it('shows cooler badge when last year was warmer', () => {
    const coolerCurrent = { ...mockCurrent, temp_max: 15 };
    render(<HistoricalWeather current={coolerCurrent} historical={mockHistorical} />);
    // Diff = 15 - 20 = -5 → "5°C cooler"
    expect(screen.getByRole('status')).toHaveTextContent('5°C');
    expect(screen.getByRole('status')).toHaveTextContent('cooler');
  });

  it('does not show difference badge when temperatures are equal', () => {
    const sameCurrent = { ...mockCurrent, temp_max: 20 };
    render(<HistoricalWeather current={sameCurrent} historical={mockHistorical} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('has proper aria-labelledby on the section', () => {
    render(<HistoricalWeather current={mockCurrent} historical={mockHistorical} />);
    const section = screen.getByRole('region');
    expect(section).toHaveAttribute('aria-labelledby', 'historical-weather-title');
  });

  it('renders weather icons with alt text', () => {
    render(<HistoricalWeather current={mockCurrent} historical={mockHistorical} />);
    expect(screen.getByAltText('clear sky')).toBeInTheDocument();
    expect(screen.getByAltText('Partly cloudy')).toBeInTheDocument();
  });
});
