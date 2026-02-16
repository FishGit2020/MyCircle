import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HourlyForecast from './HourlyForecast';
import type { HourlyForecast as HourlyForecastType } from '@mycircle/shared';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'weather.now': 'Now',
        'weather.hourlyForecast': 'Hourly Forecast',
      };
      return map[key] ?? key;
    },
    locale: 'en-US',
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  useUnits: () => ({ tempUnit: 'celsius' }),
  getWeatherIconUrl: (icon: string) => `https://openweathermap.org/img/wn/${icon}@2x.png`,
  formatTemperature: (temp: number) => `${Math.round(temp)}°C`,
}));

const now = Math.floor(Date.now() / 1000);
const mockHourly: HourlyForecastType[] = Array.from({ length: 12 }, (_, i) => ({
  dt: now + i * 3600,
  temp: 20 + i,
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  pop: i === 2 ? 0.7 : 0,
  wind_speed: 3 + i,
}));

describe('HourlyForecast', () => {
  it('renders 12 hourly cards', () => {
    render(<HourlyForecast data={mockHourly} />);
    const temps = screen.getAllByText(/°C/);
    expect(temps).toHaveLength(12);
  });

  it('shows "Now" for the first hour', () => {
    render(<HourlyForecast data={mockHourly} />);
    expect(screen.getByText('Now')).toBeInTheDocument();
  });

  it('shows rain probability when > 0', () => {
    render(<HourlyForecast data={mockHourly} />);
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('renders weather icons', () => {
    render(<HourlyForecast data={mockHourly} />);
    const icons = screen.getAllByRole('img');
    expect(icons).toHaveLength(12);
    expect(icons[0]).toHaveAttribute('alt', 'clear sky');
  });

  it('shows wind speed for each hour', () => {
    render(<HourlyForecast data={mockHourly} />);
    // First hour: wind_speed = 3
    expect(screen.getByText('3 m/s')).toBeInTheDocument();
  });

  it('has scrollable region with accessible label', () => {
    render(<HourlyForecast data={mockHourly} />);
    expect(screen.getByRole('region', { name: 'Hourly Forecast' })).toBeInTheDocument();
  });

  it('limits display to 12 hours even with more data', () => {
    const extraData = Array.from({ length: 24 }, (_, i) => ({
      dt: now + i * 3600,
      temp: 20,
      weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
      pop: 0,
      wind_speed: 5,
    }));
    render(<HourlyForecast data={extraData} />);
    const temps = screen.getAllByText('20°C');
    expect(temps).toHaveLength(12);
  });
});
